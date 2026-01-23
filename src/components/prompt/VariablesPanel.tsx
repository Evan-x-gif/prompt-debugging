import { useState } from 'react'
import { Plus, Trash2, Variable, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { usePromptStore } from '@/stores/promptStore'
import { cn } from '@/lib/utils'

export function VariablesPanel() {
  const { draft, setVariable, removeVariable } = usePromptStore()
  
  const [expanded, setExpanded] = useState(true)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const variables = Object.entries(draft.variables)

  const handleAddVariable = () => {
    if (!newKey.trim()) return
    setVariable(newKey.trim(), newValue)
    setNewKey('')
    setNewValue('')
  }

  const handleCopyPlaceholder = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newKey.trim()) {
      handleAddVariable()
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
          <Variable className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium">变量管理</span>
          {variables.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-emerald-500 text-white">
              {variables.length}
            </span>
          )}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-3 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-emerald-900/10 dark:to-teal-900/10">
          {/* 使用说明 */}
          <p className="text-xs text-muted-foreground">
            在 Prompt 中使用 <code className="px-1 py-0.5 rounded bg-muted">{'{{变量名}}'}</code> 语法引用变量
          </p>

          {/* 变量列表 */}
          {variables.length > 0 && (
            <div className="space-y-2">
              {variables.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start gap-2 p-2 rounded-lg border border-border bg-background"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        {key}
                      </span>
                      <button
                        onClick={() => handleCopyPlaceholder(key)}
                        className="p-1 rounded hover:bg-muted transition-colors"
                        title="复制占位符"
                      >
                        {copiedKey === key ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setVariable(key, e.target.value)}
                      className={cn(
                        'w-full px-2 py-1 rounded text-sm',
                        'bg-muted/50 border border-transparent',
                        'focus:outline-none focus:border-emerald-500'
                      )}
                      placeholder="变量值"
                    />
                  </div>
                  <button
                    onClick={() => removeVariable(key)}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"
                    title="删除变量"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 添加新变量 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="变量名"
              className={cn(
                'flex-1 px-3 py-2 rounded-md text-sm',
                'bg-background border border-input',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500'
              )}
            />
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="默认值"
              className={cn(
                'flex-1 px-3 py-2 rounded-md text-sm',
                'bg-background border border-input',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500'
              )}
            />
            <button
              onClick={handleAddVariable}
              disabled={!newKey.trim()}
              className={cn(
                'px-3 py-2 rounded-md',
                'bg-emerald-600 text-white',
                'hover:bg-emerald-700 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="添加变量"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* 空状态 */}
          {variables.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              暂无变量，添加变量后可在 Prompt 中使用 {'{{变量名}}'} 引用
            </p>
          )}
        </div>
      )}
    </div>
  )
}
