import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUp, Plus, Sparkles } from 'lucide-react'
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
    <div className="min-h-dvh flex flex-col md:flex-row">
      <AppShellSidebar locale={locale} />
      <AppShellMain locale={locale} />
    </div>
  )
}

function AppShellSidebar({ locale }: AppShellProps) {
  return (
    <aside className="w-full border-border/60 bg-muted/15 md:w-72 md:border-r">
      <div className="flex h-full flex-col">
        <div className="border-border/60 px-4 py-4 md:border-b">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold tracking-tight">
              {t(locale, 'common', 'appName')}
            </div>
            <Skeleton className="h-6 w-10 rounded-md bg-muted/35" />
          </div>
        </div>

        <div className="px-4 py-4">
          <Button
            className="w-full justify-start border-primary/30 bg-primary/10 text-primary shadow-xs hover:bg-primary/15 dark:border-primary/25 dark:bg-primary/15 dark:hover:bg-primary/20 disabled:opacity-100"
            disabled
            variant="outline"
          >
            <Plus className="size-4" />
            {t(locale, 'sidebar', 'newChat')}
          </Button>
        </div>

        <div className="flex-1 px-4 pb-4">
          <div className="flex items-center justify-between px-1 pb-2">
            <div className="text-xs font-medium text-muted-foreground">
              {t(locale, 'sidebar', 'chatSectionTitle')}
            </div>
            <Skeleton className="h-4 w-12 rounded bg-muted/30" />
          </div>

          <div className="space-y-1">
            {chatItemSkeletonWidths.map((width, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/30"
              >
                <Skeleton className="size-4 rounded bg-muted/35" />
                <div className="min-w-0 flex-1">
                  <Skeleton className={['h-4 bg-muted/40', width].join(' ')} />
                </div>
                <Skeleton className="h-3 w-10 rounded bg-muted/30" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-border/60 px-4 py-4 md:border-t">
          <div className="pb-2 text-xs font-medium text-muted-foreground">
            {t(locale, 'sidebar', 'userSectionTitle')}
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/20">
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-8 rounded-full bg-muted/35" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-3 w-28 bg-muted/35" />
                <Skeleton className="h-3 w-20 bg-muted/30" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Placeholder slots for future settings / theme / language controls (static only). */}
              <Skeleton className="h-7 w-7 rounded-md bg-muted/35" />
              <Skeleton className="h-7 w-7 rounded-md bg-muted/35" />
              <Skeleton className="h-7 w-7 rounded-md bg-muted/35" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function AppShellMain({ locale }: AppShellProps) {
  return (
    <main className="flex flex-1 bg-background px-6 py-10 md:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="pt-8 md:pt-14">
          <div className="max-w-2xl">
            <div className="text-2xl font-semibold tracking-tight">
              {t(locale, 'emptyState', 'title')}
            </div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              {t(locale, 'emptyState', 'description')}
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
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

              <div className="h-px bg-border/60" />
            </div>

            <div className="lg:pt-1">
              <div className="text-xs font-medium text-muted-foreground">
                {t(locale, 'emptyState', 'examplesTitle')}
              </div>
              {/* Suggestions are intentionally light: chip-like items, no cards, no heavy borders. */}
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="rounded-full border border-border/60 bg-muted/10 px-3 py-1.5 text-sm text-foreground">
                  {t(locale, 'emptyState', 'example1')}
                </div>
                <div className="rounded-full border border-border/60 bg-muted/10 px-3 py-1.5 text-sm text-foreground">
                  {t(locale, 'emptyState', 'example2')}
                </div>
                <div className="rounded-full border border-border/60 bg-muted/10 px-3 py-1.5 text-sm text-foreground">
                  {t(locale, 'emptyState', 'example3')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
