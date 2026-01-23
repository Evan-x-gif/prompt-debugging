import { z } from 'zod'

// ========== Workspace Config Schema ==========
export const workspaceConfigSchema = z.object({
  baseURL: z
    .string()
    .min(1, '请输入 API 基础 URL')
    .url('无效的 URL 格式')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'URL 必须以 http:// 或 https:// 开头'
    ),
  apiKey: z.string().min(1, '请输入 API 密钥'),
  modelId: z.string().min(1, '请输入模型 ID'),
  endpointMode: z.enum(['responses', 'chat']),
  headers: z.record(z.string(), z.string()),
  useProxy: z.boolean(),
})

export type WorkspaceConfigInput = z.input<typeof workspaceConfigSchema>

// ========== Image Content Schema ==========
export const imageContentSchema = z.object({
  id: z.string(),
  type: z.enum(['url', 'base64']),
  url: z.string(),
  filename: z.string().optional(),
  size: z.number().optional(),
  detail: z.enum(['low', 'high', 'auto']),
  thumbnail: z.string().optional(),
  status: z.enum(['loading', 'ready', 'error']),
  error: z.string().optional(),
})

// ========== User Segment Schema ==========
export const userSegmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  enabled: z.boolean(),
  text: z.string(),
  joiner: z.string(),
  images: z.array(imageContentSchema),
})

// ========== Assistant Preset Schema ==========
export const assistantPresetSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  text: z.string(),
})

// ========== Prompt Draft Schema ==========
export const promptDraftSchema = z.object({
  instructionRole: z.enum(['system', 'developer']),
  instructionText: z.string(),
  userSegments: z.array(userSegmentSchema),
  assistantPresets: z.array(assistantPresetSchema),
  variables: z.record(z.string(), z.string()),
})

// ========== Structured Output Config Schema ==========
export const structuredOutputConfigSchema = z.object({
  enabled: z.boolean(),
  schemaJson: z.string().refine(
    (val) => {
      if (!val.trim()) return true
      try {
        JSON.parse(val)
        return true
      } catch {
        return false
      }
    },
    '无效的 JSON 格式'
  ),
  strict: z.boolean(),
})

// ========== Tools Config Schema ==========
export const toolsConfigSchema = z.object({
  enabled: z.boolean(),
  toolJson: z.string().refine(
    (val) => {
      if (!val.trim()) return true
      try {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed)
      } catch {
        return false
      }
    },
    '工具配置必须是有效的 JSON 数组'
  ),
  toolChoice: z.string(),
  parallelToolCalls: z.boolean(),
})

// ========== Params Draft Schema ==========
export const paramsDraftSchema = z.object({
  temperature: z.number().min(0).max(2),
  topP: z.number().min(0).max(1),
  maxOutputTokens: z.number().min(1).max(128000),
  stream: z.boolean(),
  stop: z.array(z.string()),
  seed: z.number().nullable(),
  presencePenalty: z.number().min(-2).max(2),
  frequencyPenalty: z.number().min(-2).max(2),
  n: z.number().min(1).max(10),
  logprobs: z.boolean(),
  topLogprobs: z.number().min(0).max(20).nullable(),
  logitBias: z.record(z.string(), z.number()),
  truncation: z.enum(['auto', 'disabled']),
  store: z.boolean(),
  previousResponseId: z.string(),
  reasoningEffort: z.enum(['none', 'low', 'medium', 'high']).nullable(),
  structuredOutput: structuredOutputConfigSchema,
  tools: toolsConfigSchema,
})

// ========== Validation Helpers ==========

export function validateWorkspaceConfig(config: unknown) {
  return workspaceConfigSchema.safeParse(config)
}

export function validatePromptDraft(draft: unknown) {
  return promptDraftSchema.safeParse(draft)
}

export function validateParamsDraft(params: unknown) {
  return paramsDraftSchema.safeParse(params)
}

// ========== Error Formatting ==========

export function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  })
}
