import { getQuickPromptGroups } from '@/features/chat/quick-prompts'
import { t, type Locale } from '@/i18n/messages'

type ChatExampleGuideProps = {
  description: string
  locale: Locale
  onSelectPrompt: (prompt: string) => void
}

export function ChatExampleGuide({
  description,
  locale,
  onSelectPrompt,
}: ChatExampleGuideProps) {
  const quickPromptGroups = getQuickPromptGroups(locale)

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

      <div className="mx-auto mt-8 grid max-w-3xl gap-6 md:grid-cols-3">
        {quickPromptGroups.map((group) => (
          <section
            className="space-y-3 text-left"
            key={group.id}
          >
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {group.presets.map((preset) => (
                <button
                  className="cursor-pointer rounded-full border border-border/60 bg-muted/20 px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-muted/15 dark:hover:bg-muted/30"
                  key={preset.id}
                  onClick={() => onSelectPrompt(preset.prompt)}
                  suppressHydrationWarning
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
