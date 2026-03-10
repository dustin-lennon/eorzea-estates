import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Link from "next/link"

interface Props {
  content: string
}

export function LegalPageRenderer({ content }: Props) {
  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-foreground mb-2 mt-6 first:mt-0">
              {children}
            </h2>
          ),
          p: ({ children }) => <p className="mb-2">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          a: ({ href, children }) => {
            if (href?.startsWith("/")) {
              return (
                <Link href={href} className="brand-link">
                  {children}
                </Link>
              )
            }
            return (
              <a
                href={href}
                className="brand-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            )
          },
          table: ({ children }) => (
            <div className="mt-4 rounded-lg border border-border overflow-hidden">
              <table className="w-full text-left">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y">{children}</tbody>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 font-medium">{children}</th>
          ),
          td: ({ children }) => <td className="px-4 py-2">{children}</td>,
          code: ({ children }) => (
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
