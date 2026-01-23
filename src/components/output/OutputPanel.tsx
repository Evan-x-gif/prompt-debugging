import { useState } from 'react'
import { Copy, Check, AlertCircle, Clock, Coins } from 'lucide-react'
import { useRunStore } from '@/stores/runStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { usePromptStore } from '@/stores/promptStore'
import { getCurlCommand } from '@/lib/api'
import { cn, copyToClipboard, formatJSON } from '@/lib/utils'

interface OutputPanelProps {
  activeTab: 'output' | 'compare' | 'raw'
  onTabChange: (tab: 'output' | 'compare' | 'raw') => void
}

export function OutputPanel({ activeTab, onTabChange }: OutputPanelProps) {
  const { isRunning, currentOutput, currentRecord, error } = useRunStore()
  const { records, selectedIds } = useHistoryStore()
  const { config, params } = useWorkspaceStore()
  const { draft } = usePromptStore()

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center border-b border-border px-4 shrink-0">
        {(['output', 'compare', 'raw'] as const).map((tab) => (
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
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'output' && (
          <OutputTab
            isRunning={isRunning}
            output={currentOutput}
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
      </div>
    </div>
  )
}

interface OutputTabProps {
  isRunning: boolean
  output: string
  record: ReturnType<typeof useRunStore.getState>['currentRecord']
  error: string | null
}

function OutputTab({ isRunning, output, record, error }: OutputTabProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(output)
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
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>运行提示词查看输出</p>
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
          {/* 详细 token 分解 */}
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
            'whitespace-pre-wrap font-mono text-sm'
          )}
        >
          {output}
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
    <div className="p-4 space-y-4">
      {/* Record Selection */}
      <div className="space-y-2">
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
        <div className="grid grid-cols-2 gap-4">
          {selectedRecords.map((record, index) => (
            <div key={record!.id} className="space-y-2">
              <div className="text-sm font-medium">
                Run {index + 1} •{' '}
                {new Date(record!.createdAt).toLocaleTimeString()}
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/30 text-sm font-mono whitespace-pre-wrap max-h-64 overflow-auto">
                {record!.outputText || '(empty)'}
              </div>
              <div className="text-xs text-muted-foreground">
                {record!.metrics.latencyMs}ms • {record!.metrics.totalTokens} tokens
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          从历史记录中选择 2 次运行来对比其输出
        </p>
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
            <pre className="p-4 rounded-lg bg-muted/30 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
              {record
                ? formatJSON(record.compiledRequestJson)
                : '运行请求查看编译后的 JSON'}
            </pre>
          )}

          {subTab === 'response' && (
            <pre className="p-4 rounded-lg bg-muted/30 text-sm font-mono whitespace-pre-wrap overflow-x-auto">
              {record?.responseJson
                ? formatJSON(record.responseJson)
                : record
                ? '(流式响应 - 无 JSON 主体)'
                : '运行请求查看响应'}
            </pre>
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
