import { useState } from 'react'
import { Plus, Trash2, Play, ChevronDown, ChevronRight, FlaskConical, Edit2, Grid3X3 } from 'lucide-react'
import { MatrixRunner } from './MatrixRunner'
import { useTestStore } from '@/stores/testStore'
import { usePromptStore } from '@/stores/promptStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { executeRequest } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { TestCase } from '@/types/testcase'

export function TestCasePanel() {
  const { testCases, addTestCase, updateTestCase, removeTestCase, addTestRun, getRunsForTestCase } = useTestStore()
  const { draft } = usePromptStore()
  const { config, params } = useWorkspaceStore()
  
  const [expanded, setExpanded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCase, setNewCase] = useState({ name: '', description: '', variables: '' })
  const [runningId, setRunningId] = useState<string | null>(null)
  const [showMatrix, setShowMatrix] = useState(false)

  const handleAddTestCase = () => {
    if (!newCase.name.trim()) return
    
    let variables: Record<string, string> = {}
    try {
      if (newCase.variables.trim()) {
        variables = JSON.parse(newCase.variables)
      }
    } catch {
      // 尝试解析为 key=value 格式
      newCase.variables.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          variables[key.trim()] = valueParts.join('=').trim()
        }
      })
    }

    addTestCase({
      name: newCase.name,
      description: newCase.description,
      variables,
      tags: [],
    })
    setNewCase({ name: '', description: '', variables: '' })
  }

  const handleRunTestCase = async (testCase: TestCase) => {
    if (!config.modelId || !config.apiKey) return
    
    setRunningId(testCase.id)
    
    // 合并变量
    const mergedDraft = {
      ...draft,
      variables: { ...draft.variables, ...testCase.variables },
    }
    
    try {
      const controller = new AbortController()
      const record = await executeRequest(
        mergedDraft,
        params,
        config,
        controller.signal
      )
      
      addTestRun({
        testCaseId: testCase.id,
        modelId: config.modelId,
        temperature: params.temperature,
        outputText: record.outputText,
        metrics: {
          latencyMs: record.metrics.latencyMs,
          totalTokens: record.metrics.totalTokens,
          finishReason: record.metrics.finishReason,
        },
      })
    } catch (e) {
      console.error('Test run failed:', e)
    } finally {
      setRunningId(null)
    }
  }

  const handleRunAll = async () => {
    for (const testCase of testCases) {
      await handleRunTestCase(testCase)
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2',
          'bg-gradient-to-r from-emerald-100/80 to-teal-100/80 dark:from-emerald-900/30 dark:to-teal-900/30',
          'hover:from-emerald-200/80 hover:to-teal-200/80 dark:hover:from-emerald-800/40 dark:hover:to-teal-800/40 transition-all'
        )}
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium">测试集</span>
          {testCases.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-emerald-500 text-white">
              {testCases.length}
            </span>
          )}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* 添加测试用例 */}
          <div className="space-y-2 p-2 rounded-lg border border-dashed border-border">
            <input
              type="text"
              value={newCase.name}
              onChange={(e) => setNewCase({ ...newCase, name: e.target.value })}
              placeholder="测试用例名称"
              className={cn(
                'w-full px-2 py-1.5 rounded text-sm',
                'bg-background border border-input',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            />
            <input
              type="text"
              value={newCase.description}
              onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
              placeholder="描述（可选）"
              className={cn(
                'w-full px-2 py-1.5 rounded text-sm',
                'bg-background border border-input',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            />
            <textarea
              value={newCase.variables}
              onChange={(e) => setNewCase({ ...newCase, variables: e.target.value })}
              placeholder="变量（JSON 或 key=value 格式，每行一个）"
              rows={2}
              className={cn(
                'w-full px-2 py-1.5 rounded text-sm font-mono',
                'bg-background border border-input',
                'focus:outline-none focus:ring-2 focus:ring-ring resize-y'
              )}
            />
            <button
              onClick={handleAddTestCase}
              disabled={!newCase.name.trim()}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-sm',
                'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
                'hover:from-emerald-700 hover:to-teal-700 transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Plus className="w-4 h-4" />
              添加测试用例
            </button>
          </div>

          {/* 测试用例列表 */}
          {testCases.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {testCases.length} 个测试用例
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMatrix(true)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-xs',
                      'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
                      'hover:bg-indigo-200 dark:hover:bg-indigo-800/40 transition-colors'
                    )}
                  >
                    <Grid3X3 className="w-3 h-3" />
                    矩阵跑分
                  </button>
                  <button
                    onClick={handleRunAll}
                    disabled={runningId !== null}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-xs',
                      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
                      'hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors',
                      'disabled:opacity-50'
                    )}
                  >
                    <Play className="w-3 h-3" />
                    运行全部
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {testCases.map((testCase) => {
                  const runs = getRunsForTestCase(testCase.id)
                  const lastRun = runs[runs.length - 1]
                  const isEditing = editingId === testCase.id
                  const isRunning = runningId === testCase.id

                  return (
                    <div
                      key={testCase.id}
                      className={cn(
                        'p-2 rounded-lg border transition-colors',
                        isRunning ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-border'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              type="text"
                              defaultValue={testCase.name}
                              onBlur={(e) => {
                                updateTestCase(testCase.id, { name: e.target.value })
                                setEditingId(null)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateTestCase(testCase.id, { name: e.currentTarget.value })
                                  setEditingId(null)
                                }
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                              autoFocus
                              className={cn(
                                'w-full px-1 py-0.5 rounded text-sm font-medium',
                                'bg-background border border-input',
                                'focus:outline-none focus:ring-2 focus:ring-ring'
                              )}
                            />
                          ) : (
                            <p className="text-sm font-medium truncate">{testCase.name}</p>
                          )}
                          {testCase.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {testCase.description}
                            </p>
                          )}
                          {Object.keys(testCase.variables).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(testCase.variables).slice(0, 3).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="px-1.5 py-0.5 text-xs rounded bg-muted font-mono"
                                  title={`${key}=${value}`}
                                >
                                  {key}
                                </span>
                              ))}
                              {Object.keys(testCase.variables).length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{Object.keys(testCase.variables).length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          {lastRun && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{lastRun.metrics.latencyMs}ms</span>
                              <span>{lastRun.metrics.totalTokens} tokens</span>
                              {lastRun.score !== undefined && (
                                <span className="text-emerald-600">得分: {lastRun.score}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleRunTestCase(testCase)}
                            disabled={isRunning || !config.modelId}
                            className={cn(
                              'p-1 rounded hover:bg-accent transition-colors',
                              'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                            title="运行"
                          >
                            {isRunning ? (
                              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Play className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingId(testCase.id)}
                            className="p-1 rounded hover:bg-accent transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeTestCase(testCase.id)}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {testCases.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              暂无测试用例。添加测试用例可批量验证 prompt 效果。
            </p>
          )}
        </div>
      )}

      {/* 矩阵跑分弹窗 */}
      {showMatrix && <MatrixRunner onClose={() => setShowMatrix(false)} />}
    </div>
  )
}
