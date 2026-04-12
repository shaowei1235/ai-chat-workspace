'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp, MessageSquare, Plus, Sparkles, UserCircle2 } from 'lucide-react'
import type { Locale } from '@/i18n/messages'
import { t } from '@/i18n/messages'
import { cn } from '@/lib/utils'
import type { Chat } from '@/types/chat'

type AppShellProps = {
  locale: Locale
}

function formatChatCreatedAt(locale: Locale, createdAt: string) {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt))
}

export function AppShell({ locale }: AppShellProps) {
  // Keep Step 13 state local to the shared shell so Sidebar and Main stay synchronized.
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  const currentChat = chats.find((chat) => chat.id === currentChatId) ?? null

  function handleCreateChat() {
    let nextChat: Chat | null = null

    setChats((previousChats) => {
      const nextChatNumber = previousChats.length + 1
      const createdChat: Chat = {
        id: crypto.randomUUID(),
        title: `${t(locale, 'sidebar', 'newChatDefaultTitle')} ${nextChatNumber}`,
        createdAt: new Date().toISOString(),
      }
      nextChat = createdChat

      return [createdChat, ...previousChats]
    })

    if (nextChat) {
      setCurrentChatId(nextChat.id)
    }
  }

  function handleSelectChat(chatId: string) {
    setCurrentChatId(chatId)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      <AppShellSidebar
        chats={chats}
        currentChatId={currentChatId}
        locale={locale}
        onCreateChat={handleCreateChat}
        onSelectChat={handleSelectChat}
      />
      <AppShellMain currentChat={currentChat} locale={locale} />
    </div>
  )
}

type AppShellSidebarProps = AppShellProps & {
  chats: Chat[]
  currentChatId: string | null
  onCreateChat: () => void
  onSelectChat: (chatId: string) => void
}

function AppShellSidebar({
  chats,
  currentChatId,
  locale,
  onCreateChat,
  onSelectChat,
}: AppShellSidebarProps) {
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

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {chats.length === 0 ? (
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
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors outline-none',
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
                            {formatChatCreatedAt(locale, chat.createdAt)}
                          </div>
                        </div>
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

type AppShellMainProps = AppShellProps & {
  currentChat: Chat | null
}

function AppShellMain({ currentChat, locale }: AppShellMainProps) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-background px-6 md:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <header className="pt-8 pb-6 md:pt-10">
          <div className="max-w-2xl">
            <div className="text-2xl font-semibold tracking-tight">
              {currentChat?.title ?? t(locale, 'emptyState', 'title')}
            </div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              {currentChat
                ? t(locale, 'emptyState', 'activeDescription')
                : t(locale, 'emptyState', 'description')}
            </div>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-8">
          {currentChat ? (
            <div className="w-full max-w-3xl">
              <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center">
                <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t(locale, 'emptyState', 'messageAreaLabel')}
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight">
                  {t(locale, 'emptyState', 'messageAreaTitle')}
                </div>
                <div className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t(locale, 'emptyState', 'messageAreaDescription')}
                </div>
              </div>
            </div>
          ) : (
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
          )}
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
