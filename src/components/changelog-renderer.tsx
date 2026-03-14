import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Props {
  content: string
}

export function ChangelogRenderer({ content }: Props) {
  return (
    <div className="space-y-8 text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: () => null,
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 mt-8 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="text-muted-foreground">{children}</p>,
          ul: ({ children }) => (
            <ul className="space-y-1 pl-4 list-disc marker:text-muted-foreground/50">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className="text-foreground/80">{children}</li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="brand-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
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
