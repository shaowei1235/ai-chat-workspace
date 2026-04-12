'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUp, MessageSquare, Plus, UserCircle2 } from 'lucide-react'
import type { Locale } from '@/i18n/messages'
import { t } from '@/i18n/messages'
import { cn } from '@/lib/utils'
import type { Chat, ChatMessage } from '@/types/chat'

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
  const [composerValue, setComposerValue] = useState('')

  const currentChat = chats.find((chat) => chat.id === currentChatId) ?? null

  function handleCreateChat() {
    let nextChat: Chat | null = null

    setChats((previousChats) => {
      const nextChatNumber = previousChats.length + 1
      const createdChat: Chat = {
        id: crypto.randomUUID(),
        title: `${t(locale, 'sidebar', 'newChatDefaultTitle')} ${nextChatNumber}`,
        createdAt: new Date().toISOString(),
        messages: [],
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

  function handleComposerChange(nextValue: string) {
    setComposerValue(nextValue)
  }

  function handleSendMessage() {
    const trimmedValue = composerValue.trim()

    if (!currentChatId || trimmedValue.length === 0) {
      return
    }

    const nextMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedValue,
      createdAt: new Date().toISOString(),
    }

    setChats((previousChats) =>
      previousChats.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, nextMessage],
            }
          : chat,
      ),
    )
    setComposerValue('')
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
      <AppShellMain
        composerValue={composerValue}
        currentChat={currentChat}
        locale={locale}
        onComposerChange={handleComposerChange}
        onSendMessage={handleSendMessage}
      />
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
  composerValue: string
  currentChat: Chat | null
  onComposerChange: (nextValue: string) => void
  onSendMessage: () => void
}

function AppShellMain({
  composerValue,
  currentChat,
  locale,
  onComposerChange,
  onSendMessage,
}: AppShellMainProps) {
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

        <section className="flex flex-1 flex-col py-8">
          {currentChat ? (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
              <div className="pb-4">
                <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t(locale, 'emptyState', 'messageAreaLabel')}
                </div>
              </div>

              {currentChat.messages.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center">
                    <div className="text-2xl font-semibold tracking-tight">
                      {t(locale, 'emptyState', 'emptyChatTitle')}
                    </div>
                    <div className="mt-3 text-sm leading-6 text-muted-foreground">
                      {t(locale, 'emptyState', 'emptyChatDescription')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-4">
                  {currentChat.messages.map((message) => (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-xs">
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
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
            </div>
          )}
        </section>

        <div className="sticky bottom-0 pb-6 pt-4 md:pb-8">
          <div className="mx-auto w-full max-w-3xl bg-background/95 supports-[backdrop-filter]:bg-background/80">
            {/* Keep the composer minimal: local-only input that appends a user message to the active chat. */}
            <div className="rounded-2xl border border-border/60 bg-background/80 p-3 shadow-xs backdrop-blur-sm">
              <Textarea
                aria-label={t(locale, 'emptyState', 'inputPlaceholder')}
                className="min-h-24 resize-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                disabled={!currentChat}
                onChange={(event) => onComposerChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    onSendMessage()
                  }
                }}
                placeholder={
                  currentChat
                    ? t(locale, 'emptyState', 'inputPlaceholder')
                    : t(locale, 'emptyState', 'emptyComposerGuard')
                }
                value={composerValue}
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {currentChat
                    ? t(locale, 'emptyState', 'composerDescription')
                    : t(locale, 'emptyState', 'emptyComposerGuard')}
                </div>
                <Button
                  aria-label={t(locale, 'emptyState', 'sendButtonLabel')}
                  className="rounded-full"
                  disabled={!currentChat || composerValue.trim().length === 0}
                  onClick={onSendMessage}
                  size="icon-sm"
                  type="button"
                >
                  <ArrowUp className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
