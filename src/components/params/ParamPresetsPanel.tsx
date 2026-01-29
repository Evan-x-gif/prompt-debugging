import { useState } from 'react'
import { ChevronDown, ChevronRight, Sparkles, Check } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { getAllPresets, type PresetType } from '@/lib/paramPresets'
import { cn } from '@/lib/utils'

export function ParamPresetsPanel() {
  const [expanded, setExpanded] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<PresetType | null>(null)
  const { setParams } = useWorkspaceStore()
  const presets = getAllPresets()

  const handleApplyPreset = (presetType: PresetType) => {
    const preset = presets.find((p) => p.type === presetType)
    if (preset) {
      setParams(preset.params)
      setSelectedPreset(presetType)
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2',
          'bg-gradient-to-r from-violet-100/80 to-indigo-100/80 dark:from-violet-900/30 dark:to-indigo-900/30',
          'hover:from-violet-200/80 hover:to-indigo-200/80 dark:hover:from-violet-800/40 dark:hover:to-indigo-800/40',
          'transition-all'
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <span className="text-sm font-medium">参数预设</span>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {expanded && (
        <div className="p-3 space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            快速应用针对不同场景优化的参数配置
          </p>
          
          <div className="grid grid-cols-1 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.type}
                onClick={() => handleApplyPreset(preset.type)}
                className={cn(
                  'relative flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
                  'group',
                  selectedPreset === preset.type
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-sm'
                    : 'border-border bg-background hover:bg-accent'
                )}
              >
                <div className="relative">
                  <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                    {preset.icon}
                  </span>
                  {selectedPreset === preset.type && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-0.5">{preset.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {preset.description}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                      T: {preset.params.temperature}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      Top-P: {preset.params.topP}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                      Max: {preset.params.maxOutputTokens}
                    </span>
                    {preset.params.reasoningEffort && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        推理: {preset.params.reasoningEffort}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>注意：</strong>聚合 API 可能不支持部分高级参数（如 presence_penalty、frequency_penalty、logprobs、truncation、store 等）。应用预设后，这些参数会被设置为默认值（通常为 0 或 false），避免 API 报错。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
