import { useState, useEffect, useRef } from 'react'
import { Radio, Trash2, Download, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SSEEvent {
  id: string
  timestamp: number
  type: 'data' | 'error' | 'done' | 'other'
  raw: string
  parsed?: object
}

interface SSEViewerProps {
  events: SSEEvent[]
  onClear?: () => void
}

// 判断事件是否包含推理内容
function hasReasoningContent(event: SSEEvent): boolean {
  if (!event.parsed) return false
  const parsed = event.parsed as any
  return parsed?.choices?.[0]?.delta?.reasoning_content !== undefined
}

// 判断事件是否包含实际输出内容
function hasOutputContent(event: SSEEvent): boolean {
  if (!event.parsed) return false
  const parsed = event.parsed as any
  const content = parsed?.choices?.[0]?.delta?.content
  return content !== undefined && content !== ''
}

// 获取事件的内容类型
function getEventContentType(event: SSEEvent): 'reasoning' | 'output' | 'metadata' | 'other' {
  if (event.type === 'done') return 'metadata'
  if (event.type === 'error') return 'other'
  if (!event.parsed) return 'other'
  
  const parsed = event.parsed as any
  if (parsed?.usage) return 'metadata'
  if (hasReasoningContent(event)) return 'reasoning'
  if (hasOutputContent(event)) return 'output'
  
  return 'other'
}

export function SSEViewer({ events, onClear }: SSEViewerProps) {
  const [filter, setFilter] = useState<'all' | 'data' | 'error'>('all')
  const [contentFilter, setContentFilter] = useState<'all' | 'output' | 'reasoning' | 'metadata'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [collapseReasoning, setCollapseReasoning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 统计各类事件数量
  const stats = {
    total: events.length,
    reasoning: events.filter(e => getEventContentType(e) === 'reasoning').length,
    output: events.filter(e => getEventContentType(e) === 'output').length,
    metadata: events.filter(e => getEventContentType(e) === 'metadata').length,
    error: events.filter(e => e.type === 'error').length,
  }

  const filteredEvents = events.filter(e => {
    // 基础类型过滤
    if (filter === 'data' && e.type !== 'data') return false
    if (filter === 'error' && e.type !== 'error') return false
    
    // 内容类型过滤
    if (contentFilter !== 'all') {
      const contentType = getEventContentType(e)
      if (contentFilter === 'output' && contentType !== 'output') return false
      if (contentFilter === 'reasoning' && contentType !== 'reasoning') return false
      if (contentFilter === 'metadata' && contentType !== 'metadata') return false
    }
    
    return true
  })

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [events, autoScroll])

  const exportEvents = () => {
    const data = JSON.stringify(events, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sse-events-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getEventColor = (event: SSEEvent) => {
    const contentType = getEventContentType(event)
    if (event.type === 'error') return 'border-l-red-500'
    if (event.type === 'done') return 'border-l-blue-500'
    if (contentType === 'reasoning') return 'border-l-purple-500'
    if (contentType === 'output') return 'border-l-green-500'
    if (contentType === 'metadata') return 'border-l-blue-500'
    return 'border-l-gray-500'
  }

  const getEventBadgeColor = (event: SSEEvent) => {
    const contentType = getEventContentType(event)
    if (event.type === 'error') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    if (event.type === 'done') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (contentType === 'reasoning') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    if (contentType === 'output') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (contentType === 'metadata') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }

  const getEventLabel = (event: SSEEvent) => {
    const contentType = getEventContentType(event)
    if (event.type === 'error') return 'ERROR'
    if (event.type === 'done') return 'DONE'
    if (contentType === 'reasoning') return 'REASONING'
    if (contentType === 'output') return 'OUTPUT'
    if (contentType === 'metadata') return 'METADATA'
    return event.type.toUpperCase()
  }

  if (events.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
        <Radio className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">暂无 SSE 事件</p>
        <p className="text-xs mt-1">运行流式请求后，事件将显示在这里</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex flex-col gap-2 px-3 py-2 border-b border-border shrink-0">
        {/* 第一行：标题和统计 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">SSE 事件流</span>
            <span className="px-1.5 py-0.5 text-xs rounded bg-muted">
              {stats.total} 事件
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* 导出 */}
            <button
              onClick={exportEvents}
              className="p-1 hover:bg-accent rounded"
              title="导出事件"
            >
              <Download className="w-4 h-4" />
            </button>
            {/* 清空 */}
            {onClear && (
              <button
                onClick={onClear}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                title="清空事件"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        </div>

        {/* 第二行：统计信息 */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">分类统计:</span>
          <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
            推理 {stats.reasoning}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            输出 {stats.output}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            元数据 {stats.metadata}
          </span>
          {stats.error > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              错误 {stats.error}
            </span>
          )}
        </div>

        {/* 第三行：过滤器和选项 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            {/* 内容类型过滤 */}
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <select
                value={contentFilter}
                onChange={e => setContentFilter(e.target.value as any)}
                className="px-1.5 py-0.5 rounded border border-input bg-background text-xs"
              >
                <option value="all">全部内容</option>
                <option value="output">仅输出</option>
                <option value="reasoning">仅推理</option>
                <option value="metadata">仅元数据</option>
              </select>
            </div>
            {/* 基础类型过滤 */}
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="px-1.5 py-0.5 rounded border border-input bg-background text-xs"
            >
              <option value="all">全部类型</option>
              <option value="data">数据</option>
              <option value="error">错误</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {/* 折叠推理内容 */}
            {stats.reasoning > 0 && (
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={collapseReasoning}
                  onChange={e => setCollapseReasoning(e.target.checked)}
                  className="rounded"
                />
                折叠推理
              </label>
            )}
            {/* 自动滚动 */}
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={e => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              自动滚动
            </label>
          </div>
        </div>
      </div>

      {/* 事件列表 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs"
      >
        {filteredEvents.map(event => {
          const contentType = getEventContentType(event)
          const isReasoning = contentType === 'reasoning'
          const shouldCollapse = isReasoning && collapseReasoning

          return (
            <div
              key={event.id}
              className={cn(
                'rounded border-l-2 bg-muted/30',
                getEventColor(event),
                shouldCollapse ? 'p-1' : 'p-2'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('px-1 py-0.5 rounded text-[10px]', getEventBadgeColor(event))}>
                  {getEventLabel(event)}
                </span>
                <span className="text-muted-foreground">
                  {new Date(event.timestamp).toLocaleTimeString('zh-CN', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}.{String(event.timestamp % 1000).padStart(3, '0')}
                </span>
                {isReasoning && (
                  <span className="text-[10px] text-purple-600 dark:text-purple-400">
                    思考过程
                  </span>
                )}
              </div>
              {!shouldCollapse && (
                <pre className="whitespace-pre-wrap break-all text-[11px] leading-relaxed">
                  {event.parsed ? JSON.stringify(event.parsed, null, 2) : event.raw}
                </pre>
              )}
              {shouldCollapse && (
                <div className="text-[10px] text-muted-foreground italic">
                  已折叠推理内容
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// SSE 事件解析工具
export function parseSSELine(line: string): SSEEvent | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const event: SSEEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    type: 'other',
    raw: trimmed,
  }

  if (trimmed.startsWith('data: ')) {
    const data = trimmed.slice(6)
    event.type = 'data'
    
    if (data === '[DONE]') {
      event.type = 'done'
    } else {
      try {
        event.parsed = JSON.parse(data)
      } catch {
        // 保持原始字符串
      }
    }
  } else if (trimmed.startsWith('error:') || trimmed.includes('"error"')) {
    event.type = 'error'
    try {
      event.parsed = JSON.parse(trimmed)
    } catch {
      // 保持原始字符串
    }
  }

  return event
}
