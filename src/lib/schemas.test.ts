import { describe, it, expect } from 'vitest'
import {
  validateWorkspaceConfig,
  validatePromptDraft,
  validateParamsDraft,
  formatZodErrors,
  workspaceConfigSchema,
} from './schemas'

describe('workspaceConfigSchema', () => {
  it('should validate valid config', () => {
    const config = {
      baseURL: 'https://api.openai.com',
      apiKey: 'sk-test-key',
      modelId: 'gpt-4o',
      endpointMode: 'chat',
      headers: {},
      useProxy: false,
    }
    const result = validateWorkspaceConfig(config)
    expect(result.success).toBe(true)
  })

  it('should reject empty baseURL', () => {
    const config = {
      baseURL: '',
      apiKey: 'sk-test-key',
      modelId: 'gpt-4o',
      endpointMode: 'chat',
      headers: {},
      useProxy: false,
    }
    const result = validateWorkspaceConfig(config)
    expect(result.success).toBe(false)
  })

  it('should reject invalid URL format', () => {
    const config = {
      baseURL: 'not-a-url',
      apiKey: 'sk-test-key',
      modelId: 'gpt-4o',
      endpointMode: 'chat',
      headers: {},
      useProxy: false,
    }
    const result = validateWorkspaceConfig(config)
    expect(result.success).toBe(false)
  })

  it('should reject empty modelId', () => {
    const config = {
      baseURL: 'https://api.openai.com',
      apiKey: 'sk-test-key',
      modelId: '',
      endpointMode: 'chat',
      headers: {},
      useProxy: false,
    }
    const result = validateWorkspaceConfig(config)
    expect(result.success).toBe(false)
  })

  it('should reject invalid endpointMode', () => {
    const config = {
      baseURL: 'https://api.openai.com',
      apiKey: 'sk-test-key',
      modelId: 'gpt-4o',
      endpointMode: 'invalid',
      headers: {},
      useProxy: false,
    }
    const result = validateWorkspaceConfig(config)
    expect(result.success).toBe(false)
  })
})

describe('promptDraftSchema', () => {
  it('should validate valid draft', () => {
    const draft = {
      instructionRole: 'system',
      instructionText: 'You are helpful.',
      userSegments: [
        {
          id: '1',
          title: 'Main',
          enabled: true,
          text: 'Hello',
          joiner: '\n',
          images: [],
        },
      ],
      assistantPresets: [],
      variables: {},
    }
    const result = validatePromptDraft(draft)
    expect(result.success).toBe(true)
  })

  it('should validate draft with images', () => {
    const draft = {
      instructionRole: 'system',
      instructionText: '',
      userSegments: [
        {
          id: '1',
          title: 'Main',
          enabled: true,
          text: 'What is this?',
          joiner: '\n',
          images: [
            {
              id: 'img1',
              type: 'url',
              url: 'https://example.com/image.jpg',
              detail: 'auto',
              status: 'ready',
            },
          ],
        },
      ],
      assistantPresets: [],
      variables: {},
    }
    const result = validatePromptDraft(draft)
    expect(result.success).toBe(true)
  })

  it('should reject invalid instructionRole', () => {
    const draft = {
      instructionRole: 'invalid',
      instructionText: '',
      userSegments: [],
      assistantPresets: [],
      variables: {},
    }
    const result = validatePromptDraft(draft)
    expect(result.success).toBe(false)
  })
})

describe('paramsDraftSchema', () => {
  it('should validate valid params', () => {
    const params = {
      temperature: 0.7,
      topP: 1,
      maxOutputTokens: 4096,
      stream: true,
      stop: [],
      seed: null,
      presencePenalty: 0,
      frequencyPenalty: 0,
      n: 1,
      logprobs: false,
      topLogprobs: null,
      logitBias: {},
      truncation: 'auto',
      store: false,
      previousResponseId: '',
      reasoningEffort: null,
      structuredOutput: { enabled: false, schemaJson: '{}', strict: true },
      tools: { enabled: false, toolJson: '[]', toolChoice: 'auto', parallelToolCalls: true },
    }
    const result = validateParamsDraft(params)
    expect(result.success).toBe(true)
  })

  it('should reject temperature out of range', () => {
    const params = {
      temperature: 3, // max is 2
      topP: 1,
      maxOutputTokens: 4096,
      stream: false,
      stop: [],
      seed: null,
      presencePenalty: 0,
      frequencyPenalty: 0,
      n: 1,
      logprobs: false,
      topLogprobs: null,
      logitBias: {},
      truncation: 'auto',
      store: false,
      previousResponseId: '',
      reasoningEffort: null,
      structuredOutput: { enabled: false, schemaJson: '{}', strict: true },
      tools: { enabled: false, toolJson: '[]', toolChoice: 'auto', parallelToolCalls: true },
    }
    const result = validateParamsDraft(params)
    expect(result.success).toBe(false)
  })

  it('should reject invalid JSON in structuredOutput', () => {
    const params = {
      temperature: 1,
      topP: 1,
      maxOutputTokens: 4096,
      stream: false,
      stop: [],
      seed: null,
      presencePenalty: 0,
      frequencyPenalty: 0,
      n: 1,
      logprobs: false,
      topLogprobs: null,
      logitBias: {},
      truncation: 'auto',
      store: false,
      previousResponseId: '',
      reasoningEffort: null,
      structuredOutput: { enabled: true, schemaJson: 'invalid json', strict: true },
      tools: { enabled: false, toolJson: '[]', toolChoice: 'auto', parallelToolCalls: true },
    }
    const result = validateParamsDraft(params)
    expect(result.success).toBe(false)
  })
})

describe('formatZodErrors', () => {
  it('should format errors with path', () => {
    const result = workspaceConfigSchema.safeParse({
      baseURL: '',
      apiKey: '',
      modelId: '',
      endpointMode: 'chat',
      headers: {},
      useProxy: false,
    })

    if (!result.success) {
      const formatted = formatZodErrors(result.error)
      expect(formatted.length).toBeGreaterThan(0)
      expect(formatted.some(e => e.includes('baseURL'))).toBe(true)
    }
  })
})
