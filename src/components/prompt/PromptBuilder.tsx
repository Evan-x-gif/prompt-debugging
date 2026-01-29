import { Plus, Trash2, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react'
import { useState, useCallback } from 'react'
import { usePromptStore } from '@/stores/promptStore'
import { cn } from '@/lib/utils'
import { PromptOptimizer } from '@/components/optimizer/PromptOptimizer'
import { TestCasePanel } from '@/components/testing/TestCasePanel'
import { JudgePanel } from '@/components/testing/JudgePanel'
import { ImageUploader } from './ImageUploader'
import { VariablesPanel } from './VariablesPanel'

export function PromptBuilder() {
  const {
    draft,
    setInstructionRole,
    setInstructionText,
    addUserSegment,
    updateUserSegment,
    removeUserSegment,
    addImageToSegment,
    updateImageInSegment,
    removeImageFromSegment,
    addAssistantPreset,
    updateAssistantPreset,
    removeAssistantPreset,
  } = usePromptStore()

  const [draggingSegmentId, setDraggingSegmentId] = useState<string | null>(null)

  const handleDrop = useCallback((segmentId: string, e: React.DragEvent) => {
    e.preventDefault()
    setDraggingSegmentId(null)

    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = async (event) => {
          const base64 = event.target?.result as string
          const imageId = `img-${Date.now()}-${Math.random()}`
          
          addImageToSegment(segmentId, {
            id: imageId,
            type: 'base64',
            url: base64,
            filename: file.name,
            size: file.size,
            detail: 'auto',
            status: 'ready',
          })
        }
        reader.readAsDataURL(file)
      }
    })
  }, [addImageToSegment])

  const handleDragOver = useCallback((segmentId: string, e: React.DragEvent) => {
    e.preventDefault()
    setDraggingSegmentId(segmentId)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDraggingSegmentId(null)
  }, [])

  return (
    <div className="p-4 space-y-4">
      {/* System/Developer Instructions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">系统指令</label>
          <div className="flex gap-1">
            <button
              onClick={() => setInstructionRole('system')}
              className={cn(
                'px-2 py-1 text-xs rounded',
                draft.instructionRole === 'system'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              system
            </button>
            <button
              onClick={() => setInstructionRole('developer')}
              className={cn(
                'px-2 py-1 text-xs rounded',
                draft.instructionRole === 'developer'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              developer
            </button>
          </div>
        </div>
        <textarea
          value={draft.instructionText}
          onChange={(e) => setInstructionText(e.target.value)}
          className={cn(
            'w-full h-32 px-3 py-2 rounded-md text-sm font-mono',
            'bg-background border border-input',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'resize-y'
          )}
          placeholder={`输入 ${draft.instructionRole === 'system' ? '系统' : '开发者'} 指令...`}
        />
      </div>

      {/* User Segments */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">用户消息段落</label>
          <button
            onClick={addUserSegment}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs rounded',
              'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md'
            )}
          >
            <Plus className="w-3 h-3" />
            添加段落
          </button>
        </div>

        <div className="space-y-2">
          {draft.userSegments.map((segment, index) => (
            <div
              key={segment.id}
              className={cn(
                'border rounded-lg overflow-hidden',
                segment.enabled ? 'border-border' : 'border-border/50 opacity-60'
              )}
            >
              {/* Segment Header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <input
                  type="text"
                  value={segment.title}
                  onChange={(e) =>
                    updateUserSegment(segment.id, { title: e.target.value })
                  }
                  className={cn(
                    'flex-1 px-2 py-1 text-sm rounded',
                    'bg-transparent border-none',
                    'focus:outline-none focus:ring-1 focus:ring-ring'
                  )}
                />
                <button
                  onClick={() =>
                    updateUserSegment(segment.id, { enabled: !segment.enabled })
                  }
                  className="p-1 hover:bg-accent rounded"
                  title={segment.enabled ? '禁用' : '启用'}
                >
                  {segment.enabled ? (
                    <ToggleRight className="w-4 h-4 text-primary" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {draft.userSegments.length > 1 && (
                  <button
                    onClick={() => removeUserSegment(segment.id)}
                    className="p-1 hover:bg-destructive/10 rounded text-destructive"
                    title="删除段落"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Segment Content */}
              <div
                className={cn(
                  'relative',
                  draggingSegmentId === segment.id && 'ring-2 ring-blue-500 ring-inset'
                )}
                onDrop={(e) => handleDrop(segment.id, e)}
                onDragOver={(e) => handleDragOver(segment.id, e)}
                onDragLeave={handleDragLeave}
              >
                <textarea
                  value={segment.text}
                  onChange={(e) =>
                    updateUserSegment(segment.id, { text: e.target.value })
                  }
                  onPaste={(e) => {
                    // 处理粘贴的图片
                    const items = Array.from(e.clipboardData.items)
                    items.forEach(item => {
                      if (item.type.startsWith('image/')) {
                        e.preventDefault() // 阻止默认粘贴行为
                        const file = item.getAsFile()
                        if (file) {
                          // 调用 ImageUploader 的处理逻辑
                          const reader = new FileReader()
                          reader.onload = async (event) => {
                            const base64 = event.target?.result as string
                            const imageId = `img-${Date.now()}`
                            
                            // 添加图片到当前段落
                            addImageToSegment(segment.id, {
                              id: imageId,
                              type: 'base64',
                              url: base64,
                              filename: file.name || 'pasted-image.png',
                              size: file.size,
                              detail: 'auto',
                              status: 'ready',
                            })
                          }
                          reader.readAsDataURL(file)
                        }
                      }
                    })
                  }}
                  className={cn(
                    'w-full h-40 px-3 py-2 text-sm font-mono',
                    'bg-background border-none',
                    'focus:outline-none',
                    'resize-y'
                  )}
                  placeholder="输入用户消息内容... (支持粘贴图片、拖拽图片)"
                />
                {draggingSegmentId === segment.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 dark:bg-blue-900/30 pointer-events-none">
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      释放以添加图片
                    </div>
                  </div>
                )}
              </div>

              {/* Image Uploader */}
              <div className="px-3 pb-2">
                <ImageUploader
                  images={segment.images || []}
                  onAddImage={(image) => addImageToSegment(segment.id, image)}
                  onUpdateImage={(imageId, updates) => updateImageInSegment(segment.id, imageId, updates)}
                  onRemoveImage={(imageId) => removeImageFromSegment(segment.id, imageId)}
                />
              </div>

              {/* Joiner (for all but last segment) */}
              {index < draft.userSegments.length - 1 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 text-xs">
                  <span className="text-muted-foreground">连接符：</span>
                  <select
                    value={segment.joiner}
                    onChange={(e) =>
                      updateUserSegment(segment.id, { joiner: e.target.value })
                    }
                    className={cn(
                      'px-2 py-0.5 rounded text-xs',
                      'bg-background border border-input',
                      'focus:outline-none focus:ring-1 focus:ring-ring'
                    )}
                  >
                    <option value="\n\n">双换行</option>
                    <option value="\n">单换行</option>
                    <option value=" ">空格</option>
                    <option value="">无</option>
                    <option value="\n---\n">分隔符 (---)</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Assistant Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">助手预设（历史上下文）</label>
          <button
            onClick={addAssistantPreset}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs rounded',
              'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-md'
            )}
          >
            <Plus className="w-3 h-3" />
            添加预设
          </button>
        </div>

        {draft.assistantPresets.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            暂无助手预设。添加一个可注入对话历史。
          </p>
        ) : (
          <div className="space-y-2">
            {draft.assistantPresets.map((preset) => (
              <div
                key={preset.id}
                className={cn(
                  'border rounded-lg overflow-hidden',
                  preset.enabled ? 'border-border' : 'border-border/50 opacity-60'
                )}
              >
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">
                    assistant
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={() =>
                      updateAssistantPreset(preset.id, { enabled: !preset.enabled })
                    }
                    className="p-1 hover:bg-accent rounded"
                  >
                    {preset.enabled ? (
                      <ToggleRight className="w-4 h-4 text-primary" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => removeAssistantPreset(preset.id)}
                    className="p-1 hover:bg-destructive/10 rounded text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={preset.text}
                  onChange={(e) =>
                    updateAssistantPreset(preset.id, { text: e.target.value })
                  }
                  className={cn(
                    'w-full h-20 px-3 py-2 text-sm font-mono',
                    'bg-background border-none',
                    'focus:outline-none',
                    'resize-y'
                  )}
                  placeholder="输入助手响应..."
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variables Panel */}
      <VariablesPanel />

      {/* Prompt Optimizer */}
      <PromptOptimizer />

      {/* Test Cases */}
      <TestCasePanel />

      {/* LLM Judge */}
      <JudgePanel />
    </div>
  )
}
