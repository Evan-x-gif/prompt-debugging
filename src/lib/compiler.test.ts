import { describe, it, expect } from 'vitest'
import { compileMessages, compileResponsesRequest, compileChatCompletionsRequest } from './compiler'
import type { PromptDraft, ParamsDraft, WorkspaceConfig } from '@/types'

const createMockDraft = (overrides: Partial<PromptDraft> = {}): PromptDraft => ({
  instructionRole: 'system',
  instructionText: '',
  userSegments: [],
  assistantPresets: [],
  variables: {},
  ...overrides,
})

const createMockParams = (overrides: Partial<ParamsDraft> = {}): ParamsDraft => ({
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
  structuredOutput: { enabled: false, schemaJson: '{}', strict: true },
  tools: { enabled: false, toolJson: '[]', toolChoice: 'auto', parallelToolCalls: true },
  ...overrides,
})

const createMockConfig = (overrides: Partial<WorkspaceConfig> = {}): WorkspaceConfig => ({
  baseURL: 'https://api.openai.com',
  apiKey: 'test-key',
  modelId: 'gpt-4o',
  endpointMode: 'chat',
  headers: {},
  useProxy: false,
  ...overrides,
})

describe('compileMessages', () => {
  it('should compile system instruction', () => {
    const draft = createMockDraft({
      instructionText: 'You are a helpful assistant.',
    })
    const messages = compileMessages(draft)
    
    expect(messages).toHaveLength(1)
    expect(messages[0]).toEqual({
      role: 'system',
      content: 'You are a helpful assistant.',
    })
  })

  it('should compile user segments', () => {
    const draft = createMockDraft({
      userSegments: [
        { id: '1', title: 'Main', enabled: true, text: 'Hello', joiner: '\n', images: [] },
        { id: '2', title: 'Extra', enabled: true, text: 'World', joiner: '\n', images: [] },
      ],
    })
    const messages = compileMessages(draft)
    
    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('user')
    expect(messages[0].content).toBe('Hello\nWorld')
  })

  it('should skip disabled segments', () => {
    const draft = createMockDraft({
      userSegments: [
        { id: '1', title: 'Main', enabled: true, text: 'Hello', joiner: '\n', images: [] },
        { id: '2', title: 'Disabled', enabled: false, text: 'Skip me', joiner: '\n', images: [] },
      ],
    })
    const messages = compileMessages(draft)
    
    expect(messages[0].content).toBe('Hello')
    expect(messages[0].content).not.toContain('Skip me')
  })

  it('should replace variables in user segments', () => {
    const draft = createMockDraft({
      instructionText: 'You are a teacher.',
      userSegments: [
        { id: '1', title: 'Main', enabled: true, text: 'My name is {{name}}.', joiner: '\n', images: [] },
      ],
      variables: { name: 'Alice' },
    })
    const messages = compileMessages(draft)
    
    // Variables are replaced in user segments
    expect(messages[1].content).toBe('My name is Alice.')
  })

  it('should handle assistant presets', () => {
    const draft = createMockDraft({
      userSegments: [
        { id: '1', title: 'Main', enabled: true, text: 'Question 1', joiner: '\n', images: [] },
      ],
      assistantPresets: [
        { id: 'a1', enabled: true, text: 'Answer 1' },
      ],
    })
    const messages = compileMessages(draft)
    
    // Should have user, assistant, user pattern
    expect(messages.length).toBeGreaterThanOrEqual(2)
    expect(messages.some(m => m.role === 'assistant')).toBe(true)
  })
})

describe('compileResponsesRequest', () => {
  it('should compile basic request', () => {
    const draft = createMockDraft({
      instructionText: 'Be helpful.',
      userSegments: [
        { id: '1', title: 'Main', enabled: true, text: 'Hello', joiner: '\n', images: [] },
      ],
    })
    const params = createMockParams()
    const config = createMockConfig({ endpointMode: 'responses' })
    
    const request = compileResponsesRequest(draft, params, config)
    
    expect(request.model).toBe('gpt-4o')
    expect(request.instructions).toBe('Be helpful.')
    expect(request.input).toBeDefined()
  })

  it('should include temperature when not default', () => {
    const draft = createMockDraft()
    const params = createMockParams({ temperature: 0.5 })
    const config = createMockConfig({ endpointMode: 'responses' })
    
    const request = compileResponsesRequest(draft, params, config)
    
    expect(request.temperature).toBe(0.5)
  })

  it('should include stream option', () => {
    const draft = createMockDraft()
    const params = createMockParams({ stream: true })
    const config = createMockConfig({ endpointMode: 'responses' })
    
    const request = compileResponsesRequest(draft, params, config)
    
    expect(request.stream).toBe(true)
  })
})

describe('compileMessages with images', () => {
  it('should compile multimodal content when images present', () => {
    const draft = createMockDraft({
      userSegments: [
        {
          id: '1',
          title: 'Main',
          enabled: true,
          text: 'What is in this image?',
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
    })
    const messages = compileMessages(draft)

    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('user')
    expect(Array.isArray(messages[0].content)).toBe(true)

    const content = messages[0].content as Array<{ type: string }>
    expect(content.some(c => c.type === 'text')).toBe(true)
    expect(content.some(c => c.type === 'image_url')).toBe(true)
  })

  it('should skip images with non-ready status', () => {
    const draft = createMockDraft({
      userSegments: [
        {
          id: '1',
          title: 'Main',
          enabled: true,
          text: 'Hello',
          joiner: '\n',
          images: [
            {
              id: 'img1',
              type: 'url',
              url: 'https://example.com/loading.jpg',
              detail: 'auto',
              status: 'loading',
            },
            {
              id: 'img2',
              type: 'url',
              url: 'https://example.com/error.jpg',
              detail: 'auto',
              status: 'error',
            },
          ],
        },
      ],
    })
    const messages = compileMessages(draft)

    // Should fall back to text-only since no ready images
    expect(messages[0].content).toBe('Hello')
  })

  it('should include image detail parameter', () => {
    const draft = createMockDraft({
      userSegments: [
        {
          id: '1',
          title: 'Main',
          enabled: true,
          text: 'Analyze this',
          joiner: '\n',
          images: [
            {
              id: 'img1',
              type: 'url',
              url: 'https://example.com/image.jpg',
              detail: 'high',
              status: 'ready',
            },
          ],
        },
      ],
    })
    const messages = compileMessages(draft)

    const content = messages[0].content as Array<{ type: string; image_url?: { detail: string } }>
    const imageContent = content.find(c => c.type === 'image_url')
    expect(imageContent?.image_url?.detail).toBe('high')
  })

  it('should handle multiple images in one segment', () => {
    const draft = createMockDraft({
      userSegments: [
        {
          id: '1',
          title: 'Main',
          enabled: true,
          text: 'Compare these images',
          joiner: '\n',
          images: [
            {
              id: 'img1',
              type: 'url',
              url: 'https://example.com/image1.jpg',
              detail: 'auto',
              status: 'ready',
            },
            {
              id: 'img2',
              type: 'base64',
              url: 'data:image/jpeg;base64,abc123',
              detail: 'low',
              status: 'ready',
            },
          ],
        },
      ],
    })
    const messages = compileMessages(draft)

    const content = messages[0].content as Array<{ type: string }>
    const imageContents = content.filter(c => c.type === 'image_url')
    expect(imageContents).toHaveLength(2)
  })

  it('should handle images across multiple segments', () => {
    const draft = createMockDraft({
      userSegments: [
        {
          id: '1',
          title: 'First',
          enabled: true,
          text: 'First image:',
          joiner: '\n',
          images: [
            {
              id: 'img1',
              type: 'url',
              url: 'https://example.com/image1.jpg',
              detail: 'auto',
              status: 'ready',
            },
          ],
        },
        {
          id: '2',
          title: 'Second',
          enabled: true,
          text: 'Second image:',
          joiner: '\n',
          images: [
            {
              id: 'img2',
              type: 'url',
              url: 'https://example.com/image2.jpg',
              detail: 'auto',
              status: 'ready',
            },
          ],
        },
      ],
    })
    const messages = compileMessages(draft)

    const content = messages[0].content as Array<{ type: string }>
    const textContents = content.filter(c => c.type === 'text')
    const imageContents = content.filter(c => c.type === 'image_url')

    expect(textContents).toHaveLength(2)
    expect(imageContents).toHaveLength(2)
  })
})

describe('compileChatCompletionsRequest', () => {
  it('should compile basic request', () => {
    const draft = createMockDraft({
      instructionText: 'Be helpful.',
      userSegments: [
        { id: '1', title: 'Main', enabled: true, text: 'Hello', joiner: '\n', images: [] },
      ],
    })
    const params = createMockParams()
    const config = createMockConfig({ endpointMode: 'chat' })
    
    const request = compileChatCompletionsRequest(draft, params, config)
    
    expect(request.model).toBe('gpt-4o')
    expect(request.messages).toBeDefined()
    expect(request.messages.length).toBeGreaterThan(0)
  })

  it('should include presence and frequency penalty', () => {
    const draft = createMockDraft()
    const params = createMockParams({ presencePenalty: 0.5, frequencyPenalty: 0.3 })
    const config = createMockConfig({ endpointMode: 'chat' })
    
    const request = compileChatCompletionsRequest(draft, params, config)
    
    expect(request.presence_penalty).toBe(0.5)
    expect(request.frequency_penalty).toBe(0.3)
  })
})
