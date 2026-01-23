import { useState, useRef, useCallback } from 'react'
import { Image, Upload, Link, X, Loader2, AlertCircle } from 'lucide-react'
import type { ImageContent } from '@/types'
import { generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ImagePreviewModal } from './ImagePreviewModal'

interface ImageUploaderProps {
  images: ImageContent[]
  onAddImage: (image: ImageContent) => void
  onUpdateImage: (imageId: string, updates: Partial<ImageContent>) => void
  onRemoveImage: (imageId: string) => void
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function ImageUploader({
  images,
  onAddImage,
  onUpdateImage,
  onRemoveImage,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const [previewImage, setPreviewImage] = useState<ImageContent | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      alert('仅支持 JPG, PNG, GIF, WebP 格式')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('图片大小不能超过 20MB')
      return
    }

    const imageId = generateId()

    // 添加 loading 状态的图片
    onAddImage({
      id: imageId,
      type: 'base64',
      url: '',
      filename: file.name,
      size: file.size,
      detail: 'auto',
      status: 'loading',
    })

    try {
      // 读取文件为 base64
      const base64 = await readFileAsBase64(file)
      
      // 生成缩略图
      const thumbnail = await generateThumbnail(base64, 100)

      onUpdateImage(imageId, {
        url: base64,
        thumbnail,
        status: 'ready',
      })
    } catch (error) {
      onUpdateImage(imageId, {
        status: 'error',
        error: '图片处理失败',
      })
    }
  }, [onAddImage, onUpdateImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        processFile(file)
      }
    })
  }, [processFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(processFile)
    e.target.value = '' // 重置以允许重复选择同一文件
  }, [processFile])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    items.forEach(item => {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) processFile(file)
      }
    })
  }, [processFile])

  const handleAddUrl = useCallback(async () => {
    if (!urlInput.trim()) return

    setUrlError('')

    // 验证 URL 格式
    try {
      new URL(urlInput)
    } catch {
      setUrlError('无效的 URL 格式')
      return
    }

    const imageId = generateId()

    onAddImage({
      id: imageId,
      type: 'url',
      url: urlInput,
      detail: 'auto',
      status: 'loading',
    })

    // 尝试加载图片验证
    try {
      await loadImage(urlInput)
      onUpdateImage(imageId, { status: 'ready' })
      setUrlInput('')
      setShowUrlInput(false)
    } catch {
      onUpdateImage(imageId, {
        status: 'error',
        error: '无法加载图片',
      })
    }
  }, [urlInput, onAddImage, onUpdateImage])

  if (images.length === 0 && !showUrlInput) {
    return (
      <div
        className={cn(
          'mt-2 p-3 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-border hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPaste={handlePaste}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center gap-1 text-muted-foreground text-xs">
          <Upload className="w-5 h-5" />
          <span>拖拽图片或点击上传</span>
          <span className="text-[10px]">支持 JPG, PNG, GIF, WebP</span>
        </div>
        <div className="flex justify-center mt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowUrlInput(true)
            }}
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700"
          >
            <Link className="w-3 h-3" />
            使用 URL
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      {/* 图片列表 */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(image => (
            <ImageCard
              key={image.id}
              image={image}
              onUpdate={(updates) => onUpdateImage(image.id, updates)}
              onRemove={() => {
                // 如果正在预览该图片，先关闭预览
                if (previewImage?.id === image.id) {
                  setPreviewImage(null)
                }
                onRemoveImage(image.id)
              }}
              onPreview={() => setPreviewImage(image)}
            />
          ))}
        </div>
      )}

      {/* 图片预览模态框 */}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage.url}
          filename={previewImage.filename}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* 添加更多 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs',
            'border border-dashed border-border hover:border-violet-400',
            'text-muted-foreground hover:text-violet-600 transition-colors'
          )}
        >
          <Image className="w-3 h-3" />
          添加图片
        </button>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs',
            'border border-dashed border-border hover:border-violet-400',
            'text-muted-foreground hover:text-violet-600 transition-colors'
          )}
        >
          <Link className="w-3 h-3" />
          URL
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* URL 输入 */}
      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
            placeholder="https://example.com/image.jpg"
            className={cn(
              'flex-1 px-2 py-1 rounded text-xs',
              'bg-background border border-input',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              urlError && 'border-red-500'
            )}
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-2 py-1 rounded text-xs bg-violet-600 text-white hover:bg-violet-700"
          >
            添加
          </button>
          <button
            type="button"
            onClick={() => {
              setShowUrlInput(false)
              setUrlInput('')
              setUrlError('')
            }}
            className="px-2 py-1 rounded text-xs border border-border hover:bg-accent"
          >
            取消
          </button>
        </div>
      )}
      {urlError && <p className="text-xs text-red-500">{urlError}</p>}
    </div>
  )
}

interface ImageCardProps {
  image: ImageContent
  onUpdate: (updates: Partial<ImageContent>) => void
  onRemove: () => void
  onPreview: () => void
}

function ImageCard({ image, onUpdate, onRemove, onPreview }: ImageCardProps) {
  const displayUrl = image.thumbnail || image.url

  return (
    <div
      className={cn(
        'relative group w-20 rounded-lg overflow-hidden border',
        image.status === 'error'
          ? 'border-red-500'
          : 'border-border hover:border-violet-400'
      )}
    >
      {/* 图片预览 */}
      <div 
        className="aspect-square bg-muted flex items-center justify-center cursor-pointer"
        onClick={() => image.status === 'ready' && onPreview()}
        title="点击查看大图"
      >
        {image.status === 'loading' ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : image.status === 'error' ? (
          <AlertCircle className="w-5 h-5 text-red-500" />
        ) : (
          <img
            src={displayUrl}
            alt={image.filename || 'image'}
            className="w-full h-full object-cover hover:opacity-90 transition-opacity"
          />
        )}
      </div>

      {/* 删除按钮 */}
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          'absolute top-1 right-1 p-0.5 rounded-full',
          'bg-black/50 text-white opacity-0 group-hover:opacity-100',
          'hover:bg-red-500 transition-all'
        )}
      >
        <X className="w-3 h-3" />
      </button>

      {/* 信息和设置 */}
      <div className="p-1 text-[10px] truncate text-muted-foreground">
        {image.filename || (image.type === 'url' ? 'URL' : 'image')}
      </div>

      {/* 清晰度选择 */}
      <div className="px-1 pb-1">
        <select
          value={image.detail}
          onChange={(e) => onUpdate({ detail: e.target.value as 'low' | 'high' | 'auto' })}
          className="w-full text-[10px] px-1 py-0.5 rounded border border-input bg-background"
        >
          <option value="auto">自动</option>
          <option value="low">低清</option>
          <option value="high">高清</option>
        </select>
      </div>

      {/* 错误提示 */}
      {image.error && (
        <div className="px-1 pb-1 text-[10px] text-red-500 truncate" title={image.error}>
          {image.error}
        </div>
      )}
    </div>
  )
}

// 工具函数
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function generateThumbnail(base64: string, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      let width = img.width
      let height = img.height
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }
      
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = base64
  })
}

function loadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
}
