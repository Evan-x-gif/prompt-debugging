import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { cn } from '@/lib/utils'

export function SettingsPanel() {
  const { config, params, setConfig, setParams } = useWorkspaceStore()
  const [showApiKey, setShowApiKey] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    connection: true,
    generation: true,
    advanced: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="p-4 space-y-4">
      {/* Connection Section */}
      <Section
        title="连接配置"
        expanded={expandedSections.connection}
        onToggle={() => toggleSection('connection')}
      >
        {/* Base URL */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">基础 URL</label>
          <input
            type="text"
            value={config.baseURL}
            onChange={(e) => setConfig({ baseURL: e.target.value })}
            className={cn(
              'w-full px-3 py-2 rounded-md text-sm',
              'bg-background border border-input',
              'focus:outline-none focus:ring-2 focus:ring-ring'
            )}
            placeholder="https://api.openai.com"
          />
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">API 密钥</label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => setConfig({ apiKey: e.target.value })}
              className={cn(
                'w-full px-3 py-2 pr-10 rounded-md text-sm',
                'bg-background border border-input',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
              placeholder="sk-..."
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
            >
              {showApiKey ? (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Eye className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
          {!config.useProxy && config.apiKey && (
            <div className="flex items-start gap-1.5 text-xs text-yellow-600 dark:text-yellow-500">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>浏览器直连会暴露 API Key，建议启用代理模式。</span>
            </div>
          )}
        </div>

        {/* Model ID */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">模型</label>
          <input
            type="text"
            value={config.modelId}
            onChange={(e) => setConfig({ modelId: e.target.value })}
            data-model-input
            className={cn(
              'w-full px-3 py-2 rounded-md text-sm',
              'bg-background border border-input',
              'focus:outline-none focus:ring-2 focus:ring-ring'
            )}
            placeholder="gpt-4o (⌘+K 快速聚焦)"
          />
        </div>

        {/* Endpoint Mode */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">API 端点</label>
          <div className="flex gap-2">
            <button
              onClick={() => setConfig({ endpointMode: 'responses' })}
              className={cn(
                'flex-1 px-3 py-2 rounded-md text-sm',
                'border transition-colors',
                config.endpointMode === 'responses'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent'
                  : 'border-input hover:bg-violet-50 dark:hover:bg-violet-900/20'
              )}
            >
              Responses
            </button>
            <button
              onClick={() => setConfig({ endpointMode: 'chat' })}
              className={cn(
                'flex-1 px-3 py-2 rounded-md text-sm',
                'border transition-colors',
                config.endpointMode === 'chat'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent'
                  : 'border-input hover:bg-violet-50 dark:hover:bg-violet-900/20'
              )}
            >
              Chat
            </button>
          </div>
        </div>

        {/* Use Proxy */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">启用代理</label>
          <button
            onClick={() => setConfig({ useProxy: !config.useProxy })}
            className={cn(
              'w-10 h-6 rounded-full transition-colors',
              config.useProxy ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span
              className={cn(
                'block w-4 h-4 rounded-full bg-white transition-transform',
                config.useProxy ? 'translate-x-5' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </Section>

      {/* Generation Parameters */}
      <Section
        title="生成参数"
        expanded={expandedSections.generation}
        onToggle={() => toggleSection('generation')}
      >
        {/* Temperature */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-sm font-medium">温度</label>
            <span className="text-sm text-muted-foreground">{params.temperature}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={params.temperature}
            onChange={(e) => setParams({ temperature: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Top P */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Top P</label>
            <span className="text-sm text-muted-foreground">{params.topP}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.topP}
            onChange={(e) => setParams({ topP: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Max Output Tokens */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">最大输出 Token</label>
          <input
            type="number"
            min="1"
            max="128000"
            value={params.maxOutputTokens}
            onChange={(e) => setParams({ maxOutputTokens: parseInt(e.target.value) || 4096 })}
            className={cn(
              'w-full px-3 py-2 rounded-md text-sm',
              'bg-background border border-input',
              'focus:outline-none focus:ring-2 focus:ring-ring'
            )}
          />
        </div>

        {/* Stream */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">流式输出</label>
          <button
            onClick={() => setParams({ stream: !params.stream })}
            className={cn(
              'w-10 h-6 rounded-full transition-colors',
              params.stream ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span
              className={cn(
                'block w-4 h-4 rounded-full bg-white transition-transform',
                params.stream ? 'translate-x-5' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </Section>

      {/* Advanced Parameters */}
      <Section
        title="高级参数"
        expanded={expandedSections.advanced}
        onToggle={() => toggleSection('advanced')}
      >
        {/* Seed */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">种子（可选）</label>
          <input
            type="number"
            value={params.seed ?? ''}
            onChange={(e) =>
              setParams({ seed: e.target.value ? parseInt(e.target.value) : null })
            }
            className={cn(
              'w-full px-3 py-2 rounded-md text-sm',
              'bg-background border border-input',
              'focus:outline-none focus:ring-2 focus:ring-ring'
            )}
            placeholder="随机"
          />
        </div>

        {/* Stop Sequences */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">停止序列</label>
          <input
            type="text"
            value={params.stop.join(', ')}
            onChange={(e) =>
              setParams({
                stop: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            className={cn(
              'w-full px-3 py-2 rounded-md text-sm',
              'bg-background border border-input',
              'focus:outline-none focus:ring-2 focus:ring-ring'
            )}
            placeholder="逗号分隔"
          />
        </div>

        {/* Presence Penalty (Chat Completions only) */}
        {config.endpointMode === 'chat' && (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-sm font-medium">存在惩罚</label>
              <span className="text-sm text-muted-foreground">{params.presencePenalty}</span>
            </div>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={params.presencePenalty}
              onChange={(e) => setParams({ presencePenalty: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        )}

        {/* Frequency Penalty (Chat Completions only) */}
        {config.endpointMode === 'chat' && (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-sm font-medium">频率惩罚</label>
              <span className="text-sm text-muted-foreground">{params.frequencyPenalty}</span>
            </div>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={params.frequencyPenalty}
              onChange={(e) => setParams({ frequencyPenalty: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        )}
      </Section>
    </div>
  )
}

interface SectionProps {
  title: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function Section({ title, expanded, onToggle, children }: SectionProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2',
          'bg-gradient-to-r from-violet-100/80 to-indigo-100/80 dark:from-violet-900/30 dark:to-indigo-900/30 hover:from-violet-200/80 hover:to-indigo-200/80 dark:hover:from-violet-800/40 dark:hover:to-indigo-800/40 transition-all'
        )}
      >
        <span className="text-sm font-medium">{title}</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {expanded && <div className="p-3 space-y-3">{children}</div>}
    </div>
  )
}
