import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ImagePreviewModalProps {
  imageUrl: string
  filename?: string
  onClose: () => void
}

export function ImagePreviewModal({ imageUrl, filename, onClose }: ImagePreviewModalProps) {
  const [mounted, setMounted] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // 创建 Portal 容器
    let container = document.getElementById('image-preview-portal')
    if (!container) {
      container = document.createElement('div')
      container.id = 'image-preview-portal'
      document.body.appendChild(container)
    }
    setPortalContainer(container)
    setMounted(true)

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // 阻止页面滚动
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  if (!mounted || !portalContainer) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/50 rounded-t-lg">
          <span className="text-sm text-white truncate max-w-[80%]">
            {filename || '图片预览'}
          </span>
          <button
            onClick={onClose}
            className={cn(
              'p-1 rounded-full hover:bg-white/20 transition-colors',
              'text-white'
            )}
            title="关闭 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center bg-black/30 rounded-b-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={filename || 'Preview'}
            className="max-w-full max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>,
    portalContainer
  )
}
