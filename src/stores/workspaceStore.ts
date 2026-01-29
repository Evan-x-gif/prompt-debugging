import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WorkspaceConfig, ParamsDraft } from '@/types'

interface WorkspaceState {
  config: WorkspaceConfig
  params: ParamsDraft
  setConfig: (config: Partial<WorkspaceConfig>) => void
  setParams: (params: Partial<ParamsDraft>) => void
  resetConfig: () => void
  resetParams: () => void
}

const defaultConfig: WorkspaceConfig = {
  baseURL: '',
  apiKey: '',
  modelId: '',
  endpointMode: 'chat',
  headers: {},
  useProxy: false,
}

const defaultParams: ParamsDraft = {
  // 常用参数
  temperature: 1,
  topP: 1,
  maxOutputTokens: 4096,
  stream: true,
  stop: [],
  seed: null,
  
  // Chat Completions 特有
  presencePenalty: 0,
  frequencyPenalty: 0,
  n: 1,
  logprobs: false,
  topLogprobs: null,
  logitBias: {},
  
  // Responses API 特有
  truncation: 'auto',
  store: false,
  previousResponseId: '',
  
  // 推理模型参数
  reasoningEffort: null,
  
  // 结构化输出
  structuredOutput: {
    enabled: false,
    schemaJson: '{}',
    strict: true,
  },
  
  // 工具调用
  tools: {
    enabled: false,
    toolJson: '[]',
    toolChoice: 'auto',
    parallelToolCalls: true,
  },
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      params: defaultParams,
      setConfig: (config) =>
        set((state) => ({ config: { ...state.config, ...config } })),
      setParams: (params) =>
        set((state) => ({ params: { ...state.params, ...params } })),
      resetConfig: () => set({ config: defaultConfig }),
      resetParams: () => set({ params: defaultParams }),
    }),
    {
      name: 'prompt-debugger-workspace',
      // 持久化所有配置，包括 API Key
      // 注意：API Key 存储在浏览器 localStorage 中，请确保安全
    }
  )
)
