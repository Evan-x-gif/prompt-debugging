import { useState, lazy, Suspense } from 'react'
import { Copy, Check, AlertCircle, Clock, Coins, DollarSign } from 'lucide-react'
import JsonView from '@uiw/react-json-view'
import { useRunStore } from '@/stores/runStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { usePromptStore } from '@/stores/promptStore'
import { getCurlCommand } from '@/lib/api'
import { cn, copyToClipboard, formatJSON } from '@/lib/utils'
import { calculateCost, formatCost } from '@/lib/pricing'
import { SSEViewer } from './SSEViewer'

// Lazy load Markdown renderer
const MarkdownRenderer = lazy(() => import('./MarkdownRenderer'))

interface OutputPanelProps {
  activeTab: 'output' | 'compare' | 'raw' | 'sse'
  onTabChange: (tab: 'output' | 'compare' | 'raw' | 'sse') => void
}

export function OutputPanel({ activeTab, onTabChange }: OutputPanelProps) {
  const { isRunning, currentOutput, currentReasoning, currentRecord, error } = useRunStore()
  const { records, selectedIds } = useHistoryStore()
  const { config, params } = useWorkspaceStore()
  const { draft } = usePromptStore()

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center border-b border-border px-4 shrink-0">
        {(['output', 'compare', 'raw', 'sse'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab
                ? 'border-violet-500 text-violet-600 dark:text-violet-400 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'output' && '输出'}
            {tab === 'compare' && '对比'}
            {tab === 'raw' && '原始数据'}
            {tab === 'sse' && '事件流'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'output' && (
          <OutputTab
            isRunning={isRunning}
            output={currentOutput}
            reasoning={currentReasoning}
            record={currentRecord}
            error={error}
          />
        )}
        {activeTab === 'compare' && (
          <CompareTab records={records} selectedIds={selectedIds} />
        )}
        {activeTab === 'raw' && (
          <RawTab
            record={currentRecord}
            config={config}
            params={params}
            draft={draft}
          />
        )}
        {activeTab === 'sse' && (
          <SSETab />
        )}
      </div>
    </div>
  )
}

function SSETab() {
  const { sseEvents, clearSSEEvents } = useRunStore()
  return <SSEViewer events={sseEvents} onClear={clearSSEEvents} />
}

interface OutputTabProps {
  isRunning: boolean
  output: string
  reasoning: string
  record: ReturnType<typeof useRunStore.getState>['currentRecord']
  error: string | null
}

function OutputTab({ isRunning, output, reasoning, record, error }: OutputTabProps) {
  const [copied, setCopied] = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyReasoning = async () => {
    await copyToClipboard(reasoning)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">错误</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!output && !isRunning) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-foreground mb-1">准备就绪</p>
        <p className="text-sm text-center max-w-xs">
          在左侧配置参数，中间编写 Prompt，然后点击
          <kbd className="mx-1 px-1.5 py-0.5 text-xs rounded bg-muted border border-border font-mono">⌘+Enter</kbd>
          运行
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      {/* Metrics */}
      {record && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {/* 延迟 */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{record.metrics.latencyMs}ms</span>
            </div>
            {/* 首 token 延迟 */}
            {record.metrics.firstTokenMs && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="text-xs">首token:</span>
                <span>{record.metrics.firstTokenMs}ms</span>
              </div>
            )}
            {/* Token 统计 */}
            {record.metrics.totalTokens > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Coins className="w-4 h-4" />
                <span>{record.metrics.totalTokens} tokens</span>
              </div>
            )}
            {/* 结束原因 */}
            {record.metrics.finishReason && (
              <div className="flex items-center gap-1">
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded',
                  record.metrics.finishReason === 'stop' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : record.metrics.finishReason === 'length'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                )}>
                  {record.metrics.finishReason}
                </span>
              </div>
            )}
          </div>
          {/* 详细 token 分解 + 成本 */}
          {(record.metrics.promptTokens > 0 || record.metrics.completionTokens > 0) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>输入: {record.metrics.promptTokens}</span>
              <span>输出: {record.metrics.completionTokens}</span>
              {record.metrics.cachedTokens > 0 && (
                <span className="text-green-600 dark:text-green-400">
                  缓存命中: {record.metrics.cachedTokens}
                </span>
              )}
              {record.metrics.reasoningTokens > 0 && (
                <span className="text-purple-600 dark:text-purple-400">
                  推理: {record.metrics.reasoningTokens}
                </span>
              )}
              {/* 成本估算 */}
              {(() => {
                const cost = calculateCost(
                  record.modelId,
                  record.metrics.promptTokens,
                  record.metrics.completionTokens,
                  record.metrics.cachedTokens
                )
                return (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title={`输入: ${formatCost(cost.inputCost)} | 输出: ${formatCost(cost.outputCost)}${cost.cachedCost > 0 ? ` | 缓存: ${formatCost(cost.cachedCost)}` : ''}`}>
                    <DollarSign className="w-3 h-3" />
                    {formatCost(cost.totalCost)}
                  </span>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Reasoning Content (Collapsible) */}
      {reasoning && (
        <div className="relative">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className={cn(
              'w-full p-3 rounded-lg border border-purple-200 dark:border-purple-800/50',
              'bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20',
              'flex items-center justify-between',
              'hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors',
              'text-left'
            )}
          >
            <div className="flex items-center gap-2">
              <svg
                className={cn(
                  'w-4 h-4 transition-transform',
                  showReasoning ? 'rotate-90' : ''
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                思考过程
              </span>
              <span className="px-1.5 py-0.5 text-xs rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                {reasoning.length} 字符
              </span>
            </div>
            {!isRunning && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyReasoning()
                }}
                className={cn(
                  'p-1.5 rounded-md',
                  'bg-background/80 hover:bg-background border border-border',
                  'transition-colors'
                )}
                title="复制思考过程"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </button>
          
          {showReasoning && (
            <div
              className={cn(
                'mt-2 p-4 rounded-lg border border-purple-200 dark:border-purple-800/50',
                'bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20',
                'prose prose-sm dark:prose-invert max-w-none',
                'break-words overflow-wrap-anywhere',
                'whitespace-pre-wrap font-mono text-xs'
              )}
            >
              {reasoning}
              {isRunning && <span className="animate-pulse">▊</span>}
            </div>
          )}
        </div>
      )}

      {/* Output Content */}
      <div className="relative">
        <div
          className={cn(
            'p-4 rounded-lg border border-violet-200 dark:border-violet-800/50 bg-gradient-to-br from-white/80 to-violet-50/80 dark:from-violet-900/20 dark:to-indigo-900/20',
            'prose prose-sm dark:prose-invert max-w-none',
            'break-words overflow-wrap-anywhere'
          )}
        >
          <Suspense fallback={<div className="whitespace-pre-wrap">{output}</div>}>
            <MarkdownRenderer content={output} />
          </Suspense>
          {isRunning && <span className="animate-pulse">▊</span>}
        </div>

        {/* Copy Button */}
        {output && !isRunning && (
          <button
            onClick={handleCopy}
            className={cn(
              'absolute top-2 right-2 p-2 rounded-md',
              'bg-background/80 hover:bg-background border border-border',
              'transition-colors'
            )}
            title="复制输出"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

interface CompareTabProps {
  records: ReturnType<typeof useHistoryStore.getState>['records']
  selectedIds: string[]
}

function CompareTab({ records, selectedIds }: CompareTabProps) {
  const { selectRecord, deselectRecord } = useHistoryStore()

  const selectedRecords = selectedIds
    .map((id) => records.find((r) => r.id === id))
    .filter(Boolean)

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Record Selection */}
      <div className="space-y-2 shrink-0">
        <label className="text-sm font-medium">选择要对比的运行记录（最多 2 个）</label>
        <div className="flex flex-wrap gap-2">
          {records.slice(0, 10).map((record) => (
            <button
              key={record.id}
              onClick={() =>
                selectedIds.includes(record.id)
                  ? deselectRecord(record.id)
                  : selectRecord(record.id)
              }
              className={cn(
                'px-3 py-1.5 text-xs rounded-full border transition-colors',
                selectedIds.includes(record.id)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-accent'
              )}
            >
              {new Date(record.createdAt).toLocaleTimeString()} •{' '}
              {record.metrics.latencyMs}ms
            </button>
          ))}
        </div>
      </div>

      {/* Comparison View */}
      {selectedRecords.length === 2 ? (
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {selectedRecords.map((record, index) => (
            <div key={record!.id} className="flex flex-col space-y-2 min-h-0">
              <div className="text-sm font-medium shrink-0">
                Run {index + 1} •{' '}
                {new Date(record!.createdAt).toLocaleTimeString()}
              </div>
              <div className="flex-1 p-3 rounded-lg border border-border bg-muted/30 text-sm font-mono whitespace-pre-wrap overflow-auto">
                {record!.outputText || '(empty)'}
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {record!.metrics.latencyMs}ms • {record!.metrics.totalTokens} tokens
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            从历史记录中选择 2 次运行来对比其输出
          </p>
        </div>
      )}
    </div>
  )
}

interface RawTabProps {
  record: ReturnType<typeof useRunStore.getState>['currentRecord']
  config: ReturnType<typeof useWorkspaceStore.getState>['config']
  params: ReturnType<typeof useWorkspaceStore.getState>['params']
  draft: ReturnType<typeof usePromptStore.getState>['draft']
}

function RawTab({ record, config, params, draft }: RawTabProps) {
  const [subTab, setSubTab] = useState<'request' | 'response' | 'headers' | 'curl'>(
    'request'
  )
  const [copied, setCopied] = useState(false)

  const handleCopy = async (text: string) => {
    await copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const curlCommand = getCurlCommand(draft, params, config)

  return (
    <div className="h-full flex flex-col">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30">
        {(['request', 'response', 'headers', 'curl'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={cn(
              'px-3 py-1 text-xs rounded-md transition-colors',
              subTab === tab
                ? 'bg-background shadow-sm'
                : 'hover:bg-background/50'
            )}
          >
            {tab === 'request' && '请求'}
            {tab === 'response' && '响应'}
            {tab === 'headers' && '请求头'}
            {tab === 'curl' && 'cURL'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="relative">
          {subTab === 'request' && (
            <div className="p-4 rounded-lg bg-muted/30">
              {record ? (
                <JsonView
                  value={record.compiledRequestJson}
                  collapsed={2}
                  displayDataTypes={false}
                  displayObjectSize={true}
                  enableClipboard={true}
                  style={{
                    '--w-rjv-background-color': 'transparent',
                    '--w-rjv-font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    '--w-rjv-font-size': '0.875rem',
                    '--w-rjv-key-string': '#0ea5e9',
                    '--w-rjv-type-string-color': '#10b981',
                    '--w-rjv-type-int-color': '#f59e0b',
                    '--w-rjv-type-float-color': '#f59e0b',
                    '--w-rjv-type-boolean-color': '#8b5cf6',
                    '--w-rjv-type-null-color': '#6b7280',
                    '--w-rjv-brackets-color': '#64748b',
                    '--w-rjv-arrow-color': '#94a3b8',
                    '--w-rjv-colon-color': '#64748b',
                    '--w-rjv-quotes-string-color': '#10b981',
                  } as React.CSSProperties}
                />
              ) : (
                <p className="text-sm text-muted-foreground">运行请求查看编译后的 JSON</p>
              )}
            </div>
          )}

          {subTab === 'response' && (
            <div className="p-4 rounded-lg bg-muted/30">
              {record?.responseJson ? (
                <JsonView
                  value={record.responseJson}
                  collapsed={2}
                  displayDataTypes={false}
                  displayObjectSize={true}
                  enableClipboard={true}
                  style={{
                    '--w-rjv-background-color': 'transparent',
                    '--w-rjv-font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    '--w-rjv-font-size': '0.875rem',
                    '--w-rjv-key-string': '#0ea5e9',
                    '--w-rjv-type-string-color': '#10b981',
                    '--w-rjv-type-int-color': '#f59e0b',
                    '--w-rjv-type-float-color': '#f59e0b',
                    '--w-rjv-type-boolean-color': '#8b5cf6',
                    '--w-rjv-type-null-color': '#6b7280',
                    '--w-rjv-brackets-color': '#64748b',
                    '--w-rjv-arrow-color': '#94a3b8',
                    '--w-rjv-colon-color': '#64748b',
                    '--w-rjv-quotes-string-color': '#10b981',
                  } as React.CSSProperties}
                />
              ) : record ? (
                <p className="text-sm text-muted-foreground">(流式响应 - 无 JSON 主体)</p>
              ) : (
                <p className="text-sm text-muted-foreground">运行请求查看响应</p>
              )}
            </div>
          )}

          {subTab === 'headers' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">请求头</h4>
                <pre className="p-4 rounded-lg bg-muted/30 text-sm font-mono whitespace-pre-wrap">
                  {record
                    ? Object.entries(record.requestHeaders)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join('\n')
                    : '无请求头'}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">响应头</h4>
                <pre className="p-4 rounded-lg bg-muted/30 text-sm font-mono whitespace-pre-wrap">
                  {record && Object.keys(record.responseHeaders).length > 0
                    ? Object.entries(record.responseHeaders)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join('\n')
                    : '无响应头'}
                </pre>
                {record?.responseHeaders['x-request-id'] && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <strong>x-request-id:</strong>{' '}
                    {record.responseHeaders['x-request-id']}
                  </p>
                )}
              </div>
            </div>
          )}

          {subTab === 'curl' && (
            <pre className="p-4 rounded-lg bg-muted/30 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
              {curlCommand}
            </pre>
          )}

          {/* Copy Button */}
          <button
            onClick={() => {
              let text = ''
              if (subTab === 'request' && record) {
                text = formatJSON(record.compiledRequestJson)
              } else if (subTab === 'response' && record?.responseJson) {
                text = formatJSON(record.responseJson)
              } else if (subTab === 'headers' && record) {
                text = `Request Headers:\n${Object.entries(record.requestHeaders)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join('\n')}\n\nResponse Headers:\n${Object.entries(
                  record.responseHeaders
                )
                  .map(([k, v]) => `${k}: ${v}`)
                  .join('\n')}`
              } else if (subTab === 'curl') {
                text = curlCommand
              }
              if (text) handleCopy(text)
            }}
            className={cn(
              'absolute top-2 right-2 p-2 rounded-md',
              'bg-background/80 hover:bg-background border border-border',
              'transition-colors'
            )}
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
    </div>
  )
}
