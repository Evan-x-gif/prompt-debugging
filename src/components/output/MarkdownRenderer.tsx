import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700" {...props} />
          </div>
        ),
        th: ({ node, ...props }) => (
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-800" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700" {...props} />
        ),
        code: ({ node, ...props }: any) => {
          const inline = !props.className?.includes('language-')
          return inline ? (
            <code className="break-words" {...props} />
          ) : (
            <code className="block overflow-x-auto whitespace-pre-wrap break-words" {...props} />
          )
        },
        pre: ({ node, ...props }) => (
          <pre className="overflow-x-auto whitespace-pre-wrap break-words" {...props} />
        ),
        p: ({ node, ...props }) => (
          <p className="break-words" {...props} />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
