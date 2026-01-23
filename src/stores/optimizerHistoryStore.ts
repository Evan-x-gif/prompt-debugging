import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OptimizationHistory } from '@/lib/optimizer'

interface OptimizerHistoryState {
  history: OptimizationHistory[]
  addHistory: (record: OptimizationHistory) => void
  removeHistory: (id: string) => void
  clearHistory: () => void
  getHistory: (id: string) => OptimizationHistory | undefined
}

const MAX_HISTORY = 10

export const useOptimizerHistoryStore = create<OptimizerHistoryState>()(
  persist(
    (set, get) => ({
      history: [],

      addHistory: (record) => {
        set((state) => {
          const newHistory = [record, ...state.history].slice(0, MAX_HISTORY)
          return { history: newHistory }
        })
      },

      removeHistory: (id) => {
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        }))
      },

      clearHistory: () => {
        set({ history: [] })
      },

      getHistory: (id) => {
        return get().history.find((h) => h.id === id)
      },
    }),
    {
      name: 'optimizer-history-storage',
    }
  )
)
