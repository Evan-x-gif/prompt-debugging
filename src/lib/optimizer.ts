import type { PromptDraft, WorkspaceConfig, ParamsDraft } from '@/types'

// ========== 优化策略类型 ==========
export interface OptimizationStrategy {
  id: string
  name: string
  description: string
  enabled: boolean
}

export const DEFAULT_STRATEGIES: OptimizationStrategy[] = [
  {
    id: 'clarify_task',
    name: '明确任务',
    description: '补齐角色定位、目标描述、边界条件',
    enabled: true,
  },
  {
    id: 'add_constraints',
    name: '补约束',
    description: '明确输出格式、禁用项、长度限制、语气要求',
    enabled: true,
  },
  {
    id: 'add_examples',
    name: '补示例',
    description: '添加 few-shot 示例提升输出一致性',
    enabled: false,
  },
  {
    id: 'add_self_check',
    name: '补自检',
    description: '让模型在输出前检查是否满足要求',
    enabled: false,
  },
  {
    id: 'structured_output',
    name: '结构化输出',
    description: '自动生成 JSON Schema 约束输出格式',
    enabled: false,
  },
  {
    id: 'robustness',
    name: '稳健性',
    description: '处理缺参、不确定情况的兜底策略',
    enabled: true,
  },
]

// ========== 优化结果类型 ==========
export interface OptimizationResult {
  optimizedPrompt: {
    instructionText: string
    userSegments: { text: string }[]
  }
  diffSummary: string[]
  riskFlags: string[]
  testSuggestions: string[]
  generatedSchema?: object
}

// ========== 历史记录类型 ==========
export interface OptimizationHistory {
  id: string
  timestamp: number
  strategies: string[]  // 启用的策略名称
  original: {
    instructionText: string
    userMessage: string
  }
  optimized: {
    instructionText: string
    userMessage: string
  }
  diffSummary: string[]
  riskFlags: string[]
}

// ========== 优化器 Prompt 模板 ==========
const OPTIMIZER_SYSTEM_PROMPT = `你是一个专业的 Prompt 优化专家。你的任务是根据用户提供的原始 prompt 和启用的优化策略，生成一个更好的 prompt。

## 输出要求
你必须严格按照以下 JSON 格式输出，不要输出任何其他内容：

{
  "optimized_instruction": "优化后的系统指令",
  "optimized_user_message": "优化后的用户消息",
  "diff_summary": ["改动1", "改动2", ...],
  "risk_flags": ["风险提示1", ...] 或 [],
  "test_suggestions": ["测试建议1", ...],
  "generated_schema": null 或 {...} (仅当启用结构化输出策略时)
}

## 优化原则
1. 保持原始意图不变
2. 不要过度改写，只做必要的增强
3. 每条改动都要在 diff_summary 中说明
4. 如果改动可能改变语义，在 risk_flags 中提示
5. 提供可验证改写效果的测试建议`

function buildOptimizerUserPrompt(
  draft: PromptDraft,
  strategies: OptimizationStrategy[]
): string {
  const enabledStrategies = strategies.filter(s => s.enabled)
  
  const userContent = draft.userSegments
    .filter(s => s.enabled)
    .map(s => s.text)
    .join('\n\n')

  return `## 原始 Prompt

### 系统指令
${draft.instructionText || '(无)'}

### 用户消息
${userContent || '(无)'}

## 启用的优化策略
${enabledStrategies.map(s => `- **${s.name}**: ${s.description}`).join('\n')}

## 任务
请根据以上启用的优化策略，优化这个 prompt。严格按照 JSON 格式输出。`
}

// ========== 优化器执行函数 ==========
export async function optimizePrompt(
  draft: PromptDraft,
  strategies: OptimizationStrategy[],
  config: WorkspaceConfig,
  _params: ParamsDraft,
  abortSignal?: AbortSignal
): Promise<OptimizationResult> {
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
      { role: 'system', content: OPTIMIZER_SYSTEM_PROMPT },
      { role: 'user', content: buildOptimizerUserPrompt(draft, strategies) },
    ],
    temperature: 0.3, // 低温度保证稳定性
    max_tokens: 2000,
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
    throw new Error(`优化请求失败: ${response.status} - ${errorText}`)
  }

  const json = await response.json()
  const content = json.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('优化器未返回有效内容')
  }

  try {
    const result = JSON.parse(content)
    return {
      optimizedPrompt: {
        instructionText: result.optimized_instruction || draft.instructionText,
        userSegments: [{ text: result.optimized_user_message || '' }],
      },
      diffSummary: result.diff_summary || [],
      riskFlags: result.risk_flags || [],
      testSuggestions: result.test_suggestions || [],
      generatedSchema: result.generated_schema || undefined,
    }
  } catch (e) {
    throw new Error('优化器返回格式错误: ' + (e as Error).message)
  }
}

// ========== 本地快速优化（不调用 API）==========
export function quickOptimize(
  draft: PromptDraft,
  strategies: OptimizationStrategy[]
): { suggestions: string[]; autoFixes: Partial<PromptDraft> } {
  const suggestions: string[] = []
  const autoFixes: Partial<PromptDraft> = {}

  const instruction = draft.instructionText.trim()
  const userContent = draft.userSegments
    .filter(s => s.enabled)
    .map(s => s.text)
    .join(' ')

  // 策略：明确任务
  if (strategies.find(s => s.id === 'clarify_task' && s.enabled)) {
    if (!instruction) {
      suggestions.push('建议添加系统指令，明确 AI 的角色和任务目标')
    } else if (instruction.length < 50) {
      suggestions.push('系统指令较短，建议补充更多上下文和约束')
    }
    if (!instruction.toLowerCase().includes('you are') && !instruction.includes('你是')) {
      suggestions.push('建议以 "You are..." 或 "你是..." 开头明确角色')
    }
  }

  // 策略：补约束
  if (strategies.find(s => s.id === 'add_constraints' && s.enabled)) {
    const hasFormatInstruction = /format|json|markdown|列表|格式|输出/i.test(instruction)
    if (!hasFormatInstruction && instruction.length > 50) {
      suggestions.push('建议在指令中明确输出格式要求（如 JSON、Markdown、列表等）')
    }
    const hasLengthConstraint = /长度|字数|简短|详细|concise|brief|detailed/i.test(instruction)
    if (!hasLengthConstraint) {
      suggestions.push('建议添加输出长度约束（如"简短回答"或"详细解释"）')
    }
  }

  // 策略：补示例
  if (strategies.find(s => s.id === 'add_examples' && s.enabled)) {
    const hasExample = /例如|example|示例|比如|e\.g\./i.test(instruction + userContent)
    if (!hasExample) {
      suggestions.push('建议添加 1-2 个示例（few-shot）提升输出一致性')
    }
  }

  // 策略：稳健性
  if (strategies.find(s => s.id === 'robustness' && s.enabled)) {
    const hasErrorHandling = /如果|不确定|无法|错误|if|cannot|error|fallback/i.test(instruction)
    if (!hasErrorHandling) {
      suggestions.push('建议添加异常处理指令（如"如果无法回答，请说明原因"）')
    }
  }

  // 检查变量
  const variablePattern = /\{\{(\w+)\}\}/g
  const allText = instruction + ' ' + userContent
  const matches = allText.match(variablePattern)
  if (matches) {
    const undefinedVars = matches.filter(match => {
      const varName = match.slice(2, -2)
      return !draft.variables[varName]
    })
    if (undefinedVars.length > 0) {
      suggestions.push(`发现未定义的变量: ${undefinedVars.join(', ')}，请在变量面板中定义`)
    }
  }

  return { suggestions, autoFixes }
}
