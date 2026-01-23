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

export function SSEViewer({ events, onClear }: SSEViewerProps) {
  const [filter, setFilter] = useState<'all' | 'data' | 'error'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true
    if (filter === 'data') return e.type === 'data'
    if (filter === 'error') return e.type === 'error'
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

  const getEventColor = (type: SSEEvent['type']) => {
    switch (type) {
      case 'data': return 'border-l-green-500'
      case 'error': return 'border-l-red-500'
      case 'done': return 'border-l-blue-500'
      default: return 'border-l-gray-500'
    }
  }

  const getEventBadgeColor = (type: SSEEvent['type']) => {
    switch (type) {
      case 'data': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'done': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">SSE 事件流</span>
          <span className="px-1.5 py-0.5 text-xs rounded bg-muted">
            {events.length} 事件
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 过滤器 */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3 h-3" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="px-1.5 py-0.5 rounded border border-input bg-background text-xs"
            >
              <option value="all">全部</option>
              <option value="data">数据</option>
              <option value="error">错误</option>
            </select>
          </div>
          {/* 自动滚动 */}
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            自动滚动
          </label>
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

      {/* 事件列表 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs"
      >
        {filteredEvents.map(event => (
          <div
            key={event.id}
            className={cn(
              'p-2 rounded border-l-2 bg-muted/30',
              getEventColor(event.type)
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('px-1 py-0.5 rounded text-[10px]', getEventBadgeColor(event.type))}>
                {event.type.toUpperCase()}
              </span>
              <span className="text-muted-foreground">
                {new Date(event.timestamp).toLocaleTimeString('zh-CN', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}.{String(event.timestamp % 1000).padStart(3, '0')}
              </span>
            </div>
            <pre className="whitespace-pre-wrap break-all text-[11px] leading-relaxed">
              {event.parsed ? JSON.stringify(event.parsed, null, 2) : event.raw}
            </pre>
          </div>
        ))}
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
