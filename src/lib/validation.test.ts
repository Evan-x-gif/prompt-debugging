import { describe, it, expect } from 'vitest'
import { validateConfig, lintPrompt, canRun } from './validation'
import type { PromptDraft, WorkspaceConfig } from '@/types'

const createMockDraft = (overrides: Partial<PromptDraft> = {}): PromptDraft => ({
  instructionRole: 'system',
  instructionText: '',
  userSegments: [],
  assistantPresets: [],
  variables: {},
  ...overrides,
})

const createMockConfig = (overrides: Partial<WorkspaceConfig> = {}): WorkspaceConfig => ({
  baseURL: 'https://api.openai.com',
  apiKey: 'test-key-1234567890123456',
  modelId: 'gpt-4o',
  endpointMode: 'chat',
  headers: {},
  useProxy: false,
  ...overrides,
})

describe('validateConfig', () => {
  it('should return error for missing baseURL', () => {
    const config = createMockConfig({ baseURL: '' })
    const errors = validateConfig(config)
    
    expect(errors.some(e => e.message.includes('URL'))).toBe(true)
  })

  it('should return error for missing API key', () => {
    const config = createMockConfig({ apiKey: '' })
    const errors = validateConfig(config)
    
    expect(errors.some(e => e.message.includes('API') || e.message.includes('密钥'))).toBe(true)
  })

  it('should return error for missing model ID', () => {
    const config = createMockConfig({ modelId: '' })
    const errors = validateConfig(config)
    
    expect(errors.some(e => e.message.includes('模型'))).toBe(true)
  })

  it('should return no errors for valid config', () => {
    const config = createMockConfig()
    const errors = validateConfig(config).filter(e => e.severity === 'error')
    
    expect(errors).toHaveLength(0)
  })
})

describe('lintPrompt', () => {
  it('should suggest adding system instruction', () => {
    const draft = createMockDraft({ instructionText: '' })
    const issues = lintPrompt(draft)
    
    expect(issues.some(w => w.message.includes('系统指令') || w.message.includes('建议'))).toBe(true)
  })

  it('should warn about undefined variables', () => {
    const draft = createMockDraft({
      instructionText: 'Hello {{name}}',
      variables: {},
    })
    const issues = lintPrompt(draft)
    
    expect(issues.some(w => w.message.includes('name'))).toBe(true)
  })

  it('should not warn when variables are defined', () => {
    const draft = createMockDraft({
      instructionText: 'Hello {{name}}',
      variables: { name: 'Alice' },
    })
    const issues = lintPrompt(draft)
    
    expect(issues.some(w => w.message.includes('未定义'))).toBe(false)
  })
})

describe('canRun', () => {
  it('should return false when config is invalid', () => {
    const draft = createMockDraft({
      userSegments: [{ id: '1', title: 'Main', enabled: true, text: 'Hello', joiner: '\n' }],
    })
    const config = createMockConfig({ baseURL: '' })
    
    const result = canRun(config, draft)
    
    expect(result.ok).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('should return false when no user content', () => {
    const draft = createMockDraft({ userSegments: [], instructionText: '' })
    const config = createMockConfig()
    
    const result = canRun(config, draft)
    
    expect(result.ok).toBe(false)
  })

  it('should return true for valid setup', () => {
    const draft = createMockDraft({
      userSegments: [{ id: '1', title: 'Main', enabled: true, text: 'Hello', joiner: '\n' }],
    })
    const config = createMockConfig()
    
    const result = canRun(config, draft)
    
    expect(result.ok).toBe(true)
  })
})
