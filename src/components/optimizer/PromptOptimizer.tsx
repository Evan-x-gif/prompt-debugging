import { useState, useMemo } from 'react'
import { Sparkles, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Lightbulb, Loader2, RotateCcw, ArrowRight } from 'lucide-react'
import { usePromptStore } from '@/stores/promptStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { cn } from '@/lib/utils'
import {
  DEFAULT_STRATEGIES,
  quickOptimize,
  optimizePrompt,
  type OptimizationStrategy,
  type OptimizationResult,
} from '@/lib/optimizer'

export function PromptOptimizer() {
  const { draft, setInstructionText, updateUserSegment } = usePromptStore()
  const { config, params } = useWorkspaceStore()
  
  const [expanded, setExpanded] = useState(false)
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
