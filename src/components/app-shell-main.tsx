import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUp } from 'lucide-react'
import { t, type Locale } from '@/i18n/messages'
import { cn } from '@/lib/utils'
import type { Chat } from '@/types/chat'

type AppShellMainProps = {
  currentChat: Chat | null
  generatingMessageId: string | null
  inputValue: string
  isCurrentChatGenerating: boolean
  isGenerating: boolean
  locale: Locale
  requestError: string | null
  onInputChange: (nextValue: string) => void
  onSendMessage: () => void
}

export function AppShellMain({
  currentChat,
  generatingMessageId,
  inputValue,
  isCurrentChatGenerating,
  isGenerating,
  locale,
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
          {currentChat ? (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
              <div className="pb-4">
                <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t(locale, 'emptyState', 'messageAreaLabel')}
                </div>
              </div>

              {currentChat.messages.length === 0 && !isCurrentChatGenerating ? (
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
                  {currentChat.messages.map((message) => {
                    const isGeneratingMessage = message.id === generatingMessageId

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex',
                          message.role === 'user' ? 'justify-end' : 'justify-start',
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
                            {isGeneratingMessage && message.content.length === 0 ? (
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
                  disabled={!currentChat || isGenerating || inputValue.trim().length === 0}
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
