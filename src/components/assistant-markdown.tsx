import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

type AssistantMarkdownProps = {
  content: string
}

export function AssistantMarkdown({ content }: AssistantMarkdownProps) {
  return (
    <div
      className={cn(
        'space-y-4 text-sm leading-7',
        '[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:tracking-tight',
        '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight',
        '[&_h3]:text-base [&_h3]:font-semibold',
        '[&_p]:my-0',
        '[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5',
        '[&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5',
        '[&_li]:marker:text-muted-foreground',
        '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4',
        '[&_a:hover]:opacity-85',
        '[&_strong]:font-semibold',
        '[&_em]:italic',
        '[&_code]:rounded-md [&_code]:bg-muted/80 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]',
        '[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border/70 [&_pre]:bg-background/80 [&_pre]:p-3',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[13px] [&_pre_code]:leading-6',
        'dark:[&_code]:bg-muted/50 dark:[&_pre]:bg-background/40',
      )}
      suppressHydrationWarning
    >
      <ReactMarkdown
        components={{
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              rel="noreferrer"
              target="_blank"
              {...props}
            >
              {children}
            </a>
          ),
        }}
        remarkPlugins={[remarkGfm, remarkBreaks]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
