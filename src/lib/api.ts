import type {
  PromptDraft,
  ParamsDraft,
  WorkspaceConfig,
  RunRecord,
  RunMetrics,
} from '@/types'
import {
  compileResponsesRequest,
  compileChatCompletionsRequest,
  generateCurl,
} from './compiler'
import { generateId } from './utils'

interface StreamCallbacks {
  onChunk: (chunk: string) => void
  onDone: (fullText: string) => void
  onError: (error: Error) => void
}

/**
 * Build request URL based on config
 */
function buildUrl(config: WorkspaceConfig): string {
  const base = config.baseURL.replace(/\/$/, '')
  const endpoint =
    config.endpointMode === 'responses'
      ? '/v1/responses'
      : '/v1/chat/completions'

  if (config.useProxy) {
    return `/api/proxy?target=${encodeURIComponent(base + endpoint)}`
  }
  return base + endpoint
}

/**
 * Build request headers
 */
function buildHeaders(config: WorkspaceConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Request-Id': generateId(),
    ...config.headers,
  }

  if (config.apiKey) {
    if (config.useProxy) {
      // 使用代理时，通过 X-API-Key header 传递 API Key
      headers['X-API-Key'] = config.apiKey
    } else {
      // 直接请求时，使用 Authorization header
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }
  }

  return headers
}

/**
 * Parse SSE stream for Responses API
 */
async function parseResponsesStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: StreamCallbacks
): Promise<{ fullText: string; usage: RunMetrics['totalTokens'] | null }> {
  const decoder = new TextDecoder()
  let fullText = ''
  let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null = null
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data)
            
            // Handle different event types
            if (event.type === 'response.output_text.delta') {
              const delta = event.delta || ''
              fullText += delta
              callbacks.onChunk(delta)
            } else if (event.type === 'response.completed' || event.type === 'response.done') {
              if (event.response?.usage) {
                usage = event.response.usage
              }
            } else if (event.usage) {
              usage = event.usage
            }
            
            // Fallback: check for content delta
            if (event.delta?.content) {
              const delta = event.delta.content
              fullText += delta
              callbacks.onChunk(delta)
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    callbacks.onDone(fullText)
    return { fullText, usage: usage?.total_tokens || null }
  } catch (error) {
    callbacks.onError(error as Error)
    throw error
  }
}

/**
 * Parse SSE stream for Chat Completions API
 */
async function parseChatCompletionsStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: StreamCallbacks
): Promise<{ fullText: string; usage: number | null }> {
  const decoder = new TextDecoder()
  let fullText = ''
  let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null = null
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data)
            const delta = event.choices?.[0]?.delta?.content
            if (delta) {
              fullText += delta
              callbacks.onChunk(delta)
            }
            if (event.usage) {
              usage = event.usage
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    callbacks.onDone(fullText)
    return { fullText, usage: usage?.total_tokens || null }
  } catch (error) {
    callbacks.onError(error as Error)
    throw error
  }
}

/**
 * Execute API request
 */
export async function executeRequest(
  draft: PromptDraft,
  params: ParamsDraft,
  config: WorkspaceConfig,
  abortSignal: AbortSignal,
  callbacks?: StreamCallbacks
): Promise<RunRecord> {
  const startTime = performance.now()
  const url = buildUrl(config)
  const headers = buildHeaders(config)

  // Compile request body
  const body =
    config.endpointMode === 'responses'
      ? compileResponsesRequest(draft, params, config)
      : compileChatCompletionsRequest(draft, params, config)

  // Create run record
  const record: RunRecord = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    compiledRequestJson: body,
    responseJson: null,
    requestHeaders: headers,
    responseHeaders: {},
    metrics: {
      latencyMs: 0,
      firstTokenMs: null,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cachedTokens: 0,
      reasoningTokens: 0,
      statusCode: 0,
      finishReason: null,
    },
    outputText: '',
    error: null,
    tags: [],
    notes: '',
    modelId: config.modelId,
    temperature: params.temperature,
    stream: params.stream,
  }

  try {
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: abortSignal,
    }

    // Add API key to proxy request
    if (config.useProxy && config.apiKey) {
      (fetchOptions.headers as Record<string, string>)['X-API-Key'] = config.apiKey
    }

    const response = await fetch(url, fetchOptions)

    // Capture response headers
    response.headers.forEach((value, key) => {
      record.responseHeaders[key] = value
    })
    record.metrics.statusCode = response.status

    if (!response.ok) {
      const errorText = await response.text()
      record.error = `HTTP ${response.status}: ${errorText}`
      record.responseJson = { error: errorText }
      throw new Error(record.error)
    }

    // Handle streaming response
    if (params.stream && response.body) {
      const reader = response.body.getReader()
      const parseStream =
        config.endpointMode === 'responses'
          ? parseResponsesStream
          : parseChatCompletionsStream

      const { fullText, usage } = await parseStream(reader, {
        onChunk: callbacks?.onChunk || (() => {}),
        onDone: callbacks?.onDone || (() => {}),
        onError: callbacks?.onError || (() => {}),
      })

      record.outputText = fullText
      if (usage) {
        record.metrics.totalTokens = usage
      }
    } else {
      // Non-streaming response
      const json = await response.json()
      record.responseJson = json

      // Extract output text
      if (config.endpointMode === 'responses') {
        record.outputText = json.output_text || json.output?.[0]?.content || ''
        if (json.usage) {
          record.metrics.promptTokens = json.usage.input_tokens || 0
          record.metrics.completionTokens = json.usage.output_tokens || 0
          record.metrics.totalTokens = json.usage.total_tokens || 0
          record.metrics.cachedTokens = json.usage.prompt_tokens_details?.cached_tokens || 0
          record.metrics.reasoningTokens = json.usage.completion_tokens_details?.reasoning_tokens || 0
        }
        record.metrics.finishReason = json.status || json.finish_reason || null
      } else {
        record.outputText = json.choices?.[0]?.message?.content || ''
        if (json.usage) {
          record.metrics.promptTokens = json.usage.prompt_tokens || 0
          record.metrics.completionTokens = json.usage.completion_tokens || 0
          record.metrics.totalTokens = json.usage.total_tokens || 0
          record.metrics.cachedTokens = json.usage.prompt_tokens_details?.cached_tokens || 0
          record.metrics.reasoningTokens = json.usage.completion_tokens_details?.reasoning_tokens || 0
        }
        record.metrics.finishReason = json.choices?.[0]?.finish_reason || null
      }

      callbacks?.onDone?.(record.outputText)
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      record.error = 'Request aborted'
    } else {
      record.error = (error as Error).message
    }
    callbacks?.onError?.(error as Error)
  }

  record.metrics.latencyMs = Math.round(performance.now() - startTime)

  return record
}

/**
 * Generate cURL command for current request
 */
export function getCurlCommand(
  draft: PromptDraft,
  params: ParamsDraft,
  config: WorkspaceConfig
): string {
  const base = config.baseURL.replace(/\/$/, '')
  const endpoint =
    config.endpointMode === 'responses'
      ? '/v1/responses'
      : '/v1/chat/completions'
  const url = base + endpoint

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey || '$OPENAI_API_KEY'}`,
    ...config.headers,
  }

  const body =
    config.endpointMode === 'responses'
      ? compileResponsesRequest(draft, params, config)
      : compileChatCompletionsRequest(draft, params, config)

  return generateCurl(url, headers, body)
}
