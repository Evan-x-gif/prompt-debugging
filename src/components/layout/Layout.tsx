import { useEffect } from 'react'
import { Play, History, GitCompare, Moon, Sun, Loader2 } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { usePromptStore } from '@/stores/promptStore'
import { useHistoryStore } from '@/stores/historyStore'
import { useRunStore } from '@/stores/runStore'
import { executeRequest } from '@/lib/api'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { config, params } = useWorkspaceStore()
  const { draft } = usePromptStore()
  const { loadRecords, addRecord } = useHistoryStore()
  const { isRunning, setRunning, setCurrentOutput, appendOutput, setAbortController, setError, setCurrentRecord, reset, abort } = useRunStore()

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const handleRun = async () => {
    if (isRunning) return

    reset()
    setRunning(true)
    const controller = new AbortController()
    setAbortController(controller)

    try {
      const record = await executeRequest(
        draft,
        params,
        config,
        controller.signal,
        {
          onChunk: (chunk) => appendOutput(chunk),
          onDone: (fullText) => setCurrentOutput(fullText),
          onError: (error) => setError(error.message),
        }
      )
      setCurrentRecord(record)
      await addRecord(record)
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setRunning(false)
      setAbortController(null)
    }
  }

  const handleStop = () => {
    abort()
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 shrink-0 backdrop-blur-xl bg-white/60 dark:bg-black/40">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Prompt 调试器</h1>
          <span className="text-sm text-muted-foreground">
            {config.modelId || '未选择模型'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Run/Stop Button */}
          {isRunning ? (
            <button
              onClick={handleStop}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md',
                'bg-gradient-to-r from-red-500 to-orange-500 text-white',
                'hover:from-red-600 hover:to-orange-600 transition-all shadow-lg'
              )}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              停止
            </button>
          ) : (
            <button
              onClick={handleRun}
              disabled={!config.modelId}
              data-run-button
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md',
                'bg-gradient-to-r from-violet-600 to-indigo-600 text-white',
                'hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="运行 (⌘+Enter)"
            >
              <Play className="w-4 h-4" />
              运行
            </button>
          )}

          {/* History Button */}
          <button
            className={cn(
              'p-2 rounded-md',
              'hover:bg-accent transition-colors'
            )}
            title="历史记录"
          >
            <History className="w-5 h-5" />
          </button>

          {/* Compare Button */}
          <button
            className={cn(
              'p-2 rounded-md',
              'hover:bg-accent transition-colors'
            )}
            title="对比"
          >
            <GitCompare className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => document.documentElement.classList.toggle('dark')}
            className={cn(
              'p-2 rounded-md',
              'hover:bg-accent transition-colors'
            )}
            title="切换主题"
          >
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 dark:hidden" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
