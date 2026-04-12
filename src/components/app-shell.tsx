import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
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
    <aside className="w-full border-border/60 bg-muted/20 md:w-72 md:border-r">
      <div className="flex h-full flex-col">
        <div className="border-border/60 px-4 py-4 md:border-b">
          <div className="text-sm font-semibold tracking-tight">
            {t(locale, 'appShell.brand')}
          </div>
        </div>

        <div className="px-4 py-4">
          <Button
            className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/15 dark:hover:bg-primary/20"
            disabled
            variant="secondary"
          >
            <Plus className="size-4" />
            {t(locale, 'appShell.newChat')}
          </Button>
        </div>

        <div className="flex-1 px-4 pb-4">
          <div className="px-1 pb-2">
            <div className="text-xs font-medium text-muted-foreground">
              {t(locale, 'appShell.chatSectionTitle')}
            </div>
          </div>

          <div className="space-y-1">
            {chatItemSkeletonWidths.map((width, index) => (
              <div
                key={index}
                className="rounded-md px-2 py-2 hover:bg-muted/30"
              >
                <Skeleton className={['h-4 bg-muted/40', width].join(' ')} />
              </div>
            ))}
          </div>
        </div>

        <div className="border-border px-4 py-4 md:border-t">
          <div className="pb-2 text-xs font-medium text-muted-foreground">
            {t(locale, 'appShell.userSectionTitle')}
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
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
          <div className="text-2xl font-semibold tracking-tight">
            {t(locale, 'appShell.emptyTitle')}
          </div>
          <div className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t(locale, 'appShell.emptyDescription')}
          </div>

          <div className="mt-10 space-y-3">
            <Skeleton className="h-11 w-full rounded-lg bg-muted/40" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-24 rounded-lg bg-muted/30" />
              <Skeleton className="h-24 rounded-lg bg-muted/30" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
