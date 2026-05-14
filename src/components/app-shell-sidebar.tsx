import { useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signIn, signOut } from 'next-auth/react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  CircleX,
  Github,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  UserCircle2,
} from 'lucide-react'
import { localeCookieName, localeStorageKey } from '@/i18n/constants'
import { t, type Locale } from '@/i18n/messages'
import { cn } from '@/lib/utils'
import type { AuthUser } from '@/types/auth'
import type { ChatSearchResult, ChatSummary } from '@/types/chat'

const MAX_CHAT_TITLE_LENGTH = 50
type AppShellSidebarProps = {
  authUser: AuthUser | null
  chatActionError: string | null
  chatListError: string | null
  chats: ChatSummary[]
  currentChatId: string | null
  isSearchLoading: boolean
  isSearchMode: boolean
  locale: Locale
  onCreateChat: () => void
  onClearSearch: () => void
  onDeleteChat: (chatId: string) => void
  onRenameChat: (chatId: string, nextTitle: string) => Promise<void>
  onRetryChatList: () => void
  onSearchQueryChange: (nextValue: string) => void
  onSelectChat: (chatId: string) => void
  searchError: string | null
  searchQuery: string
  searchResults: ChatSearchResult[]
}

function formatChatCreatedAt(locale: Locale, createdAt: string) {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt))
}

function resolveBrowserLocale(): Locale {
  const browserLocales = [...navigator.languages, navigator.language].filter(
    Boolean,
  )

  return browserLocales.some((value) => value.toLowerCase().startsWith('zh'))
    ? 'zh-CN'
    : 'ja'
}

export function AppShellSidebar({
  authUser,
  chatActionError,
  chatListError,
  chats,
  currentChatId,
  isSearchLoading,
  isSearchMode,
  locale,
  onCreateChat,
  onClearSearch,
  onDeleteChat,
  onRenameChat,
  onRetryChatList,
  onSearchQueryChange,
  onSelectChat,
  searchError,
  searchQuery,
  searchResults,
}: AppShellSidebarProps) {
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const isComposingRef = useRef(false)
  const didSyncLocaleRef = useRef(false)

  useEffect(() => {
    if (!editingChatId) {
      return
    }

    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editingChatId])

  useEffect(() => {
    if (didSyncLocaleRef.current) {
      return
    }

    didSyncLocaleRef.current = true

    const hasLocaleCookie = document.cookie
      .split('; ')
      .some((entry) => entry.startsWith(`${localeCookieName}=`))

    if (hasLocaleCookie) {
      return
    }

    const storedLocale = window.localStorage.getItem(localeStorageKey)
    const preferredLocale =
      storedLocale === 'zh-CN' || storedLocale === 'ja'
        ? storedLocale
        : resolveBrowserLocale()

    window.localStorage.setItem(localeStorageKey, preferredLocale)

    if (preferredLocale === locale) {
      return
    }

    void fetch('/api/locale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locale: preferredLocale,
      }),
    })
      .then(() => {
        startTransition(() => {
          router.refresh()
        })
      })
      .catch((error) => {
        console.error('初始化语言偏好失败', error)
      })
  }, [locale, router, startTransition])

  function startEditingChat(chat: ChatSummary) {
    setEditingChatId(chat.id)
    setDraftTitle(chat.title)
    setRenameError(null)
  }

  function cancelEditingChat() {
    setEditingChatId(null)
    setDraftTitle('')
    setRenameError(null)
    isComposingRef.current = false
  }

  function validateDraftTitle() {
    const trimmedTitle = draftTitle.trim()

    if (trimmedTitle.length === 0) {
      setRenameError(t(locale, 'sidebar', 'renameChatErrorEmpty'))
      return null
    }

    if (trimmedTitle.length > MAX_CHAT_TITLE_LENGTH) {
      setRenameError(t(locale, 'sidebar', 'renameChatErrorTooLong'))
      return null
    }

    setRenameError(null)
    return trimmedTitle
  }

  async function submitRenameChat(chat: ChatSummary) {
    const nextTitle = validateDraftTitle()

    if (!nextTitle) {
      return
    }

    if (nextTitle === chat.title) {
      cancelEditingChat()
      return
    }

    try {
      await onRenameChat(chat.id, nextTitle)
      cancelEditingChat()
    } catch {
      setRenameError(t(locale, 'sidebar', 'renameChatErrorFailed'))
    }
  }

  async function handleLocaleChange(nextLocale: Locale) {
    if (nextLocale === locale) {
      return
    }

    window.localStorage.setItem(localeStorageKey, nextLocale)

    await fetch('/api/locale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locale: nextLocale,
      }),
    })
    startTransition(() => {
      router.refresh()
    })
  }

  function handleThemeChange(nextTheme: 'light' | 'dark' | 'system') {
    setTheme(nextTheme)
  }

  const activeTheme = theme === 'light' || theme === 'dark' ? theme : 'system'
  const isAuthenticated = authUser !== null

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

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 rounded-xl bg-background/70 pl-9 pr-9 text-sm dark:bg-background/60"
              onChange={(event) => {
                onSearchQueryChange(event.target.value)
              }}
              placeholder={t(locale, 'sidebar', 'searchPlaceholder')}
              // Use a plain text input here so the browser does not inject its native
              // search clear button and clash with our custom clear action.
              type="text"
              value={searchQuery}
            />
            {searchQuery.trim().length > 0 ? (
              <button
                aria-label={t(locale, 'sidebar', 'clearSearchLabel')}
                className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={onClearSearch}
                type="button"
              >
                <CircleX className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-6 flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between px-1 pb-2">
              <div className="text-xs font-medium text-muted-foreground">
                {isSearchMode
                  ? t(locale, 'sidebar', 'searchResultsTitle')
                  : t(locale, 'sidebar', 'chatSectionTitle')}
              </div>
            </div>

            {chatActionError ? (
              <div className="mb-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive dark:bg-destructive/10">
                {chatActionError}
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {isSearchMode ? (
                searchError ? (
                  <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-4 dark:bg-destructive/10">
                    <div className="text-sm font-medium text-foreground">
                      {t(locale, 'sidebar', 'searchErrorTitle')}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-muted-foreground">
                      {searchError}
                    </div>
                  </div>
                ) : isSearchLoading ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-background/50 px-3 py-4">
                    <div className="text-sm font-medium">
                      {t(locale, 'sidebar', 'searchLoadingTitle')}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-muted-foreground">
                      {t(locale, 'sidebar', 'searchLoadingDescription')}
                    </div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 bg-background/50 px-3 py-4">
                    <div className="text-sm font-medium">
                      {t(locale, 'sidebar', 'searchEmptyTitle')}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-muted-foreground">
                      {t(locale, 'sidebar', 'searchEmptyDescription')}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((result) => {
                      const isActive = result.chatId === currentChatId

                      return (
                        <button
                          className={cn(
                            'flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors outline-none hover:bg-muted/40',
                            isActive
                              ? 'bg-primary/10 text-foreground dark:bg-primary/15'
                              : 'text-foreground',
                          )}
                          key={result.matchedMessageId}
                          onClick={() => onSelectChat(result.chatId)}
                          type="button"
                        >
                          <div
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground',
                              isActive && 'border-primary/30 bg-primary/10 text-primary dark:bg-primary/15',
                            )}
                          >
                            <Search className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">
                              {result.chatTitle}
                            </div>
                            <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                              {result.preview}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              ) : chatListError ? (
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
                    const isEditing = chat.id === editingChatId

                    return (
                      <div
                        key={chat.id}
                        className={cn(
                          'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors outline-none',
                          'hover:bg-muted/40',
                          isActive
                            ? 'bg-primary/10 text-foreground dark:bg-primary/15'
                            : 'text-foreground',
                          isEditing && 'items-start',
                        )}
                      >
                        <div
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground',
                            isActive && 'border-primary/30 bg-primary/10 text-primary dark:bg-primary/15',
                          )}
                        >
                          <MessageSquare className="size-4" />
                        </div>
                        {isEditing ? (
                          <div className="min-w-0 flex-1">
                            <input
                              aria-label={t(locale, 'sidebar', 'renameChatLabel')}
                              className={cn(
                                'w-full rounded-md border border-border/70 bg-background px-2.5 py-1.5 text-sm font-medium outline-none transition-colors',
                                'focus:border-ring focus:ring-2 focus:ring-ring/30',
                                'dark:bg-background/80',
                                renameError &&
                                  'border-destructive/50 focus:border-destructive/60 focus:ring-destructive/20',
                              )}
                              maxLength={MAX_CHAT_TITLE_LENGTH}
                              onBlur={() => {
                                const trimmedTitle = draftTitle.trim()

                                if (trimmedTitle.length === 0) {
                                  cancelEditingChat()
                                  return
                                }

                                void submitRenameChat(chat)
                              }}
                              onChange={(event) => {
                                setDraftTitle(event.target.value)
                                if (renameError) {
                                  setRenameError(null)
                                }
                              }}
                              onCompositionEnd={() => {
                                isComposingRef.current = false
                              }}
                              onCompositionStart={() => {
                                isComposingRef.current = true
                              }}
                              onKeyDown={(event) => {
                                const isComposing =
                                  event.nativeEvent.isComposing || isComposingRef.current

                                if (event.key === 'Escape') {
                                  event.preventDefault()
                                  cancelEditingChat()
                                  return
                                }

                                if (event.key === 'Enter' && !isComposing) {
                                  event.preventDefault()
                                  void submitRenameChat(chat)
                                }
                              }}
                              ref={inputRef}
                              type="text"
                              value={draftTitle}
                            />
                            {renameError ? (
                              <div className="mt-1 px-1 text-xs text-destructive">
                                {renameError}
                              </div>
                            ) : (
                              <div
                                className="mt-1 px-1 text-xs text-muted-foreground"
                                suppressHydrationWarning
                              >
                                {formatChatCreatedAt(locale, chat.updatedAt)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <button
                              className="min-w-0 flex-1 cursor-pointer rounded-lg text-left outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                              onClick={() => onSelectChat(chat.id)}
                              type="button"
                            >
                              <div
                                className="truncate text-sm font-medium"
                                suppressHydrationWarning
                              >
                                {chat.title}
                              </div>
                              <div
                                className="truncate text-xs text-muted-foreground"
                                suppressHydrationWarning
                              >
                                {formatChatCreatedAt(locale, chat.updatedAt)}
                              </div>
                            </button>
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-y-0 right-0 w-20 rounded-r-xl bg-gradient-to-l from-background/90 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                            />
                            <span
                              className={cn(
                                'relative z-10 flex shrink-0 items-center',
                                'opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100',
                              )}
                            >
                              <button
                                aria-label={t(locale, 'sidebar', 'renameChatLabel')}
                                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  startEditingChat(chat)
                                }}
                                type="button"
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                aria-label={t(locale, 'sidebar', 'deleteChatLabel')}
                                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 dark:hover:bg-destructive/15"
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
                          </>
                        )}
                      </div>
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
          <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2">
            <div className="flex min-w-0 items-center gap-3">
              {authUser?.image ? (
                <Image
                  alt={authUser.name ?? t(locale, 'auth', 'guestName')}
                  className="size-9 rounded-full object-cover"
                  height={36}
                  src={authUser.image}
                  width={36}
                />
              ) : (
                <div className="flex size-9 items-center justify-center rounded-full bg-muted/70 text-muted-foreground">
                  <UserCircle2 className="size-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {authUser?.name ?? t(locale, 'auth', 'guestName')}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {isAuthenticated
                    ? t(locale, 'auth', 'githubLoggedIn')
                    : t(locale, 'auth', 'guestRole')}
                </div>
              </div>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  aria-label={t(locale, 'sidebar', 'settingsSectionTitle')}
                  className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Settings2 className="size-4" />
                  {t(locale, 'sidebar', 'settingsSectionTitle')}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-72 rounded-2xl border-border/70 p-3 shadow-lg"
                side="top"
              >
                <div className="space-y-4">
                  <div className="border-b border-border/60 px-1 pb-2 text-sm font-medium">
                    {t(locale, 'sidebar', 'settingsSectionTitle')}
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="px-1 text-xs font-medium text-muted-foreground">
                        {t(locale, 'sidebar', 'languageLabel')}
                      </div>
                      <div className="inline-flex w-full items-center rounded-xl border border-border/60 bg-muted/30 p-1 dark:bg-muted/20">
                        {(['zh-CN', 'ja'] as const).map((nextLocale) => {
                          const isActive = nextLocale === locale

                          return (
                            <button
                              className={cn(
                                'flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                                'text-muted-foreground hover:bg-background/70 hover:text-foreground dark:hover:bg-background/50',
                                isActive &&
                                  'bg-background text-foreground shadow-xs dark:bg-background/80',
                              )}
                              disabled={isPending}
                              key={nextLocale}
                              onClick={() => {
                                void handleLocaleChange(nextLocale)
                              }}
                              type="button"
                            >
                              {nextLocale === 'zh-CN'
                                ? t(locale, 'sidebar', 'localeZhCn')
                                : t(locale, 'sidebar', 'localeJa')}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="space-y-2" suppressHydrationWarning>
                      <div className="px-1 text-xs font-medium text-muted-foreground">
                        {t(locale, 'sidebar', 'themeLabel')}
                      </div>
                      <div className="inline-flex w-full items-center rounded-xl border border-border/60 bg-muted/30 p-1 dark:bg-muted/20">
                        {(['light', 'dark', 'system'] as const).map((nextTheme) => {
                          const isActive = activeTheme === nextTheme

                          return (
                            <button
                              className={cn(
                                'flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                                'text-muted-foreground hover:bg-background/70 hover:text-foreground dark:hover:bg-background/50',
                                isActive &&
                                  'bg-background text-foreground shadow-xs dark:bg-background/80',
                              )}
                              key={nextTheme}
                              onClick={() => handleThemeChange(nextTheme)}
                              type="button"
                            >
                              {nextTheme === 'light'
                                ? t(locale, 'sidebar', 'themeLight')
                                : nextTheme === 'dark'
                                  ? t(locale, 'sidebar', 'themeDark')
                                  : t(locale, 'sidebar', 'themeSystem')}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="mt-2 px-2">
            {isAuthenticated ? (
              <Button
                className="w-full justify-center"
                onClick={() => {
                  void signOut({ callbackUrl: '/' })
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                {t(locale, 'auth', 'signOut')}
              </Button>
            ) : (
              <Button
                className="w-full justify-center"
                onClick={() => {
                  void signIn('github', { callbackUrl: '/' })
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <Github className="size-4" />
                {t(locale, 'auth', 'signInWithGitHub')}
              </Button>
            )}
          </div>
        </footer>
      </div>
    </aside>
  )
}
