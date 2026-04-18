import { t, type Locale } from '@/i18n/messages'

type ChatExampleGuideProps = {
  description: string
  locale: Locale
}

export function ChatExampleGuide({
  description,
  locale,
}: ChatExampleGuideProps) {
  const examplePrompts = [
    t(locale, 'emptyState', 'example1'),
    t(locale, 'emptyState', 'example2'),
    t(locale, 'emptyState', 'example3'),
    t(locale, 'emptyState', 'example4'),
    t(locale, 'emptyState', 'example5'),
    t(locale, 'emptyState', 'example6'),
  ]

  return (
    <div className="w-full max-w-3xl">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t(locale, 'emptyState', 'heroTitle')}
        </div>
        <div className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
        {examplePrompts.map((example) => (
          <div
            key={example}
            className="rounded-full border border-border/60 bg-muted/20 px-4 py-2 text-sm text-foreground"
            suppressHydrationWarning
          >
            {example}
          </div>
        ))}
      </div>
    </div>
  )
}
