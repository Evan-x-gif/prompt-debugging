import { X } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ImagePreviewModalProps {
  imageUrl: string
  filename?: string
  onClose: () => void
}

export function ImagePreviewModal({ imageUrl, filename, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
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
    </div>
  )
}
