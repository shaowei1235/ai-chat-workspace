import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUp, MessageSquare, Plus, Sparkles, UserCircle2 } from 'lucide-react'
import type { Locale } from '@/i18n/messages'
import { t } from '@/i18n/messages'

type AppShellProps = {
  locale: Locale
}

// Varies the placeholder widths so the chat list looks like natural titles, not a single solid block.
const chatItemSkeletonWidths = [
  'w-10/12',
  'w-8/12',
  'w-11/12',
  'w-7/12',
  'w-9/12',
  'w-6/12',
] as const

export function AppShell({ locale }: AppShellProps) {
  // Static App Shell: layout only (no data, no routing, no real actions).
  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      <AppShellSidebar locale={locale} />
      <AppShellMain locale={locale} />
    </div>
  )
}

function AppShellSidebar({ locale }: AppShellProps) {
  return (
    <aside className="w-full border-border/60 bg-muted/15 md:min-h-dvh md:w-72 md:border-r">
      <div className="flex min-h-dvh h-full flex-col justify-between">
        <header className="border-border/60 px-4 py-4 md:border-b">
          <div className="text-sm font-semibold tracking-tight">
            {t(locale, 'common', 'appName')}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
          <Button
            className="w-full justify-start border-primary/30 bg-primary/10 text-primary shadow-xs hover:bg-primary/15 dark:border-primary/25 dark:bg-primary/15 dark:hover:bg-primary/20 disabled:opacity-100"
            disabled
            variant="outline"
          >
            <Plus className="size-4" />
            {t(locale, 'sidebar', 'newChat')}
          </Button>

          <div className="mt-6 flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between px-1 pb-2">
              <div className="text-xs font-medium text-muted-foreground">
                {t(locale, 'sidebar', 'chatSectionTitle')}
              </div>
              <Skeleton className="h-4 w-12 rounded bg-muted/30" />
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
              {chatItemSkeletonWidths.map((width, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/30"
                >
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className={['h-4 bg-muted/40', width].join(' ')} />
                  </div>
                  <Skeleton className="h-3 w-10 rounded bg-muted/30" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="border-border/60 px-4 py-4 md:border-t">
          <div className="pb-2 text-xs font-medium text-muted-foreground">
            {t(locale, 'sidebar', 'userSectionTitle')}
          </div>
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UserCircle2 className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {t(locale, 'sidebar', 'userName')}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {t(locale, 'sidebar', 'userRole')}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </aside>
  )
}

function AppShellMain({ locale }: AppShellProps) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-background px-6 md:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <header className="pt-8 pb-6 md:pt-10">
          <div className="max-w-2xl">
            <div className="text-2xl font-semibold tracking-tight">
              {t(locale, 'emptyState', 'title')}
            </div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              {t(locale, 'emptyState', 'description')}
            </div>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-3xl">
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-3xl font-semibold tracking-tight md:text-4xl">
                {t(locale, 'emptyState', 'heroTitle')}
              </div>
              <div className="mt-3 text-sm leading-6 text-muted-foreground">
                {t(locale, 'emptyState', 'heroSubtitle')}
              </div>
            </div>

            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
              {[
                t(locale, 'emptyState', 'example1'),
                t(locale, 'emptyState', 'example2'),
                t(locale, 'emptyState', 'example3'),
                t(locale, 'emptyState', 'example4'),
                t(locale, 'emptyState', 'example5'),
                t(locale, 'emptyState', 'example6'),
              ].map((example) => (
                <div
                  key={example}
                  className="rounded-full border border-border/60 bg-muted/20 px-4 py-2 text-sm text-foreground"
                >
                  {example}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="sticky bottom-0 pb-6 pt-4 md:pb-8">
          <div className="mx-auto w-full max-w-3xl bg-background/95 supports-[backdrop-filter]:bg-background/80">
            {/* Static input entry placeholder: looks like a real composer but has no interaction. */}
            {/* This block is focusable for realistic affordance, but remains non-editable (static only). */}
            <div
              role="textbox"
              aria-readonly="true"
              aria-label={t(locale, 'emptyState', 'inputPlaceholder')}
              tabIndex={0}
              className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 shadow-xs outline-none transition-colors hover:bg-background/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
            >
              <Sparkles className="size-4 text-muted-foreground" />
              <div className="flex-1 truncate text-sm text-muted-foreground">
                {t(locale, 'emptyState', 'inputPlaceholder')}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <ArrowUp className="size-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
