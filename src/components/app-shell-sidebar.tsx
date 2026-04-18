import { Button } from '@/components/ui/button'
import { MessageSquare, Plus, Trash2, UserCircle2 } from 'lucide-react'
import { t, type Locale } from '@/i18n/messages'
import { cn } from '@/lib/utils'
import type { ChatSummary } from '@/types/chat'

type AppShellSidebarProps = {
  chatActionError: string | null
  chatListError: string | null
  chats: ChatSummary[]
  currentChatId: string | null
  locale: Locale
  onCreateChat: () => void
  onDeleteChat: (chatId: string) => void
  onRetryChatList: () => void
  onSelectChat: (chatId: string) => void
}

function formatChatCreatedAt(locale: Locale, createdAt: string) {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt))
}

export function AppShellSidebar({
  chatActionError,
  chatListError,
  chats,
  currentChatId,
  locale,
  onCreateChat,
  onDeleteChat,
  onRetryChatList,
  onSelectChat,
}: AppShellSidebarProps) {
  return (
    <aside className="w-full border-border/60 bg-muted/15 md:h-dvh md:w-72 md:shrink-0 md:overflow-hidden md:border-r">
      <div className="flex h-full min-h-dvh flex-col justify-between md:min-h-0">
        <header className="border-border/60 px-4 py-4 md:border-b">
          <div className="text-sm font-semibold tracking-tight">
            {t(locale, 'common', 'appName')}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
          <Button
            className="w-full justify-start border-primary/30 bg-primary/10 text-primary shadow-xs hover:bg-primary/15 dark:border-primary/25 dark:bg-primary/15 dark:hover:bg-primary/20"
            onClick={onCreateChat}
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
            </div>

            {chatActionError ? (
              <div className="mb-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive dark:bg-destructive/10">
                {chatActionError}
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {chatListError ? (
                <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-4 dark:bg-destructive/10">
                  <div className="text-sm font-medium text-foreground">
                    {t(locale, 'sidebar', 'loadErrorTitle')}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-muted-foreground">
                    {chatListError}
                  </div>
                  <Button
                    className="mt-3"
                    onClick={onRetryChatList}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {t(locale, 'common', 'retryAction')}
                  </Button>
                </div>
              ) : chats.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-background/50 px-3 py-4">
                  <div className="text-sm font-medium">
                    {t(locale, 'sidebar', 'emptyTitle')}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-muted-foreground">
                    {t(locale, 'sidebar', 'emptyDescription')}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {chats.map((chat) => {
                    const isActive = chat.id === currentChatId

                    return (
                      <button
                        key={chat.id}
                        className={cn(
                          'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors outline-none',
                          'hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30',
                          isActive
                            ? 'bg-primary/10 text-foreground dark:bg-primary/15'
                            : 'text-foreground',
                        )}
                        onClick={() => onSelectChat(chat.id)}
                        type="button"
                      >
                        <div
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground',
                            isActive && 'border-primary/30 bg-primary/10 text-primary dark:bg-primary/15',
                          )}
                        >
                          <MessageSquare className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{chat.title}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {formatChatCreatedAt(locale, chat.updatedAt)}
                          </div>
                        </div>
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 right-0 w-14 rounded-r-xl bg-gradient-to-l from-background/90 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                        />
                        <span
                          className={cn(
                            'relative z-10 flex shrink-0 items-center',
                            'opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100',
                          )}
                        >
                          <button
                            aria-label={t(locale, 'sidebar', 'deleteChatLabel')}
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 dark:hover:bg-destructive/15"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              onDeleteChat(chat.id)
                            }}
                            type="button"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
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
