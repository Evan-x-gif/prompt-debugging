import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertCircle, Check, Copy, FileJson } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { cn, copyToClipboard } from '@/lib/utils'

const SCHEMA_TEMPLATES = [
  {
    name: '测试用例',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '用例标题' },
        description: { type: 'string', description: '用例描述' },
        steps: {
          type: 'array',
          items: { type: 'string' },
          description: '测试步骤',
        },
        expectedResult: { type: 'string', description: '预期结果' },
        testData: {
          type: 'object',
          description: '测试数据',
          additionalProperties: true,
        },
      },
      required: ['title', 'steps', 'expectedResult'],
      additionalProperties: false,
    },
  },
  {
    name: '通用结果',
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: '主要内容' },
        details: {
          type: 'array',
          items: { type: 'string' },
          description: '详细信息',
        },
        metadata: {
          type: 'object',
          description: '元数据',
          additionalProperties: true,
        },
      },
      required: ['content'],
      additionalProperties: false,
    },
  },
  {
    name: '列表提取',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { type: 'string' },
          description: '提取的项目列表',
        },
        summary: { type: 'string', description: '总结' },
      },
      required: ['items'],
      additionalProperties: false,
    },
  },
  {
    name: '分类结果',
    schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['positive', 'negative', 'neutral'],
          description: '分类结果',
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: '置信度',
        },
        reason: { type: 'string', description: '分类理由' },
      },
      required: ['category', 'confidence', 'reason'],
      additionalProperties: false,
    },
  },
  {
    name: '实体提取',
    schema: {
      type: 'object',
      properties: {
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['person', 'organization', 'location', 'other'] },
              context: { type: 'string', description: '上下文' },
            },
            required: ['name', 'type'],
            additionalProperties: false,
          },
          description: '提取的实体列表',
        },
        summary: { type: 'string', description: '总结' },
      },
      required: ['entities'],
      additionalProperties: false,
    },
  },
  {
    name: '问答结果',
    schema: {
      type: 'object',
      properties: {
        answer: { type: 'string', description: '答案' },
        sources: {
          type: 'array',
          items: { type: 'string' },
          description: '来源引用',
        },
        confidence: { type: 'number', description: '置信度 0-1' },
        reasoning: { type: 'string', description: '推理过程' },
      },
      required: ['answer'],
      additionalProperties: false,
    },
  },
]

export function StructuredOutputPanel() {
  const { config, params, setParams } = useWorkspaceStore()
  const [expanded, setExpanded] = useState(false)
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const validateSchema = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json)
      if (typeof parsed !== 'object' || parsed === null) {
        setSchemaError('Schema 必须是一个对象')
        return false
      }
      if (!parsed.type) {
        setSchemaError('Schema 缺少 type 字段')
        return false
      }
      setSchemaError(null)
      return true
    } catch (e) {
      setSchemaError('JSON 语法错误: ' + (e as Error).message)
      return false
    }
  }

  const handleSchemaChange = (value: string) => {
    setParams({
      structuredOutput: {
        ...params.structuredOutput,
        schemaJson: value,
      },
    })
    validateSchema(value)
  }

  const applyTemplate = (template: typeof SCHEMA_TEMPLATES[0]) => {
    const json = JSON.stringify(template.schema, null, 2)
    setParams({
      structuredOutput: {
        ...params.structuredOutput,
        schemaJson: json,
        enabled: true,
      },
    })
    setSchemaError(null)
  }

  const handleCopy = async () => {
    await copyToClipboard(params.structuredOutput.schemaJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2',
          'bg-gradient-to-r from-cyan-100/80 to-blue-100/80 dark:from-cyan-900/30 dark:to-blue-900/30',
          'hover:from-cyan-200/80 hover:to-blue-200/80 dark:hover:from-cyan-800/40 dark:hover:to-blue-800/40 transition-all'
        )}
      >
        <div className="flex items-center gap-2">
          <FileJson className="w-4 h-4" />
          <span className="text-sm font-medium">结构化输出</span>
          {params.structuredOutput.enabled && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-cyan-500 text-white">启用</span>
          )}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">启用结构化输出</label>
            <button
              onClick={() =>
                setParams({
                  structuredOutput: {
                    ...params.structuredOutput,
                    enabled: !params.structuredOutput.enabled,
                  },
                })
              }
              className={cn(
                'w-10 h-6 rounded-full transition-colors',
                params.structuredOutput.enabled
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span
                className={cn(
                  'block w-4 h-4 rounded-full bg-white transition-transform',
                  params.structuredOutput.enabled ? 'translate-x-5' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {params.structuredOutput.enabled && (
            <>
              {/* Strict Mode */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">严格模式</label>
                    <p className="text-xs text-muted-foreground">强制输出完全匹配 Schema</p>
                  </div>
                  <button
                    onClick={() =>
                      setParams({
                        structuredOutput: {
                          ...params.structuredOutput,
                          strict: !params.structuredOutput.strict,
                        },
                      })
                    }
                    className={cn(
                      'w-10 h-6 rounded-full transition-colors',
                      params.structuredOutput.strict
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'block w-4 h-4 rounded-full bg-white transition-transform',
                        params.structuredOutput.strict ? 'translate-x-5' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    <strong>模型要求：</strong>严格模式需要模型支持 JSON Schema。OpenAI GPT-4o/4o-mini、Anthropic Claude 3.5+ 等新模型完全支持。
                    部分聚合 API 也支持此功能。
                  </span>
                </div>
                {params.structuredOutput.strict && (
                  <div className="flex items-start gap-1.5 text-xs text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>
                      <strong>注意：</strong>严格模式会在 Token 级别强制执行 Schema。
                      如果 Schema 过于简单（如只有一个字段），可能导致输出异常。
                      建议使用包含多个字段的模板。
                    </span>
                  </div>
                )}
              </div>

              {/* Templates */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">快速模板</label>
                <div className="flex flex-wrap gap-1.5">
                  {SCHEMA_TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => applyTemplate(template)}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full border transition-colors',
                        'border-input hover:bg-cyan-50 dark:hover:bg-cyan-900/20'
                      )}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schema Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">JSON Schema</label>
                  <button
                    onClick={handleCopy}
                    className="p-1 hover:bg-accent rounded"
                    title="复制"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <textarea
                  value={params.structuredOutput.schemaJson}
                  onChange={(e) => handleSchemaChange(e.target.value)}
                  className={cn(
                    'w-full h-48 px-3 py-2 rounded-md text-sm font-mono',
                    'bg-background border',
                    schemaError ? 'border-red-500' : 'border-input',
                    'focus:outline-none focus:ring-2',
                    schemaError ? 'focus:ring-red-500' : 'focus:ring-ring',
                    'resize-y'
                  )}
                  placeholder='{"type": "object", "properties": {...}}'
                />
                {schemaError && (
                  <div className="flex items-start gap-1.5 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{schemaError}</span>
                  </div>
                )}
              </div>

              {/* API Mode Note */}
              <div className="text-xs text-muted-foreground p-2 rounded bg-muted/50">
                {config.endpointMode === 'responses' ? (
                  <span>Responses API: 使用 text.format.json_schema</span>
                ) : (
                  <span>Chat Completions: 使用 response_format.json_schema</span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
