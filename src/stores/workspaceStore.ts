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
  baseURL: 'https://ai.megallm.io',
  apiKey: '',
  modelId: 'deepseek-ai/deepseek-v3.1-terminus',
  endpointMode: 'chat',
  headers: {},
  useProxy: false,
}

const defaultParams: ParamsDraft = {
  temperature: 1,
  topP: 1,
  maxOutputTokens: 4096,
  stream: true,
  stop: [],
  seed: null,
  presencePenalty: 0,
  frequencyPenalty: 0,
  structuredOutput: {
    enabled: false,
    schemaJson: '{}',
    strict: true,
  },
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
      partialize: (state) => ({
        config: {
          ...state.config,
          apiKey: '', // Don't persist API key by default
        },
        params: state.params,
      }),
    }
  )
)
