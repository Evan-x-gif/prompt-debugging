import { useState } from 'react'
import { Play, Plus, X, Loader2, Grid3X3 } from 'lucide-react'
import { useTestStore } from '@/stores/testStore'
import { usePromptStore } from '@/stores/promptStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { executeRequest } from '@/lib/api'
import { calculateCost, formatCost } from '@/lib/pricing'
import { cn } from '@/lib/utils'

interface MatrixRunnerProps {
  onClose: () => void
}

export function MatrixRunner({ onClose }: MatrixRunnerProps) {
  const { testCases, addTestRun } = useTestStore()
  const { draft } = usePromptStore()
  const { config, params } = useWorkspaceStore()

  const [models, setModels] = useState<string[]>([config.modelId])
  const [temperatures, setTemperatures] = useState<number[]>([params.temperature])
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>(
    testCases.slice(0, 3).map(tc => tc.id)
  )
  const [newModel, setNewModel] = useState('')
  const [newTemp, setNewTemp] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<{
    modelId: string
    temperature: number
    testCaseId: string
    testCaseName: string
    output: string
    latencyMs: number
    totalTokens: number
    cost: number
    error?: string
  }[]>([])

  const addModel = () => {
    if (newModel.trim() && !models.includes(newModel.trim())) {
      setModels([...models, newModel.trim()])
      setNewModel('')
    }
  }

  const addTemperature = () => {
    const temp = parseFloat(newTemp)
    if (!isNaN(temp) && temp >= 0 && temp <= 2 && !temperatures.includes(temp)) {
      setTemperatures([...temperatures, temp])
      setNewTemp('')
    }
  }

  const runMatrix = async () => {
    if (!config.apiKey) return

    const total = models.length * temperatures.length * selectedTestCases.length
    setProgress({ current: 0, total })
    setIsRunning(true)
    setResults([])

    const newResults: typeof results = []

    for (const modelId of models) {
      for (const temperature of temperatures) {
        for (const testCaseId of selectedTestCases) {
          const testCase = testCases.find(tc => tc.id === testCaseId)
          if (!testCase) continue

          const mergedDraft = {
            ...draft,
            variables: { ...draft.variables, ...testCase.variables },
          }

          const testConfig = { ...config, modelId }
          const testParams = { ...params, temperature }

          try {
            const controller = new AbortController()
            const record = await executeRequest(
              mergedDraft,
              testParams,
              testConfig,
              controller.signal
            )

            const cost = calculateCost(
              modelId,
              record.metrics.promptTokens,
              record.metrics.completionTokens,
              record.metrics.cachedTokens
            )

            const result = {
              modelId,
              temperature,
              testCaseId,
              testCaseName: testCase.name,
              output: record.outputText.slice(0, 200) + (record.outputText.length > 200 ? '...' : ''),
              latencyMs: record.metrics.latencyMs,
              totalTokens: record.metrics.totalTokens,
              cost: cost.totalCost,
            }

            newResults.push(result)
            setResults([...newResults])

            addTestRun({
              testCaseId,
              modelId,
              temperature,
              outputText: record.outputText,
              metrics: {
                latencyMs: record.metrics.latencyMs,
                totalTokens: record.metrics.totalTokens,
                finishReason: record.metrics.finishReason,
              },
            })
          } catch (e) {
            newResults.push({
              modelId,
              temperature,
              testCaseId,
              testCaseName: testCase.name,
              output: '',
              latencyMs: 0,
              totalTokens: 0,
              cost: 0,
              error: (e as Error).message,
            })
            setResults([...newResults])
          }

          setProgress(prev => ({ ...prev, current: prev.current + 1 }))
        }
      }
    }

    setIsRunning(false)
  }

  const totalRuns = models.length * temperatures.length * selectedTestCases.length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-indigo-100/80 to-purple-100/80 dark:from-indigo-900/30 dark:to-purple-900/30">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold">矩阵跑分</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 模型配置 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">模型列表</label>
            <div className="flex flex-wrap gap-2">
              {models.map(model => (
                <span
                  key={model}
                  className="flex items-center gap-1 px-2 py-1 text-sm rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                >
                  {model}
                  {models.length > 1 && (
                    <button
                      onClick={() => setModels(models.filter(m => m !== model))}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newModel}
                onChange={e => setNewModel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addModel()}
                placeholder="添加模型 ID"
                className={cn(
                  'flex-1 px-3 py-1.5 rounded text-sm',
                  'bg-background border border-input',
                  'focus:outline-none focus:ring-2 focus:ring-ring'
                )}
              />
              <button
                onClick={addModel}
                className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 温度配置 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">温度列表</label>
            <div className="flex flex-wrap gap-2">
              {temperatures.map(temp => (
                <span
                  key={temp}
                  className="flex items-center gap-1 px-2 py-1 text-sm rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                >
                  {temp}
                  {temperatures.length > 1 && (
                    <button
                      onClick={() => setTemperatures(temperatures.filter(t => t !== temp))}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={newTemp}
                onChange={e => setNewTemp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTemperature()}
                placeholder="添加温度 (0-2)"
                className={cn(
                  'flex-1 px-3 py-1.5 rounded text-sm',
                  'bg-background border border-input',
                  'focus:outline-none focus:ring-2 focus:ring-ring'
                )}
              />
              <button
                onClick={addTemperature}
                className="px-3 py-1.5 rounded bg-orange-600 text-white text-sm hover:bg-orange-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 测试用例选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">测试用例 ({selectedTestCases.length} 已选)</label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {testCases.map(tc => (
                <label
                  key={tc.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors',
                    selectedTestCases.includes(tc.id)
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-border hover:border-emerald-300'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedTestCases.includes(tc.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedTestCases([...selectedTestCases, tc.id])
                      } else {
                        setSelectedTestCases(selectedTestCases.filter(id => id !== tc.id))
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm truncate">{tc.name}</span>
                </label>
              ))}
            </div>
            {testCases.length === 0 && (
              <p className="text-xs text-muted-foreground">请先在测试集面板添加测试用例</p>
            )}
          </div>

          {/* 运行统计 */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p>
              将运行 <strong>{totalRuns}</strong> 次测试
              （{models.length} 模型 × {temperatures.length} 温度 × {selectedTestCases.length} 用例）
            </p>
          </div>

          {/* 进度条 */}
          {isRunning && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>进度</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* 结果表格 */}
          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">运行结果</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2">模型</th>
                      <th className="text-left py-2 px-2">温度</th>
                      <th className="text-left py-2 px-2">用例</th>
                      <th className="text-right py-2 px-2">延迟</th>
                      <th className="text-right py-2 px-2">Tokens</th>
                      <th className="text-right py-2 px-2">成本</th>
                      <th className="text-left py-2 px-2">输出预览</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2 font-mono">{r.modelId.split('/').pop()}</td>
                        <td className="py-2 px-2">{r.temperature}</td>
                        <td className="py-2 px-2">{r.testCaseName}</td>
                        <td className="py-2 px-2 text-right">{r.latencyMs}ms</td>
                        <td className="py-2 px-2 text-right">{r.totalTokens}</td>
                        <td className="py-2 px-2 text-right text-amber-600">{formatCost(r.cost)}</td>
                        <td className="py-2 px-2 max-w-xs truncate">
                          {r.error ? (
                            <span className="text-red-500">{r.error}</span>
                          ) : (
                            r.output
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-sm"
          >
            关闭
          </button>
          <button
            onClick={runMatrix}
            disabled={isRunning || totalRuns === 0 || !config.apiKey}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white',
              'bg-gradient-to-r from-indigo-600 to-purple-600',
              'hover:from-indigo-700 hover:to-purple-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                运行中...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                开始跑分
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
