// ========== Workspace Config ==========
export type EndpointMode = 'responses' | 'chat'
export type InstructionRole = 'system' | 'developer'

export interface WorkspaceConfig {
  baseURL: string
  apiKey: string
  modelId: string
  endpointMode: EndpointMode
  headers: Record<string, string>
  useProxy: boolean
}

// ========== Prompt Draft ==========
export interface UserSegment {
  id: string
  title: string
  enabled: boolean
  text: string
  joiner: string
}

export interface AssistantPreset {
  id: string
  enabled: boolean
  text: string
}

export interface PromptDraft {
  instructionRole: InstructionRole
  instructionText: string
  userSegments: UserSegment[]
  assistantPresets: AssistantPreset[]
  variables: Record<string, string>
}

// ========== Parameters Draft ==========
export interface StructuredOutputConfig {
  enabled: boolean
  schemaJson: string
  strict: boolean
}

export interface ToolsConfig {
  enabled: boolean
  toolJson: string
  toolChoice: 'auto' | 'none' | 'required' | string
  parallelToolCalls: boolean
}

export interface ParamsDraft {
  // 常用参数
  temperature: number
  topP: number
  maxOutputTokens: number
  stream: boolean
  stop: string[]
  seed: number | null
  
  // Chat Completions 特有
  presencePenalty: number
  frequencyPenalty: number
  n: number // 生成多个候选
  logprobs: boolean // 输出 token 概率
  topLogprobs: number | null // top N logprobs
  logitBias: Record<string, number> // token 偏置
  
  // Responses API 特有
  truncation: 'auto' | 'disabled' // 超上下文处理
  store: boolean // 是否存储响应
  previousResponseId: string // 多轮对话串联
  
  // 推理模型参数
  reasoningEffort: 'none' | 'low' | 'medium' | 'high' | null
  
  // 结构化输出
  structuredOutput: StructuredOutputConfig
  
  // 工具调用
  tools: ToolsConfig
}

// ========== Run Record ==========
export interface RunMetrics {
  latencyMs: number
  firstTokenMs: number | null // 首 token 延迟
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cachedTokens: number // 缓存命中
  reasoningTokens: number // 推理 token
  statusCode: number
  finishReason: string | null // 结束原因
}

export interface RunRecord {
  id: string
  createdAt: string
  compiledRequestJson: object
  responseJson: object | null
  requestHeaders: Record<string, string>
  responseHeaders: Record<string, string>
  metrics: RunMetrics
  outputText: string
  error: string | null
  tags: string[]
  notes: string
  modelId: string
  temperature: number
  stream: boolean
}

// ========== API Messages ==========
export interface Message {
  role: 'system' | 'developer' | 'user' | 'assistant'
  content: string
}

// ========== Compiled Request ==========
export interface ResponsesAPIRequest {
  model: string
  input: Message[] | string
  instructions?: string
  max_output_tokens?: number
  temperature?: number
  top_p?: number
  stream?: boolean
  stream_options?: { include_usage?: boolean }
  stop?: string[]
  seed?: number
  truncation?: 'auto' | 'disabled'
  store?: boolean
  previous_response_id?: string
  reasoning?: { effort?: string }
  tools?: object[]
  tool_choice?: string
  parallel_tool_calls?: boolean
  text?: {
    format?: {
      type: 'json_schema'
      strict?: boolean
      schema?: object
    }
  }
}

export interface ChatCompletionsRequest {
  model: string
  messages: Message[]
  max_tokens?: number
  max_completion_tokens?: number
  temperature?: number
  top_p?: number
  stream?: boolean
  stream_options?: { include_usage?: boolean }
  stop?: string[]
  seed?: number
  n?: number
  presence_penalty?: number
  frequency_penalty?: number
  logprobs?: boolean
  top_logprobs?: number
  logit_bias?: Record<string, number>
  reasoning_effort?: string
  tools?: object[]
  tool_choice?: string
  parallel_tool_calls?: boolean
  response_format?: {
    type: 'json_schema' | 'json_object'
    json_schema?: {
      name?: string
      strict?: boolean
      schema?: object
    }
  }
}
