import { AlertCircle, Info, Lightbulb } from 'lucide-react'
import { usePromptStore } from '@/stores/promptStore'
import { lintPrompt, type LintIssue } from '@/lib/validation'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

export function PromptLint() {
  const { draft } = usePromptStore()

  const issues = useMemo(() => lintPrompt(draft), [draft])

  if (issues.length === 0) {
    return null
  }

  const getIcon = (type: LintIssue['type']) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'suggestion':
        return <Lightbulb className="w-4 h-4 text-blue-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getBgColor = (type: LintIssue['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'suggestion':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
    }
  }

  return (
    <div className="px-4 pb-2">
      <div className="space-y-1.5">
        {issues.map((issue, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-2 px-3 py-2 rounded-lg border text-sm',
              getBgColor(issue.type)
            )}
          >
            <span className="mt-0.5 shrink-0">{getIcon(issue.type)}</span>
            <span className="text-foreground/80">{issue.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
