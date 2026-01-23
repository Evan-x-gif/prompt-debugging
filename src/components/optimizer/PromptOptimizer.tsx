import { useState, useMemo } from 'react'
import { Sparkles, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Lightbulb, Loader2, RotateCcw, ArrowRight, History, Clock, Trash2 } from 'lucide-react'
import { usePromptStore } from '@/stores/promptStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useOptimizerHistoryStore } from '@/stores/optimizerHistoryStore'
import { cn } from '@/lib/utils'
import { generateId } from '@/lib/utils'
import {
  DEFAULT_STRATEGIES,
  quickOptimize,
  optimizePrompt,
  type OptimizationStrategy,
  type OptimizationResult,
  type OptimizationHistory,
} from '@/lib/optimizer'

export function PromptOptimizer() {
  const { draft, setInstructionText, updateUserSegment } = usePromptStore()
  const { config, params } = useWorkspaceStore()
  const { history, addHistory, removeHistory, clearHistory } = useOptimizerHistoryStore()
  
  const [expanded, setExpanded] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [strategies, setStrategies] = useState<OptimizationStrategy[]>(DEFAULT_STRATEGIES)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [originalDraft, setOriginalDraft] = useState<typeof draft | null>(null)

  // 本地快速分析
  const quickAnalysis = useMemo(() => {
    return quickOptimize(draft, strategies)
  }, [draft, strategies])

  const toggleStrategy = (id: string) => {
    setStrategies(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    )
  }

  const handleOptimize = async () => {
    if (!config.modelId || !config.apiKey) {
      setError('请先配置模型和 API Key')
      return
    }

    setIsOptimizing(true)
    setError(null)
    setOriginalDraft({ ...draft })

    try {
      const optimizationResult = await optimizePrompt(draft, strategies, config, params)
      setResult(optimizationResult)

      // 保存到历史记录
      const userContent = draft.userSegments
        .filter(s => s.enabled)
        .map(s => s.text)
        .join('\n\n')

      const historyRecord: OptimizationHistory = {
        id: generateId(),
        timestamp: Date.now(),
        strategies: strategies.filter(s => s.enabled).map(s => s.name),
        original: {
          instructionText: draft.instructionText,
          userMessage: userContent,
        },
        optimized: {
          instructionText: optimizationResult.optimizedPrompt.instructionText,
          userMessage: optimizationResult.optimizedPrompt.userSegments[0]?.text || '',
        },
        diffSummary: optimizationResult.diffSummary,
        riskFlags: optimizationResult.riskFlags,
      }

      addHistory(historyRecord)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsOptimizing(false)
    }
  }

  const applyOptimization = () => {
    if (!result) return

    // 应用优化后的指令
    if (result.optimizedPrompt.instructionText) {
      setInstructionText(result.optimizedPrompt.instructionText)
    }

    // 应用优化后的用户消息（替换第一个启用的段落）
    if (result.optimizedPrompt.userSegments.length > 0) {
      const firstEnabledIndex = draft.userSegments.findIndex(s => s.enabled)
      if (firstEnabledIndex >= 0) {
        updateUserSegment(draft.userSegments[firstEnabledIndex].id, {
          text: result.optimizedPrompt.userSegments[0].text,
        })
      }
    }

    setResult(null)
  }

  const rollback = () => {
    if (!originalDraft) return

    setInstructionText(originalDraft.instructionText)
    originalDraft.userSegments.forEach(seg => {
      updateUserSegment(seg.id, { text: seg.text })
    })
    setOriginalDraft(null)
    setResult(null)
  }

  const applyHistoryRecord = (record: OptimizationHistory) => {
    // 应用历史记录中的优化结果
    setInstructionText(record.optimized.instructionText)
    
    const firstEnabledIndex = draft.userSegments.findIndex(s => s.enabled)
    if (firstEnabledIndex >= 0) {
      updateUserSegment(draft.userSegments[firstEnabledIndex].id, {
        text: record.optimized.userMessage,
      })
    }

    setShowHistory(false)
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins} 分钟前`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} 小时前`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} 天前`
    
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2',
          'bg-gradient-to-r from-purple-100/80 to-pink-100/80 dark:from-purple-900/30 dark:to-pink-900/30',
          'hover:from-purple-200/80 hover:to-pink-200/80 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 transition-all'
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium">Prompt 优化器</span>
          {quickAnalysis.suggestions.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-500 text-white">
              {quickAnalysis.suggestions.length} 建议
            </span>
          )}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-4">
          {/* 快速建议 */}
          {quickAnalysis.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                快速建议
              </h4>
              <div className="space-y-1.5">
                {quickAnalysis.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 px-2 py-1.5 rounded text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200"
                  >
                    <span className="mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 优化策略 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">优化策略</h4>
            <div className="grid grid-cols-2 gap-2">
              {strategies.map(strategy => (
                <button
                  key={strategy.id}
                  onClick={() => toggleStrategy(strategy.id)}
                  className={cn(
                    'p-2 rounded-lg border text-left transition-all',
                    strategy.enabled
                      ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-700'
                      : 'border-border hover:border-purple-200 dark:hover:border-purple-800'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full border-2 transition-colors',
                        strategy.enabled
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-300 dark:border-gray-600'
                      )}
                    />
                    <span className="text-xs font-medium">{strategy.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {strategy.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 优化按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || !strategies.some(s => s.enabled)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
                'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
                'hover:from-purple-700 hover:to-pink-700 transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  优化中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 优化
                </>
              )}
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                'px-4 py-2 rounded-lg border',
                showHistory
                  ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-700'
                  : 'border-border hover:bg-accent',
                'transition-colors relative'
              )}
              title="历史记录"
            >
              <History className="w-4 h-4" />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                  {history.length}
                </span>
              )}
            </button>
            {originalDraft && (
              <button
                onClick={rollback}
                className={cn(
                  'px-4 py-2 rounded-lg border border-border',
                  'hover:bg-accent transition-colors'
                )}
                title="回滚到优化前"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 历史记录列表 */}
          {showHistory && (
            <div className="space-y-2 p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-black/20">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <History className="w-4 h-4 text-purple-500" />
                  优化历史 ({history.length}/10)
                </h4>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    清空
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">暂无历史记录</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="p-2 rounded-lg border border-border hover:border-purple-300 dark:hover:border-purple-700 transition-colors cursor-pointer group"
                      onClick={() => applyHistoryRecord(record)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(record.timestamp)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {record.strategies.map((strategy, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 text-xs rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                              >
                                {strategy}
                              </span>
                            ))}
                          </div>
                          {record.diffSummary.length > 0 && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {record.diffSummary[0]}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeHistory(record.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                          title="删除"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 优化结果 */}
          {result && (
            <div className="space-y-3 p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-black/20">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                优化完成
              </h4>

              {/* 改动摘要 */}
              {result.diffSummary.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">改动摘要：</p>
                  <ul className="text-xs space-y-0.5">
                    {result.diffSummary.map((diff, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <ArrowRight className="w-3 h-3 mt-0.5 text-purple-500 shrink-0" />
                        <span>{diff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 风险提示 */}
              {result.riskFlags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-yellow-600">⚠️ 风险提示：</p>
                  <ul className="text-xs space-y-0.5 text-yellow-700 dark:text-yellow-400">
                    {result.riskFlags.map((risk, i) => (
                      <li key={i}>• {risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 测试建议 */}
              {result.testSuggestions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">测试建议：</p>
                  <ul className="text-xs space-y-0.5 text-muted-foreground">
                    {result.testSuggestions.map((test, i) => (
                      <li key={i}>• {test}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 预览优化后的指令 */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">优化后的系统指令：</p>
                <pre className="text-xs p-2 rounded bg-muted/50 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {result.optimizedPrompt.instructionText || '(无)'}
                </pre>
              </div>

              {result.optimizedPrompt.userSegments.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">优化后的用户消息：</p>
                  <pre className="text-xs p-2 rounded bg-muted/50 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {result.optimizedPrompt.userSegments[0].text || '(无)'}
                  </pre>
                </div>
              )}

              {/* 应用按钮 */}
              <button
                onClick={applyOptimization}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
                  'bg-gradient-to-r from-green-600 to-emerald-600 text-white',
                  'hover:from-green-700 hover:to-emerald-700 transition-all'
                )}
              >
                <CheckCircle className="w-4 h-4" />
                应用优化
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
