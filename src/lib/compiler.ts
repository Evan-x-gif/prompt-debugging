import type {
  PromptDraft,
  ParamsDraft,
  WorkspaceConfig,
  Message,
  MessageContentPart,
  ResponsesAPIRequest,
  ChatCompletionsRequest,
} from '@/types'

/**
 * Check if any segment has images
 */
function hasImages(draft: PromptDraft): boolean {
  return draft.userSegments.some(
    (seg) => seg.enabled && seg.images && seg.images.length > 0 && seg.images.some(img => img.status === 'ready')
  )
}

/**
 * Compile user segments into a single user message (text only)
 */
function compileUserContent(draft: PromptDraft): string {
  const enabledSegments = draft.userSegments.filter((seg) => seg.enabled)

  let result = ''
  enabledSegments.forEach((seg, index) => {
    // Replace variables
    let text = seg.text
    if (draft.variables) {
      Object.entries(draft.variables).forEach(([key, value]) => {
        text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
      })
    }

    result += text

    // Add joiner between segments
    if (index < enabledSegments.length - 1) {
      result += seg.joiner
    }
  })

  return result
}

/**
 * Compile user segments into multimodal content (text + images)
 */
function compileUserContentMultimodal(draft: PromptDraft): MessageContentPart[] {
  const enabledSegments = draft.userSegments.filter((seg) => seg.enabled)
  const content: MessageContentPart[] = []

  enabledSegments.forEach((seg, index) => {
    // Replace variables in text
    let text = seg.text
    if (draft.variables) {
      Object.entries(draft.variables).forEach(([key, value]) => {
        text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
      })
    }

    // Add joiner between segments
    if (index < enabledSegments.length - 1) {
      text += seg.joiner
    }

    // Add text content if not empty
    if (text.trim()) {
      content.push({ type: 'text', text })
    }

    // Add images
    if (seg.images && seg.images.length > 0) {
      seg.images
        .filter(img => img.status === 'ready')
        .forEach(img => {
          content.push({
            type: 'image_url',
            image_url: {
              url: img.url,
              detail: img.detail,
            },
          })
        })
    }
  })

  return content
}

/**
 * Compile prompt draft into messages array
 */
export function compileMessages(draft: PromptDraft): Message[] {
  const messages: Message[] = []

  // Add system/developer instruction
  if (draft.instructionText.trim()) {
    messages.push({
      role: draft.instructionRole,
      content: draft.instructionText,
    })
  }

  // Add assistant presets as conversation history (user-assistant pairs)
  // Each preset represents a previous assistant response, so we add a placeholder user turn before it
  const enabledPresets = draft.assistantPresets.filter((preset) => preset.enabled && preset.text.trim())
  enabledPresets.forEach((preset, index) => {
    // Add a placeholder user message for context (optional, can be customized)
    if (index === 0) {
      messages.push({
        role: 'user',
        content: '[Previous conversation]',
      })
    }
    messages.push({
      role: 'assistant',
      content: preset.text,
    })
  })

  // Add compiled user message (current turn)
  if (hasImages(draft)) {
    // Multimodal content with images
    const multimodalContent = compileUserContentMultimodal(draft)
    if (multimodalContent.length > 0) {
      messages.push({
        role: 'user',
        content: multimodalContent,
      })
    }
  } else {
    // Text-only content
    const userContent = compileUserContent(draft)
    if (userContent.trim()) {
      messages.push({
        role: 'user',
        content: userContent,
      })
    }
  }

  return messages
}

/**
 * Compile to Responses API request
 */
export function compileResponsesRequest(
  draft: PromptDraft,
  params: ParamsDraft,
  config: WorkspaceConfig
): ResponsesAPIRequest {
  const messages = compileMessages(draft)

  const request: ResponsesAPIRequest = {
    model: config.modelId,
    input: messages,
  }

  // Add instructions (system/developer message)
  if (draft.instructionText.trim()) {
    request.instructions = draft.instructionText
    // Remove instruction from input if added separately
    if (messages[0]?.role === draft.instructionRole) {
      request.input = messages.slice(1)
    }
  }

  // Add generation parameters
  if (params.maxOutputTokens > 0) {
    request.max_output_tokens = params.maxOutputTokens
  }
  if (params.temperature !== 1) {
    request.temperature = params.temperature
  }
  if (params.topP !== 1) {
    request.top_p = params.topP
  }
  if (params.stream) {
    request.stream = true
    request.stream_options = { include_usage: true }
  }
  if (params.stop.length > 0) {
    request.stop = params.stop
  }
  if (params.seed !== null) {
    request.seed = params.seed
  }
  
  // Responses API 特有参数
  if (params.truncation !== 'auto') {
    request.truncation = params.truncation
  }
  if (params.store) {
    request.store = true
  }
  if (params.previousResponseId) {
    request.previous_response_id = params.previousResponseId
  }
  if (params.reasoningEffort) {
    request.reasoning = { effort: params.reasoningEffort }
  }

  // Structured output (V1.1 feature, basic support)
  if (params.structuredOutput.enabled) {
    try {
      const schema = JSON.parse(params.structuredOutput.schemaJson)
      request.text = {
        format: {
          type: 'json_schema',
          strict: params.structuredOutput.strict,
          schema,
        },
      }
    } catch {
      // Invalid schema, skip
    }
  }

  // Tool calling (V1.1 feature, basic support)
  if (params.tools.enabled) {
    try {
      const tools = JSON.parse(params.tools.toolJson)
      if (Array.isArray(tools) && tools.length > 0) {
        request.tools = tools
        request.tool_choice = params.tools.toolChoice
        request.parallel_tool_calls = params.tools.parallelToolCalls
      }
    } catch {
      // Invalid tools, skip
    }
  }

  return request
}

/**
 * Compile to Chat Completions API request
 */
export function compileChatCompletionsRequest(
  draft: PromptDraft,
  params: ParamsDraft,
  config: WorkspaceConfig
): ChatCompletionsRequest {
  const messages = compileMessages(draft)

  const request: ChatCompletionsRequest = {
    model: config.modelId,
    messages,
  }

  // Add generation parameters
  if (params.maxOutputTokens > 0) {
    request.max_tokens = params.maxOutputTokens
  }
  if (params.temperature !== 1) {
    request.temperature = params.temperature
  }
  if (params.topP !== 1) {
    request.top_p = params.topP
  }
  if (params.stream) {
    request.stream = true
    request.stream_options = { include_usage: true }
  }
  if (params.stop.length > 0) {
    request.stop = params.stop
  }
  if (params.seed !== null) {
    request.seed = params.seed
  }
  if (params.presencePenalty !== 0) {
    request.presence_penalty = params.presencePenalty
  }
  if (params.frequencyPenalty !== 0) {
    request.frequency_penalty = params.frequencyPenalty
  }
  
  // Chat Completions 特有参数
  if (params.n > 1) {
    request.n = params.n
  }
  if (params.logprobs) {
    request.logprobs = true
    if (params.topLogprobs !== null) {
      request.top_logprobs = params.topLogprobs
    }
  }
  if (params.logitBias && Object.keys(params.logitBias).length > 0) {
    request.logit_bias = params.logitBias
  }
  if (params.reasoningEffort) {
    request.reasoning_effort = params.reasoningEffort
  }

  // Structured output
  if (params.structuredOutput.enabled) {
    try {
      const schema = JSON.parse(params.structuredOutput.schemaJson)
      request.response_format = {
        type: 'json_schema',
        json_schema: {
          strict: params.structuredOutput.strict,
          schema,
        },
      }
    } catch {
      // Invalid schema, skip
    }
  }

  // Tool calling
  if (params.tools.enabled) {
    try {
      const tools = JSON.parse(params.tools.toolJson)
      if (Array.isArray(tools) && tools.length > 0) {
        request.tools = tools
        request.tool_choice = params.tools.toolChoice
        request.parallel_tool_calls = params.tools.parallelToolCalls
      }
    } catch {
      // Invalid tools, skip
    }
  }

  return request
}

/**
 * Generate cURL command for debugging
 */
export function generateCurl(
  url: string,
  headers: Record<string, string>,
  body: object
): string {
  let curl = `curl -X POST '${url}'`

  Object.entries(headers).forEach(([key, value]) => {
    // Mask API key
    const displayValue = key.toLowerCase().includes('authorization')
      ? value.replace(/Bearer\s+.+/, 'Bearer $OPENAI_API_KEY')
      : value
    curl += ` \\\n  -H '${key}: ${displayValue}'`
  })

  curl += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`

  return curl
}
