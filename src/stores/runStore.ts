import { create } from 'zustand'
import type { RunRecord } from '@/types'
import type { SSEEvent } from '@/components/output/SSEViewer'

interface RunState {
  isRunning: boolean
  currentOutput: string
  currentReasoning: string
  currentRecord: RunRecord | null
  abortController: AbortController | null
  error: string | null
  sseEvents: SSEEvent[]
  setRunning: (running: boolean) => void
  setCurrentOutput: (output: string) => void
  appendOutput: (chunk: string) => void
  setCurrentReasoning: (reasoning: string) => void
  appendReasoning: (chunk: string) => void
  setCurrentRecord: (record: RunRecord | null) => void
  setAbortController: (controller: AbortController | null) => void
  setError: (error: string | null) => void
  addSSEEvent: (event: SSEEvent) => void
  clearSSEEvents: () => void
  reset: () => void
  abort: () => void
}

export const useRunStore = create<RunState>((set, get) => ({
  isRunning: false,
  currentOutput: '',
  currentReasoning: '',
  currentRecord: null,
  abortController: null,
  error: null,
  sseEvents: [],

  setRunning: (running) => set({ isRunning: running }),

  setCurrentOutput: (output) => set({ currentOutput: output }),

  appendOutput: (chunk) =>
    set((state) => ({ currentOutput: state.currentOutput + chunk })),

  setCurrentReasoning: (reasoning) => set({ currentReasoning: reasoning }),

  appendReasoning: (chunk) =>
    set((state) => ({ currentReasoning: state.currentReasoning + chunk })),

  setCurrentRecord: (record) => set({ currentRecord: record }),

  setAbortController: (controller) => set({ abortController: controller }),

  setError: (error) => set({ error }),

  addSSEEvent: (event) => {
    console.log('[runStore] addSSEEvent 被调用:', event)
    set((state) => {
      const newEvents = [...state.sseEvents, event]
      console.log('[runStore] 新的事件数组长度:', newEvents.length)
      return { sseEvents: newEvents }
    })
  },

  clearSSEEvents: () => set({ sseEvents: [] }),

  reset: () =>
    set({
      isRunning: false,
      currentOutput: '',
      currentReasoning: '',
      currentRecord: null,
      abortController: null,
      error: null,
      sseEvents: [],
    }),

  abort: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
      set({
        isRunning: false,
        abortController: null,
      })
    }
  },
}))
