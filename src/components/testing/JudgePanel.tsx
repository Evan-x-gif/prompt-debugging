import { useState } from 'react'
import { Award, ChevronDown, ChevronRight, Loader2, Star } from 'lucide-react'
import { useRunStore } from '@/stores/runStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { usePromptStore } from '@/stores/promptStore'
import { cn } from '@/lib/utils'
import { DEFAULT_RUBRICS, judgeOutput, quickEvaluate } from '@/lib/judge'
import type { ScoringRubric, ScoreResult } from '@/types/testcase'

export function JudgePanel() {
  const { currentOutput } = useRunStore()
  const { config } = useWorkspaceStore()
  const { draft } = usePromptStore()
  
  const [expanded, setExpanded] = useState(false)
  const [selectedRubric, setSelectedRubric] = useState<ScoringRubric>(DEFAULT_RUBRICS[0])
  const [isJudging, setIsJudging] = useState(false)
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 快速本地评估
  const quickResult = currentOutput ? quickEvaluate(currentOutput) : null

  const handleJudge = async () => {
    if (!currentOutput || !config.modelId || !config.apiKey) {
      setError('请先运行 prompt 并配置 API')
      return
    }

    setIsJudging(true)
    setError(null)

    // 构建 prompt 文本
    const promptText = [
      draft.instructionText,
      ...draft.userSegments.filter(s => s.enabled).map(s => s.text),
    ].filter(Boolean).join('\n\n')

    try {
      const scoreResult = await judgeOutput(
        selectedRubric,
        promptText,
        currentOutput,
        config
      )
      setResult(scoreResult)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsJudging(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400'
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 4) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-100 dark:bg-green-900/30'
    if (score >= 6) return 'bg-yellow-100 dark:bg-yellow-900/30'
    if (score >= 4) return 'bg-orange-100 dark:bg-orange-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2',
          'bg-gradient-to-r from-amber-100/80 to-yellow-100/80 dark:from-amber-900/30 dark:to-yellow-900/30',
          'hover:from-amber-200/80 hover:to-yellow-200/80 dark:hover:from-amber-800/40 dark:hover:to-yellow-800/40 transition-all'
        )}
      >
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium">LLM 评分</span>
          {result && (
            <span className={cn(
              'px-1.5 py-0.5 text-xs rounded font-medium',
              getScoreBg(result.totalScore),
              getScoreColor(result.totalScore)
            )}>
              {result.totalScore.toFixed(1)}
            </span>
          )}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* 快速评估 */}
          {quickResult && (
            <div className="p-2 rounded-lg bg-muted/50 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">快速评估</p>
              {quickResult.issues.length > 0 ? (
                <ul className="text-xs space-y-0.5">
                  {quickResult.issues.map((issue, i) => (
                    <li key={i} className="text-yellow-600 dark:text-yellow-400">⚠️ {issue}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-green-600 dark:text-green-400">✓ 未发现明显问题</p>
              )}
            </div>
          )}

          {/* 评分标准选择 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">评分标准</label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_RUBRICS.map(rubric => (
                <button
                  key={rubric.id}
                  onClick={() => setSelectedRubric(rubric)}
                  className={cn(
                    'px-2 py-1 text-xs rounded-full border transition-colors',
                    selectedRubric.id === rubric.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : 'border-input hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  )}
                >
                  {rubric.name}
                </button>
              ))}
            </div>
          </div>

          {/* 当前标准详情 */}
          <div className="p-2 rounded-lg border border-border text-xs space-y-1">
            <p className="font-medium">{selectedRubric.name}</p>
            <div className="space-y-0.5 text-muted-foreground">
              {selectedRubric.criteria.map(c => (
                <div key={c.name} className="flex justify-between">
                  <span>{c.name}</span>
                  <span>{(c.weight * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 评分按钮 */}
          <button
            onClick={handleJudge}
            disabled={isJudging || !currentOutput}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
              'bg-gradient-to-r from-amber-600 to-yellow-600 text-white',
              'hover:from-amber-700 hover:to-yellow-700 transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isJudging ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                评分中...
              </>
            ) : (
              <>
                <Star className="w-4 h-4" />
                AI 评分
              </>
            )}
          </button>

          {/* 错误提示 */}
          {error && (
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* 评分结果 */}
          {result && (
            <div className="space-y-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-white/50 dark:bg-black/20">
              {/* 总分 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">总分</span>
                <div className={cn(
                  'px-3 py-1 rounded-full text-lg font-bold',
                  getScoreBg(result.totalScore),
                  getScoreColor(result.totalScore)
                )}>
                  {result.totalScore.toFixed(1)} / 10
                </div>
              </div>

              {/* 分项得分 */}
              <div className="space-y-2">
                {result.scores.map((score, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{score.criteriaName}</span>
                      <span className={cn('font-medium', getScoreColor(score.score))}>
                        {score.score}/10
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          score.score >= 8 ? 'bg-green-500' :
                          score.score >= 6 ? 'bg-yellow-500' :
                          score.score >= 4 ? 'bg-orange-500' : 'bg-red-500'
                        )}
                        style={{ width: `${score.score * 10}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{score.reason}</p>
                  </div>
                ))}
              </div>

              {/* 总体反馈 */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">总体反馈</p>
                <p className="text-sm">{result.feedback}</p>
              </div>
            </div>
          )}

          {!currentOutput && (
            <p className="text-xs text-muted-foreground text-center py-2">
              请先运行 prompt 获取输出后再进行评分
            </p>
          )}
        </div>
      )}
    </div>
  )
}
