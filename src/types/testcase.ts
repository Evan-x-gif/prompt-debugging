// ========== 测试用例类型 ==========
export interface TestCase {
  id: string
  name: string
  description: string
  variables: Record<string, string>
  expectedOutput?: string
  tags: string[]
  createdAt: string
}

export interface TestRun {
  id: string
  testCaseId: string
  modelId: string
  temperature: number
  outputText: string
  metrics: {
    latencyMs: number
    totalTokens: number
    finishReason: string | null
  }
  score?: number
  createdAt: string
}

export interface MatrixConfig {
  models: string[]
  temperatures: number[]
  testCaseIds: string[]
}

export interface MatrixResult {
  id: string
  config: MatrixConfig
  runs: TestRun[]
  createdAt: string
}

// ========== 评分类型 ==========
export interface ScoringRubric {
  id: string
  name: string
  criteria: {
    name: string
    description: string
    weight: number
  }[]
}

export interface ScoreResult {
  testRunId: string
  rubricId: string
  scores: {
    criteriaName: string
    score: number
    reason: string
  }[]
  totalScore: number
  feedback: string
}
