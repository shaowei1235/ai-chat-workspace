import { useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { AssistantMarkdown } from '@/components/assistant-markdown'
import { ChatExampleGuide } from '@/components/chat-example-guide'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUp, Github, Square } from 'lucide-react'
import { t, type Locale } from '@/i18n/messages'
import { cn } from '@/lib/utils'
import type { AuthUser } from '@/types/auth'
import type { Chat } from '@/types/chat'

type AppShellMainProps = {
  authUser: AuthUser | null
  chatLoadError: string | null
  currentChat: Chat | null
  generatingMessageId: string | null
  guestLimit: number
  guestRemainingCount: number
  inputValue: string
  isGuestLimitReached: boolean
  isGuestUsageLoading: boolean
  isCurrentChatGenerating: boolean
  isGenerating: boolean
  locale: Locale
  onRetryCurrentChat: () => void
  requestError: string | null
  onInputChange: (nextValue: string) => void
  onSendMessage: () => void
  onStopGenerating: () => void
}

export function AppShellMain({
  authUser,
  chatLoadError,
  currentChat,
  generatingMessageId,
  guestLimit,
  guestRemainingCount,
  inputValue,
  isGuestLimitReached,
  isGuestUsageLoading,
  isCurrentChatGenerating,
  isGenerating,
  locale,
  onRetryCurrentChat,
  requestError,
  onInputChange,
  onSendMessage,
  onStopGenerating,
}: AppShellMainProps) {
  const isComposingRef = useRef(false)
  const messageScrollViewportRef = useRef<HTMLDivElement | null>(null)
  const messageListEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const hasCurrentChat = currentChat !== null
  const lastMessageContent =
    currentChat?.messages[currentChat.messages.length - 1]?.content ?? ''
  const isAuthenticated = authUser !== null

  function scrollMessagesToBottom() {
    messageListEndRef.current?.scrollIntoView({
      block: 'end',
    })
  }

  function handleSelectQuickPrompt(prompt: string) {
    // 当前阶段采用“显式点击就直接覆盖”的策略，行为最简单也最可预期。
    onInputChange(prompt)

    window.requestAnimationFrame(() => {
      if (!inputRef.current || inputRef.current.disabled) {
        return
      }

      inputRef.current.focus()
      inputRef.current.setSelectionRange(prompt.length, prompt.length)
    })
  }

  useEffect(() => {
    if (!hasCurrentChat) {
      return
    }

    // 当前阶段统一采用“进入会话或消息变化时滚到底部”的简单策略。
    const frameId = window.requestAnimationFrame(() => {
      scrollMessagesToBottom()
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [
    hasCurrentChat,
    currentChat?.id,
    currentChat?.messages.length,
    lastMessageContent,
    generatingMessageId,
  ])

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-background px-6 md:h-dvh md:min-h-0 md:overflow-hidden md:px-10">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden">
        <header className="shrink-0 pt-8 pb-6 md:pt-10">
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

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden py-8">
          {chatLoadError ? (
            <div className="mx-auto mb-4 w-full max-w-3xl shrink-0 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 dark:bg-destructive/10">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm leading-6 text-foreground">
                  {chatLoadError}
                </div>
                <Button
                  onClick={onRetryCurrentChat}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {t(locale, 'common', 'retryAction')}
                </Button>
              </div>
            </div>
          ) : null}

          {currentChat ? (
            <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
              {currentChat.messages.length === 0 && !isCurrentChatGenerating ? (
                <div className="flex flex-1 items-center justify-center">
                  <ChatExampleGuide
                    description={t(
                      locale,
                      'emptyState',
                      'emptyChatDescription',
                    )}
                    locale={locale}
                    onSelectPrompt={handleSelectQuickPrompt}
                  />
                </div>
              ) : (
                <div
                  ref={messageScrollViewportRef}
                  className="flex-1 overflow-y-auto pr-2"
                >
                  <div className="space-y-4 pb-6">
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
                                    {t(
                                      locale,
                                      'emptyState',
                                      'pendingReplyLabel',
                                    )}
                                  </span>
                                </div>
                              ) : (
                                message.role === 'assistant' ? (
                                  <AssistantMarkdown content={message.content} />
                                ) : (
                                  <div className="whitespace-pre-wrap break-words">
                                    {message.content}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {/* 用底部锚点承接所有“滚动到最新消息”的动作，逻辑最简单也最稳定。 */}
                    <div ref={messageListEndRef} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <ChatExampleGuide
                description={t(locale, 'emptyState', 'heroSubtitle')}
                locale={locale}
                onSelectPrompt={handleSelectQuickPrompt}
              />
            </div>
          )}
        </section>

        <div className="shrink-0 pb-6 pt-4 md:pb-8">
          <div className="mx-auto w-full max-w-3xl bg-background/95 supports-[backdrop-filter]:bg-background/80">
            {/* Keep the input area minimal: disable submit while one assistant reply is streaming. */}
            <div className="rounded-2xl border border-border/60 bg-background/80 p-3 shadow-xs backdrop-blur-sm">
              <Textarea
                aria-label={t(locale, 'emptyState', 'inputPlaceholder')}
                className="min-h-24 resize-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                disabled={!currentChat || isGenerating || isGuestLimitReached}
                onChange={(event) => onInputChange(event.target.value)}
                onCompositionEnd={() => {
                  isComposingRef.current = false
                }}
                onCompositionStart={() => {
                  isComposingRef.current = true
                }}
                onKeyDown={(event) => {
                  const isImeComposing =
                    event.nativeEvent.isComposing || isComposingRef.current

                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey &&
                    !isImeComposing
                  ) {
                    event.preventDefault()
                    onSendMessage()
                  }
                }}
                ref={inputRef}
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
                    {isAuthenticated
                      ? t(locale, 'emptyState', 'guestUsageLoggedIn')
                      : isGuestUsageLoading
                      ? t(locale, 'emptyState', 'guestUsageLoading')
                      : isGuestLimitReached
                        ? t(locale, 'emptyState', 'guestUsageReached')
                        : `${t(locale, 'emptyState', 'guestUsageRemainingPrefix')} ${guestRemainingCount}/${guestLimit} ${t(locale, 'emptyState', 'guestUsageRemainingSuffix')}`}
                  </div>
                  {requestError ? (
                    <div className="text-xs text-destructive">
                      {requestError}
                    </div>
                  ) : null}
                  {!isAuthenticated && isGuestLimitReached ? (
                    <Button
                      className="mt-1 h-7 rounded-full px-3 text-xs"
                      onClick={() => {
                        void signIn('github', { callbackUrl: '/' })
                      }}
                      size="xs"
                      type="button"
                      variant="outline"
                    >
                      <Github className="size-3.5" />
                      {t(locale, 'emptyState', 'continueWithGitHub')}
                    </Button>
                  ) : null}
                </div>
                <Button
                  aria-label={
                    isGenerating
                      ? t(locale, 'emptyState', 'stopGeneratingLabel')
                      : t(locale, 'emptyState', 'sendButtonLabel')
                  }
                  className="rounded-full"
                  disabled={
                    isGenerating
                      ? false
                      : !currentChat ||
                        isGuestLimitReached ||
                        inputValue.trim().length === 0
                  }
                  onClick={isGenerating ? onStopGenerating : onSendMessage}
                  size="icon-sm"
                  title={
                    isGenerating
                      ? t(locale, 'emptyState', 'stopGeneratingLabel')
                      : t(locale, 'emptyState', 'sendButtonLabel')
                  }
                  type="button"
                >
                  {isGenerating ? (
                    <Square className="size-3.5 fill-current" />
                  ) : (
                    <ArrowUp className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
