import type { WorkspaceConfig, PromptDraft } from '@/types'

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

/**
 * 验证工作区配置
 */
export function validateConfig(config: WorkspaceConfig): ValidationError[] {
  const errors: ValidationError[] = []

  // Base URL 验证
  if (!config.baseURL.trim()) {
    errors.push({
      field: 'baseURL',
      message: '请输入 API 基础 URL',
      severity: 'error',
    })
  } else {
    try {
      const url = new URL(config.baseURL)
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push({
          field: 'baseURL',
          message: 'URL 必须以 http:// 或 https:// 开头',
          severity: 'error',
        })
      }
    } catch {
      errors.push({
        field: 'baseURL',
        message: '无效的 URL 格式',
        severity: 'error',
      })
    }
  }

  // Model ID 验证
  if (!config.modelId.trim()) {
    errors.push({
      field: 'modelId',
      message: '请输入模型 ID',
      severity: 'error',
    })
  }

  // API Key 验证
  if (!config.apiKey.trim()) {
    errors.push({
      field: 'apiKey',
      message: '请输入 API 密钥',
      severity: 'warning',
    })
  } else if (config.apiKey.length < 20) {
    errors.push({
      field: 'apiKey',
      message: 'API 密钥格式可能不正确',
      severity: 'warning',
    })
  }

  return errors
}

/**
 * Prompt Lint - 检查常见问题
 */
export interface LintIssue {
  type: 'info' | 'warning' | 'suggestion'
  message: string
  location?: string
}

export function lintPrompt(draft: PromptDraft): LintIssue[] {
  const issues: LintIssue[] = []
  const instructionText = draft.instructionText.trim()
  const userContent = draft.userSegments
    .filter(s => s.enabled)
    .map(s => s.text)
    .join(' ')

  // 1. 检查是否有指令
  if (!instructionText) {
    issues.push({
      type: 'suggestion',
      message: '建议添加系统指令以获得更好的输出控制',
      location: 'instructions',
    })
  }

  // 2. 检查指令长度
  if (instructionText.length > 4000) {
    issues.push({
      type: 'warning',
      message: '系统指令过长，可能影响模型理解，建议精简',
      location: 'instructions',
    })
  }

  // 3. 检查是否有用户消息
  if (!userContent.trim()) {
    issues.push({
      type: 'warning',
      message: '用户消息为空，请添加内容',
      location: 'userSegments',
    })
  }

  // 4. 检查未替换的变量
  const variablePattern = /\{\{(\w+)\}\}/g
  const allText = instructionText + ' ' + userContent
  const matches = allText.match(variablePattern)
  if (matches) {
    const undefinedVars = matches.filter(match => {
      const varName = match.slice(2, -2)
      return !draft.variables[varName]
    })
    if (undefinedVars.length > 0) {
      issues.push({
        type: 'warning',
        message: `发现未定义的变量: ${undefinedVars.join(', ')}`,
        location: 'variables',
      })
    }
  }

  // 5. 检查重复内容
  const words = userContent.toLowerCase().split(/\s+/)
  const wordCount: Record<string, number> = {}
  words.forEach(word => {
    if (word.length > 5) {
      wordCount[word] = (wordCount[word] || 0) + 1
    }
  })
  const repeatedWords = Object.entries(wordCount)
    .filter(([, count]) => count > 5)
    .map(([word]) => word)
  if (repeatedWords.length > 0) {
    issues.push({
      type: 'info',
      message: `检测到重复词汇: ${repeatedWords.slice(0, 3).join(', ')}...`,
      location: 'userSegments',
    })
  }

  // 6. 检查常见提示词模式建议
  if (instructionText.toLowerCase().includes('you are')) {
    issues.push({
      type: 'suggestion',
      message: '使用 "You are..." 开头是好的实践，可以明确角色定位',
      location: 'instructions',
    })
  }

  // 7. 检查是否缺少输出格式说明
  const hasFormatInstruction = /format|json|markdown|列表|格式|输出/i.test(instructionText)
  if (!hasFormatInstruction && instructionText.length > 100) {
    issues.push({
      type: 'suggestion',
      message: '建议在指令中明确输出格式要求',
      location: 'instructions',
    })
  }

  // 8. 检查敏感信息
  const sensitivePatterns = [
    /sk-[a-zA-Z0-9]{20,}/,
    /password\s*[:=]\s*\S+/i,
    /api[_-]?key\s*[:=]\s*\S+/i,
  ]
  for (const pattern of sensitivePatterns) {
    if (pattern.test(allText)) {
      issues.push({
        type: 'warning',
        message: '检测到可能的敏感信息，请检查是否需要移除',
        location: 'content',
      })
      break
    }
  }

  return issues
}

/**
 * 检查是否可以运行
 */
export function canRun(config: WorkspaceConfig, draft: PromptDraft): { ok: boolean; reason?: string } {
  const configErrors = validateConfig(config).filter(e => e.severity === 'error')
  if (configErrors.length > 0) {
    return { ok: false, reason: configErrors[0].message }
  }

  const hasContent = draft.userSegments.some(s => s.enabled && s.text.trim())
  if (!hasContent && !draft.instructionText.trim()) {
    return { ok: false, reason: '请输入提示词内容' }
  }

  return { ok: true }
}
