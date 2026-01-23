import { create } from 'zustand'
import type { RunRecord } from '@/types'

interface RunState {
  isRunning: boolean
  currentOutput: string
  currentRecord: RunRecord | null
  abortController: AbortController | null
  error: string | null
  setRunning: (running: boolean) => void
  setCurrentOutput: (output: string) => void
  appendOutput: (chunk: string) => void
  setCurrentRecord: (record: RunRecord | null) => void
  setAbortController: (controller: AbortController | null) => void
  setError: (error: string | null) => void
  reset: () => void
  abort: () => void
}

export const useRunStore = create<RunState>((set, get) => ({
  isRunning: false,
  currentOutput: '',
  currentRecord: null,
  abortController: null,
  error: null,

  setRunning: (running) => set({ isRunning: running }),

  setCurrentOutput: (output) => set({ currentOutput: output }),

  appendOutput: (chunk) =>
    set((state) => ({ currentOutput: state.currentOutput + chunk })),

  setCurrentRecord: (record) => set({ currentRecord: record }),

  setAbortController: (controller) => set({ abortController: controller }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      isRunning: false,
      currentOutput: '',
      currentRecord: null,
      abortController: null,
      error: null,
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
