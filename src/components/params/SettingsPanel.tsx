import { useState } from 'react'
import { ChevronDown, ChevronRight, AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { cn } from '@/lib/utils'
import { StructuredOutputPanel } from './StructuredOutputPanel'
import { ToolsPanel } from './ToolsPanel'
import { ParamPresetsPanel } from './ParamPresetsPanel'

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
      {/* Param Presets Panel */}
      <ParamPresetsPanel />

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
            placeholder="https://api.qnaigc.com"
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
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">模型</label>
            <a
              href="https://s.qiniu.com/JB3ieq"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              <span>获取模型列表</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
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

        {/* N - 生成多个候选 (Chat Completions only) */}
        {config.endpointMode === 'chat' && (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-sm font-medium">候选数量 (n)</label>
              <span className="text-sm text-muted-foreground">{params.n}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={params.n}
              onChange={(e) => setParams({ n: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">生成多个候选会增加成本</p>
          </div>
        )}

        {/* Logprobs (Chat Completions only) */}
        {config.endpointMode === 'chat' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">输出 Token 概率</label>
                <p className="text-xs text-muted-foreground">仅 OpenAI/Anthropic 官方模型支持</p>
              </div>
              <button
                onClick={() => setParams({ logprobs: !params.logprobs })}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors',
                  params.logprobs ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'block w-4 h-4 rounded-full bg-white transition-transform',
                    params.logprobs ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
            {params.logprobs && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Top Logprobs 数量</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={params.topLogprobs ?? 5}
                    onChange={(e) => setParams({ topLogprobs: parseInt(e.target.value) || null })}
                    className={cn(
                      'w-full px-3 py-1.5 rounded-md text-sm',
                      'bg-background border border-input',
                      'focus:outline-none focus:ring-2 focus:ring-ring'
                    )}
                  />
                </div>
                <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                  <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    <strong>注意：</strong>聚合 API 可能不支持此参数，使用前请确认。
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Truncation (Responses API only) */}
        {config.endpointMode === 'responses' && (
          <div className="space-y-1.5">
            <div>
              <label className="text-sm font-medium">超上下文处理</label>
              <p className="text-xs text-muted-foreground">仅 OpenAI Responses API 支持</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setParams({ truncation: 'auto' })}
                className={cn(
                  'flex-1 px-3 py-2 rounded-md text-sm border transition-colors',
                  params.truncation === 'auto'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent'
                    : 'border-input hover:bg-violet-50 dark:hover:bg-violet-900/20'
                )}
              >
                自动截断
              </button>
              <button
                onClick={() => setParams({ truncation: 'disabled' })}
                className={cn(
                  'flex-1 px-3 py-2 rounded-md text-sm border transition-colors',
                  params.truncation === 'disabled'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent'
                    : 'border-input hover:bg-violet-50 dark:hover:bg-violet-900/20'
                )}
              >
                禁用（报错）
              </button>
            </div>
            <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>
                <strong>注意：</strong>聚合 API 通常不支持此参数。
              </span>
            </div>
          </div>
        )}

        {/* Store (Responses API only) */}
        {config.endpointMode === 'responses' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">存储响应</label>
                <p className="text-xs text-muted-foreground">仅 OpenAI Responses API 支持</p>
              </div>
              <button
                onClick={() => setParams({ store: !params.store })}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors',
                  params.store ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'block w-4 h-4 rounded-full bg-white transition-transform',
                    params.store ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
            <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>
                <strong>注意：</strong>聚合 API 通常不支持此参数。
              </span>
            </div>
          </div>
        )}

        {/* Previous Response ID (Responses API only) */}
        {config.endpointMode === 'responses' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">上一响应 ID（多轮串联）</label>
            <input
              type="text"
              value={params.previousResponseId}
              onChange={(e) => setParams({ previousResponseId: e.target.value })}
              className={cn(
                'w-full px-3 py-2 rounded-md text-sm',
                'bg-background border border-input',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
              placeholder="resp_xxx"
            />
          </div>
        )}

        {/* Reasoning Effort */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">推理强度（仅推理模型）</label>
          <select
            value={params.reasoningEffort || ''}
            onChange={(e) => setParams({ reasoningEffort: e.target.value as any || null })}
            className={cn(
              'w-full px-3 py-2 rounded-md text-sm',
              'bg-background border border-input',
              'focus:outline-none focus:ring-2 focus:ring-ring'
            )}
          >
            <option value="">默认（不使用）</option>
            <option value="none">无推理</option>
            <option value="low">低 - 快速响应</option>
            <option value="medium">中 - 平衡质量</option>
            <option value="high">高 - 深度思考</option>
          </select>
          <div className="flex items-start gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p><strong>标准推理模型：</strong>OpenAI o1/o3/gpt-5 系列，使用此参数控制推理深度。</p>
              <p><strong>聚合 API 行为：</strong>部分聚合 API 可能返回 reasoning_content 字段（模型内部思考过程），但行为与标准推理模型不同。</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Structured Output Panel */}
      <StructuredOutputPanel />

      {/* Tools Panel */}
      <ToolsPanel />
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
