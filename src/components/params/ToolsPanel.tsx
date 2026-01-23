import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertCircle, Check, Copy, Wrench } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { cn, copyToClipboard } from '@/lib/utils'

const TOOL_TEMPLATES = [
  {
    name: '获取天气',
    tool: {
      type: 'function',
      function: {
        name: 'get_weather',
        description: '获取指定城市的天气信息',
        parameters: {
          type: 'object',
          properties: {
            city: { type: 'string', description: '城市名称' },
            unit: { type: 'string', enum: ['celsius', 'fahrenheit'], description: '温度单位' },
          },
          required: ['city'],
        },
      },
    },
  },
  {
    name: '搜索',
    tool: {
      type: 'function',
      function: {
        name: 'search',
        description: '搜索互联网获取信息',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索关键词' },
            max_results: { type: 'integer', description: '最大结果数', default: 5 },
          },
          required: ['query'],
        },
      },
    },
  },
  {
    name: '代码执行',
    tool: {
      type: 'function',
      function: {
        name: 'execute_code',
        description: '执行 Python 代码并返回结果',
        parameters: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Python 代码' },
            timeout: { type: 'integer', description: '超时时间（秒）', default: 30 },
          },
          required: ['code'],
        },
      },
    },
  },
  {
    name: '数据库查询',
    tool: {
      type: 'function',
      function: {
        name: 'query_database',
        description: '执行 SQL 查询',
        parameters: {
          type: 'object',
          properties: {
            sql: { type: 'string', description: 'SQL 查询语句' },
            database: { type: 'string', description: '数据库名称' },
          },
          required: ['sql'],
        },
      },
    },
  },
]

export function ToolsPanel() {
  const { params, setParams } = useWorkspaceStore()
  const [expanded, setExpanded] = useState(false)
  const [toolsError, setToolsError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const validateTools = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json)
      if (!Array.isArray(parsed)) {
        setToolsError('Tools 必须是一个数组')
        return false
      }
      for (const tool of parsed) {
        if (!tool.type || !tool.function) {
          setToolsError('每个 tool 必须包含 type 和 function 字段')
          return false
        }
      }
      setToolsError(null)
      return true
    } catch (e) {
      setToolsError('JSON 语法错误: ' + (e as Error).message)
      return false
    }
  }

  const handleToolsChange = (value: string) => {
    setParams({
      tools: {
        ...params.tools,
        toolJson: value,
      },
    })
    validateTools(value)
  }

  const applyTemplate = (template: typeof TOOL_TEMPLATES[0]) => {
    try {
      const currentTools = JSON.parse(params.tools.toolJson || '[]')
      const newTools = [...currentTools, template.tool]
      const json = JSON.stringify(newTools, null, 2)
      setParams({
        tools: {
          ...params.tools,
          toolJson: json,
          enabled: true,
        },
      })
      setToolsError(null)
    } catch {
      const json = JSON.stringify([template.tool], null, 2)
      setParams({
        tools: {
          ...params.tools,
          toolJson: json,
          enabled: true,
        },
      })
      setToolsError(null)
    }
  }

  const clearTools = () => {
    setParams({
      tools: {
        ...params.tools,
        toolJson: '[]',
      },
    })
    setToolsError(null)
  }

  const handleCopy = async () => {
    await copyToClipboard(params.tools.toolJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2',
          'bg-gradient-to-r from-orange-100/80 to-amber-100/80 dark:from-orange-900/30 dark:to-amber-900/30',
          'hover:from-orange-200/80 hover:to-amber-200/80 dark:hover:from-orange-800/40 dark:hover:to-amber-800/40 transition-all'
        )}
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          <span className="text-sm font-medium">工具调用</span>
          {params.tools.enabled && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-orange-500 text-white">启用</span>
          )}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">启用工具调用</label>
            <button
              onClick={() =>
                setParams({
                  tools: {
                    ...params.tools,
                    enabled: !params.tools.enabled,
                  },
                })
              }
              className={cn(
                'w-10 h-6 rounded-full transition-colors',
                params.tools.enabled
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span
                className={cn(
                  'block w-4 h-4 rounded-full bg-white transition-transform',
                  params.tools.enabled ? 'translate-x-5' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {params.tools.enabled && (
            <>
              {/* Tool Choice */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">工具选择策略</label>
                <select
                  value={params.tools.toolChoice}
                  onChange={(e) =>
                    setParams({
                      tools: {
                        ...params.tools,
                        toolChoice: e.target.value,
                      },
                    })
                  }
                  className={cn(
                    'w-full px-3 py-2 rounded-md text-sm',
                    'bg-background border border-input',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                >
                  <option value="auto">自动 (auto)</option>
                  <option value="none">禁用 (none)</option>
                  <option value="required">必须调用 (required)</option>
                </select>
              </div>

              {/* Parallel Tool Calls */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">并行调用</label>
                  <p className="text-xs text-muted-foreground">允许同时调用多个工具</p>
                </div>
                <button
                  onClick={() =>
                    setParams({
                      tools: {
                        ...params.tools,
                        parallelToolCalls: !params.tools.parallelToolCalls,
                      },
                    })
                  }
                  className={cn(
                    'w-10 h-6 rounded-full transition-colors',
                    params.tools.parallelToolCalls
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'block w-4 h-4 rounded-full bg-white transition-transform',
                      params.tools.parallelToolCalls ? 'translate-x-5' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Templates */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">添加工具模板</label>
                <div className="flex flex-wrap gap-1.5">
                  {TOOL_TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => applyTemplate(template)}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full border transition-colors',
                        'border-input hover:bg-orange-50 dark:hover:bg-orange-900/20'
                      )}
                    >
                      + {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tools Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Tools JSON</label>
                  <div className="flex gap-1">
                    <button
                      onClick={clearTools}
                      className="px-2 py-0.5 text-xs hover:bg-accent rounded"
                    >
                      清空
                    </button>
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
                </div>
                <textarea
                  value={params.tools.toolJson}
                  onChange={(e) => handleToolsChange(e.target.value)}
                  className={cn(
                    'w-full h-48 px-3 py-2 rounded-md text-sm font-mono',
                    'bg-background border',
                    toolsError ? 'border-red-500' : 'border-input',
                    'focus:outline-none focus:ring-2',
                    toolsError ? 'focus:ring-red-500' : 'focus:ring-ring',
                    'resize-y'
                  )}
                  placeholder='[{"type": "function", "function": {...}}]'
                />
                {toolsError && (
                  <div className="flex items-start gap-1.5 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{toolsError}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
