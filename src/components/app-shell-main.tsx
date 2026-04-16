import { ChatExampleGuide } from '@/components/chat-example-guide'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUp } from 'lucide-react'
import { t, type Locale } from '@/i18n/messages'
import { cn } from '@/lib/utils'
import type { Chat } from '@/types/chat'

type AppShellMainProps = {
  chatLoadError: string | null
  currentChat: Chat | null
  generatingMessageId: string | null
  inputValue: string
  isCurrentChatGenerating: boolean
  isGenerating: boolean
  locale: Locale
  onRetryCurrentChat: () => void
  requestError: string | null
  onInputChange: (nextValue: string) => void
  onSendMessage: () => void
}

export function AppShellMain({
  chatLoadError,
  currentChat,
  generatingMessageId,
  inputValue,
  isCurrentChatGenerating,
  isGenerating,
  locale,
  onRetryCurrentChat,
  requestError,
  onInputChange,
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
          {chatLoadError ? (
            <div className="mx-auto mb-4 w-full max-w-3xl rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 dark:bg-destructive/10">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm leading-6 text-foreground">
                  {chatLoadError}
                </div>
                <Button onClick={onRetryCurrentChat} size="sm" type="button" variant="outline">
                  {t(locale, 'common', 'retryAction')}
                </Button>
              </div>
            </div>
          ) : null}

          {currentChat ? (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
              {currentChat.messages.length === 0 && !isCurrentChatGenerating ? (
                <div className="flex flex-1 items-center justify-center">
                  <ChatExampleGuide
                    description={t(
                      locale,
                      'emptyState',
                      'emptyChatDescription',
                    )}
                    locale={locale}
                  />
                </div>
              ) : (
                <div className="flex-1 space-y-4">
                  {currentChat.messages.map((message) => {
                    const isGeneratingMessage =
                      message.id === generatingMessageId

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex',
                          message.role === 'user'
                            ? 'justify-end'
                            : 'justify-start',
                        )}
                      >
                        <div className="max-w-[85%] space-y-2">
                          <div
                            className={cn(
                              'text-xs font-medium',
                              message.role === 'user'
                                ? 'text-right text-primary'
                                : 'text-left text-muted-foreground',
                            )}
                          >
                            {message.role === 'user'
                              ? t(locale, 'emptyState', 'userRoleLabel')
                              : t(locale, 'emptyState', 'assistantRoleLabel')}
                          </div>
                          <div
                            className={cn(
                              'rounded-2xl px-4 py-3 text-sm leading-6 shadow-xs',
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border/60 bg-muted/30 text-foreground dark:bg-muted/20',
                            )}
                          >
                            {isGeneratingMessage &&
                            message.content.length === 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                  <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                                  <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                                  <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                                </div>
                                <span className="text-muted-foreground">
                                  {t(locale, 'emptyState', 'pendingReplyLabel')}
                                </span>
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap break-words">
                                {message.content}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <ChatExampleGuide
                description={t(locale, 'emptyState', 'heroSubtitle')}
                locale={locale}
              />
            </div>
          )}
        </section>

        <div className="sticky bottom-0 pb-6 pt-4 md:pb-8">
          <div className="mx-auto w-full max-w-3xl bg-background/95 supports-[backdrop-filter]:bg-background/80">
            {/* Keep the input area minimal: disable submit while one assistant reply is streaming. */}
            <div className="rounded-2xl border border-border/60 bg-background/80 p-3 shadow-xs backdrop-blur-sm">
              <Textarea
                aria-label={t(locale, 'emptyState', 'inputPlaceholder')}
                className="min-h-24 resize-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                disabled={!currentChat || isGenerating}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    onSendMessage()
                  }
                }}
                placeholder={
                  currentChat
                    ? t(locale, 'emptyState', 'inputPlaceholder')
                    : t(locale, 'emptyState', 'emptyInputGuard')
                }
                value={inputValue}
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {!currentChat
                      ? t(locale, 'emptyState', 'emptyInputGuard')
                      : isGenerating
                        ? t(locale, 'emptyState', 'pendingInputDescription')
                        : t(locale, 'emptyState', 'inputDescription')}
                  </div>
                  {requestError ? (
                    <div className="text-xs text-destructive">
                      {requestError}
                    </div>
                  ) : null}
                </div>
                <Button
                  aria-label={t(locale, 'emptyState', 'sendButtonLabel')}
                  className="rounded-full"
                  disabled={
                    !currentChat ||
                    isGenerating ||
                    inputValue.trim().length === 0
                  }
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
