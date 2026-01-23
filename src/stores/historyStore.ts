import { create } from 'zustand'
import type { RunRecord } from '@/types'
import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'prompt-debugger'
const STORE_NAME = 'run-history'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('createdAt', 'createdAt')
        }
      },
    })
  }
  return dbPromise
}

interface HistoryState {
  records: RunRecord[]
  selectedIds: string[]
  isLoading: boolean
  loadRecords: () => Promise<void>
  addRecord: (record: RunRecord) => Promise<void>
  updateRecord: (id: string, updates: Partial<RunRecord>) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  clearRecords: () => Promise<void>
  selectRecord: (id: string) => void
  deselectRecord: (id: string) => void
  clearSelection: () => void
  getRecordById: (id: string) => RunRecord | undefined
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  records: [],
  selectedIds: [],
  isLoading: false,

  loadRecords: async () => {
    set({ isLoading: true })
    try {
      const db = await getDB()
      const records = await db.getAllFromIndex(STORE_NAME, 'createdAt')
      set({ records: records.reverse() })
    } catch (error) {
      console.error('Failed to load records:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  addRecord: async (record) => {
    try {
      const db = await getDB()
      await db.put(STORE_NAME, record)
      set((state) => ({ records: [record, ...state.records] }))
    } catch (error) {
      console.error('Failed to add record:', error)
    }
  },

  updateRecord: async (id, updates) => {
    try {
      const db = await getDB()
      const record = await db.get(STORE_NAME, id)
      if (record) {
        const updated = { ...record, ...updates }
        await db.put(STORE_NAME, updated)
        set((state) => ({
          records: state.records.map((r) => (r.id === id ? updated : r)),
        }))
      }
    } catch (error) {
      console.error('Failed to update record:', error)
    }
  },

  deleteRecord: async (id) => {
    try {
      const db = await getDB()
      await db.delete(STORE_NAME, id)
      set((state) => ({
        records: state.records.filter((r) => r.id !== id),
        selectedIds: state.selectedIds.filter((sid) => sid !== id),
      }))
    } catch (error) {
      console.error('Failed to delete record:', error)
    }
  },

  clearRecords: async () => {
    try {
      const db = await getDB()
      await db.clear(STORE_NAME)
      set({ records: [], selectedIds: [] })
    } catch (error) {
      console.error('Failed to clear records:', error)
    }
  },

  selectRecord: (id) =>
    set((state) => {
      if (state.selectedIds.includes(id)) return state
      if (state.selectedIds.length >= 2) {
        return { selectedIds: [state.selectedIds[1], id] }
      }
      return { selectedIds: [...state.selectedIds, id] }
    }),

  deselectRecord: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    })),

  clearSelection: () => set({ selectedIds: [] }),

  getRecordById: (id) => get().records.find((r) => r.id === id),
}))
