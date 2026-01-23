import type { WorkspaceConfig } from '@/types'
import type { ScoringRubric, ScoreResult } from '@/types/testcase'

// ========== 默认评分标准 ==========
export const DEFAULT_RUBRICS: ScoringRubric[] = [
  {
    id: 'general',
    name: '通用评分',
    criteria: [
      { name: '相关性', description: '输出是否与问题相关', weight: 0.3 },
      { name: '准确性', description: '信息是否准确无误', weight: 0.3 },
      { name: '完整性', description: '是否完整回答了问题', weight: 0.2 },
      { name: '清晰度', description: '表达是否清晰易懂', weight: 0.2 },
    ],
  },
  {
    id: 'code',
    name: '代码评分',
    criteria: [
      { name: '正确性', description: '代码是否能正确运行', weight: 0.4 },
      { name: '可读性', description: '代码是否易于理解', weight: 0.2 },
      { name: '效率', description: '算法是否高效', weight: 0.2 },
      { name: '规范性', description: '是否遵循最佳实践', weight: 0.2 },
    ],
  },
  {
    id: 'creative',
    name: '创意评分',
    criteria: [
      { name: '创意性', description: '内容是否有创意', weight: 0.3 },
      { name: '连贯性', description: '叙述是否连贯', weight: 0.25 },
      { name: '表达力', description: '语言是否生动', weight: 0.25 },
      { name: '主题契合', description: '是否符合主题要求', weight: 0.2 },
    ],
  },
]

// ========== 评分 Prompt 模板 ==========
const JUDGE_SYSTEM_PROMPT = `你是一个专业的输出质量评估专家。你需要根据给定的评分标准，对 AI 的输出进行客观评分。

## 输出要求
你必须严格按照以下 JSON 格式输出，不要输出任何其他内容：

{
  "scores": [
    {
      "criteria_name": "标准名称",
      "score": 0-10 的整数,
      "reason": "评分理由（简短）"
    }
  ],
  "total_score": 加权总分（0-10，保留1位小数）,
  "feedback": "总体反馈（2-3句话）"
}

## 评分原则
1. 客观公正，基于事实评分
2. 每个维度独立评分，不受其他维度影响
3. 评分理由要具体，指出优点或不足
4. 总体反馈要有建设性`

function buildJudgeUserPrompt(
  rubric: ScoringRubric,
  prompt: string,
  output: string,
  expectedOutput?: string
): string {
  let content = `## 评分标准：${rubric.name}

${rubric.criteria.map(c => `- **${c.name}**（权重 ${c.weight * 100}%）：${c.description}`).join('\n')}

## 原始提示词
${prompt}

## AI 输出
${output}`

  if (expectedOutput) {
    content += `

## 期望输出（参考）
${expectedOutput}`
  }

  content += `

## 任务
请根据以上评分标准，对 AI 输出进行评分。严格按照 JSON 格式输出。`

  return content
}

// ========== 评分执行函数 ==========
export async function judgeOutput(
  rubric: ScoringRubric,
  prompt: string,
  output: string,
  config: WorkspaceConfig,
  expectedOutput?: string,
  abortSignal?: AbortSignal
): Promise<ScoreResult> {
  const url = config.useProxy
    ? `/api/proxy?target=${encodeURIComponent(config.baseURL + '/v1/chat/completions')}`
    : config.baseURL + '/v1/chat/completions'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (config.apiKey && !config.useProxy) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  }
  if (config.useProxy && config.apiKey) {
    headers['X-API-Key'] = config.apiKey
  }

  const body = {
    model: config.modelId,
    messages: [
      { role: 'system', content: JUDGE_SYSTEM_PROMPT },
      { role: 'user', content: buildJudgeUserPrompt(rubric, prompt, output, expectedOutput) },
    ],
    temperature: 0.1, // 极低温度保证评分稳定
    max_tokens: 1000,
    response_format: {
      type: 'json_object',
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: abortSignal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`评分请求失败: ${response.status} - ${errorText}`)
  }

  const json = await response.json()
  const content = json.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('评分器未返回有效内容')
  }

  try {
    const result = JSON.parse(content)
    return {
      testRunId: '', // 由调用方填充
      rubricId: rubric.id,
      scores: result.scores.map((s: any) => ({
        criteriaName: s.criteria_name,
        score: s.score,
        reason: s.reason,
      })),
      totalScore: result.total_score,
      feedback: result.feedback,
    }
  } catch (e) {
    throw new Error('评分器返回格式错误: ' + (e as Error).message)
  }
}

// ========== 本地快速评估（不调用 API）==========
export function quickEvaluate(output: string, expectedOutput?: string): {
  similarity: number
  issues: string[]
} {
  const issues: string[] = []
  let similarity = 0

  // 基本检查
  if (!output.trim()) {
    issues.push('输出为空')
    return { similarity: 0, issues }
  }

  // 长度检查
  if (output.length < 10) {
    issues.push('输出过短')
  }

  // 如果有期望输出，计算相似度
  if (expectedOutput) {
    const outputWords = new Set(output.toLowerCase().split(/\s+/))
    const expectedWords = new Set(expectedOutput.toLowerCase().split(/\s+/))
    
    let matchCount = 0
    expectedWords.forEach(word => {
      if (outputWords.has(word)) matchCount++
    })
    
    similarity = expectedWords.size > 0 ? matchCount / expectedWords.size : 0
    
    if (similarity < 0.3) {
      issues.push('与期望输出差异较大')
    }
  }

  // 检查常见问题
  if (/i don't know|i cannot|i'm not sure|无法回答|不确定/i.test(output)) {
    issues.push('模型表示无法回答')
  }

  if (/error|exception|failed/i.test(output) && output.length < 100) {
    issues.push('可能包含错误信息')
  }

  return { similarity, issues }
}
