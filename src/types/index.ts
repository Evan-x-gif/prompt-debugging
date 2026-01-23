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
  temperature: number
  topP: number
  maxOutputTokens: number
  stream: boolean
  stop: string[]
  seed: number | null
  presencePenalty: number
  frequencyPenalty: number
  structuredOutput: StructuredOutputConfig
  tools: ToolsConfig
}

// ========== Run Record ==========
export interface RunMetrics {
  latencyMs: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  statusCode: number
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
  stop?: string[]
  seed?: number
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
  temperature?: number
  top_p?: number
  stream?: boolean
  stop?: string[]
  seed?: number
  presence_penalty?: number
  frequency_penalty?: number
  tools?: object[]
  tool_choice?: string
  parallel_tool_calls?: boolean
  response_format?: {
    type: 'json_schema'
    json_schema?: {
      strict?: boolean
      schema?: object
    }
  }
}
