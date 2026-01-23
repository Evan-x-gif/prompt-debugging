import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TestCase, TestRun, MatrixResult } from '@/types/testcase'
import { generateId } from '@/lib/utils'

interface TestState {
  testCases: TestCase[]
  testRuns: TestRun[]
  matrixResults: MatrixResult[]
  
  // Test Cases
  addTestCase: (testCase: Omit<TestCase, 'id' | 'createdAt'>) => string
  updateTestCase: (id: string, updates: Partial<TestCase>) => void
  removeTestCase: (id: string) => void
  
  // Test Runs
  addTestRun: (run: Omit<TestRun, 'id' | 'createdAt'>) => string
  
  // Matrix
  addMatrixResult: (result: Omit<MatrixResult, 'id' | 'createdAt'>) => string
  
  // Queries
  getTestCase: (id: string) => TestCase | undefined
  getRunsForTestCase: (testCaseId: string) => TestRun[]
}

export const useTestStore = create<TestState>()(
  persist(
    (set, get) => ({
      testCases: [],
      testRuns: [],
      matrixResults: [],

      addTestCase: (testCase) => {
        const id = generateId()
        set((state) => ({
          testCases: [
            ...state.testCases,
            {
              ...testCase,
              id,
              createdAt: new Date().toISOString(),
            },
          ],
        }))
        return id
      },

      updateTestCase: (id, updates) => {
        set((state) => ({
          testCases: state.testCases.map((tc) =>
            tc.id === id ? { ...tc, ...updates } : tc
          ),
        }))
      },

      removeTestCase: (id) => {
        set((state) => ({
          testCases: state.testCases.filter((tc) => tc.id !== id),
          testRuns: state.testRuns.filter((tr) => tr.testCaseId !== id),
        }))
      },

      addTestRun: (run) => {
        const id = generateId()
        set((state) => ({
          testRuns: [
            ...state.testRuns,
            {
              ...run,
              id,
              createdAt: new Date().toISOString(),
            },
          ],
        }))
        return id
      },

      addMatrixResult: (result) => {
        const id = generateId()
        set((state) => ({
          matrixResults: [
            ...state.matrixResults,
            {
              ...result,
              id,
              createdAt: new Date().toISOString(),
            },
          ],
        }))
        return id
      },

      getTestCase: (id) => {
        return get().testCases.find((tc) => tc.id === id)
      },

      getRunsForTestCase: (testCaseId) => {
        return get().testRuns.filter((tr) => tr.testCaseId === testCaseId)
      },
    }),
    {
      name: 'prompt-debugger-tests',
    }
  )
)
