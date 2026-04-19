'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { t, type Locale } from '@/i18n/messages'
import {
  AppShellRequestError,
  createChat,
  DEFAULT_GUEST_LIMIT,
  deleteChat,
  fetchChat,
  fetchChatSummaries,
  fetchGuestUsage,
  renameChat,
  type GuestUsageInfo,
} from '@/features/chat/chat-client'
import { consumeAssistantStream } from '@/features/chat/chat-stream'
import {
  createChatTitleFromMessage,
  shouldAutoUpdateChatTitle,
} from '@/features/chat/chat-title'
import type { AuthUser } from '@/types/auth'
import type { Chat, ChatMessage, ChatSummary } from '@/types/chat'

type UseAppShellControllerParams = {
  authUser: AuthUser | null
  initialChatListError: string | null
  initialChatLoadError: string | null
  initialChatSummaries: ChatSummary[]
  initialCurrentChat: Chat | null
  locale: Locale
}

const LOCAL_REQUEST_ERROR_LOG = '获取 AI 流式回复失败'

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

function sortChatSummaries(chats: ChatSummary[]) {
  return [...chats].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )
}

export function useAppShellController({
  authUser,
  initialChatListError,
  initialChatLoadError,
  initialChatSummaries,
  initialCurrentChat,
  locale,
}: UseAppShellControllerParams) {
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>(
    sortChatSummaries(initialChatSummaries),
  )
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    initialCurrentChat?.id ?? initialChatSummaries[0]?.id ?? null,
  )
  const [currentChat, setCurrentChat] = useState<Chat | null>(initialCurrentChat)
  const [generatingChatId, setGeneratingChatId] = useState<string | null>(null)
  const [generatingMessageId, setGeneratingMessageId] = useState<string | null>(
    null,
  )
  const [inputValue, setInputValue] = useState('')
  const [chatListError, setChatListError] = useState<string | null>(
    initialChatListError,
  )
  const [chatLoadError, setChatLoadError] = useState<string | null>(
    initialChatLoadError,
  )
  const [chatActionError, setChatActionError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [guestUsage, setGuestUsage] = useState<GuestUsageInfo>({
    limit: DEFAULT_GUEST_LIMIT,
    remainingCount: DEFAULT_GUEST_LIMIT,
    usedCount: 0,
  })
  const [isGuestUsageLoading, setIsGuestUsageLoading] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  const isGenerating = generatingChatId !== null
  const isCurrentChatGenerating =
    currentChat !== null && currentChat.id === generatingChatId
  const isAuthenticated = authUser !== null
  const isGuestLimitReached =
    !isAuthenticated && guestUsage.remainingCount <= 0

  // 从数据库重新拉取 sidebar 的 chat 列表，并按最近更新时间重新排序。
  async function refreshChatList() {
    const data = await fetchChatSummaries()

    setChatSummaries(sortChatSummaries(data.chats))
    setChatListError(null)

    return data.chats
  }

  const refreshGuestUsage = useCallback(async () => {
    const data = await fetchGuestUsage()

    setGuestUsage(data.guestUsage)
    setIsGuestUsageLoading(false)

    return data.guestUsage
  }, [])

  // 读取某个 chat 的完整内容，用于主区域显示消息列表。
  async function loadChat(chatId: string) {
    const data = await fetchChat(chatId)

    setCurrentChatId(chatId)
    setCurrentChat(data.chat)
    setChatLoadError(null)

    return data.chat
  }

  useEffect(() => {
    if (isAuthenticated) {
      setIsGuestUsageLoading(false)
      return
    }

    void refreshGuestUsage().catch(() => {
      setIsGuestUsageLoading(false)
    })
  }, [isAuthenticated, refreshGuestUsage])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  // 当 sidebar 列表读取失败时，给“重试”按钮使用的最小恢复动作。
  async function handleRetryChatList() {
    try {
      setChatActionError(null)
      await refreshChatList()
    } catch (error) {
      console.error('重试加载对话列表失败', error)
      setChatListError(t(locale, 'sidebar', 'loadErrorDescription'))
    }
  }

  // 当前 chat 不可用时，尝试回退到一个仍然存在的 chat；如果一个都没有，就回到空状态。
  async function syncFallbackChat(preferredChatId?: string) {
    const chats = await refreshChatList()
    const fallbackChatId =
      chats.find((chat) => chat.id === preferredChatId)?.id ??
      chats[0]?.id ??
      null

    if (!fallbackChatId) {
      setCurrentChatId(null)
      setCurrentChat(null)

      return null
    }

    return loadChat(fallbackChatId)
  }

  // 当前 chat 读取失败后的重试入口，同时处理“chat 已不存在”的回退逻辑。
  async function handleRetryCurrentChat() {
    const retryChatId = currentChatId ?? chatSummaries[0]?.id ?? null

    if (!retryChatId) {
      try {
        await syncFallbackChat()
      } catch (error) {
        console.error('重试恢复当前对话失败', error)
        setChatLoadError(t(locale, 'emptyState', 'chatLoadErrorMessage'))
      }

      return
    }

    try {
      await loadChat(retryChatId)
    } catch (error) {
      if (
        error instanceof AppShellRequestError &&
        error.status === 404
      ) {
        try {
          await syncFallbackChat()
          setChatLoadError(t(locale, 'emptyState', 'chatMissingMessage'))
        } catch (fallbackError) {
          console.error('重试后回退对话失败', fallbackError)
          setChatLoadError(t(locale, 'emptyState', 'chatLoadErrorMessage'))
        }

        return
      }

      console.error('重试加载当前对话失败', error)
      setChatLoadError(t(locale, 'emptyState', 'chatLoadErrorMessage'))
    }
  }

  // 保持输入框为受控组件：把用户输入同步到本地状态里。
  function handleInputChange(nextValue: string) {
    setInputValue(nextValue)
  }

  // 新建对话：先请求服务端写数据库，再把返回的 chat 同步到当前界面。
  async function handleCreateChat() {
    try {
      const data = await createChat(
        `${t(locale, 'sidebar', 'newChatDefaultTitle')} ${chatSummaries.length + 1}`,
      )

      setCurrentChatId(data.chat.id)
      setCurrentChat(data.chat)
      setChatSummaries((previousChats) =>
        sortChatSummaries([
          {
            id: data.chat.id,
            title: data.chat.title,
            createdAt: data.chat.createdAt,
            updatedAt: data.chat.updatedAt,
          },
          ...previousChats.filter((chat) => chat.id !== data.chat.id),
        ]),
      )
      setChatListError(null)
      setChatLoadError(null)
      setChatActionError(null)
      setRequestError(null)
    } catch (error) {
      console.error('创建数据库对话失败', error)
      setChatListError(t(locale, 'sidebar', 'loadErrorDescription'))
    }
  }

  async function handleDeleteChat(chatId: string) {
    const deletedChatIndex = chatSummaries.findIndex((chat) => chat.id === chatId)
    const remainingChats = chatSummaries.filter((chat) => chat.id !== chatId)
    const nextFallbackChatId =
      remainingChats[deletedChatIndex]?.id ??
      remainingChats[deletedChatIndex - 1]?.id ??
      remainingChats[0]?.id ??
      null

    try {
      await deleteChat(chatId)

      setChatSummaries(remainingChats)
      setChatActionError(null)
      setRequestError(null)

      if (chatId !== currentChatId) {
        return
      }

      if (!nextFallbackChatId) {
        setCurrentChatId(null)
        setCurrentChat(null)
        setChatLoadError(null)
        return
      }

      setChatLoadError(null)
      await loadChat(nextFallbackChatId)
    } catch (error) {
      console.error('删除数据库对话失败', error)
      setChatActionError(t(locale, 'sidebar', 'deleteChatError'))
    }
  }

  // 重命名对话：保存成功后，同时同步 sidebar 列表和当前主区域标题。
  async function handleRenameChat(chatId: string, nextTitle: string) {
    try {
      const data = await renameChat(chatId, nextTitle)
      const renamedChat = data.chat

      setChatSummaries((previousChats) =>
        sortChatSummaries(
          previousChats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  title: renamedChat.title,
                  updatedAt: renamedChat.updatedAt,
                }
              : chat,
          ),
        ),
      )
      setCurrentChat((previousChat) =>
        previousChat && previousChat.id === chatId
          ? {
              ...previousChat,
              title: renamedChat.title,
              updatedAt: renamedChat.updatedAt,
            }
          : previousChat,
      )
      setChatActionError(null)
      setChatLoadError(null)
    } catch (error) {
      console.error('重命名数据库对话失败', error)
      throw error
    }
  }

  // 切换当前会话：读取目标 chat 的数据库内容，并处理它不存在或加载失败的情况。
  async function handleSelectChat(chatId: string) {
    try {
      setChatActionError(null)
      setRequestError(null)
      setChatLoadError(null)
      await loadChat(chatId)
    } catch (error) {
      if (
        error instanceof AppShellRequestError &&
        error.status === 404
      ) {
        try {
          await syncFallbackChat()
          setChatLoadError(t(locale, 'emptyState', 'chatMissingMessage'))
        } catch (fallbackError) {
          console.error('回退到可用对话失败', fallbackError)
          setChatLoadError(t(locale, 'emptyState', 'chatLoadErrorMessage'))
        }

        return
      }

      console.error('加载数据库对话失败', error)
      setChatLoadError(t(locale, 'emptyState', 'chatLoadErrorMessage'))
    }
  }

  // streaming 过程中，不断把增量内容写回同一条 assistant 占位消息。
  function updateAssistantMessageContent(
    targetChatId: string,
    assistantMessageId: string,
    content: string,
  ) {
    setCurrentChat((previousChat) => {
      if (!previousChat || previousChat.id !== targetChatId) {
        return previousChat
      }

      return {
        ...previousChat,
        messages: previousChat.messages.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content,
              }
            : message,
        ),
      }
    })
  }

  // 调用聊天接口并消费 SSE 流，把服务端不断返回的 delta 逐步拼到 assistant 消息上。
  async function streamAssistantReply(
    chatId: string,
    content: string,
    assistantMessageId: string,
    signal: AbortSignal,
    mode: 'send' | 'regenerate' = 'send',
  ) {
    await consumeAssistantStream({
      chatId,
      content,
      mode,
      signal,
      onDelta: (nextContent) => {
        updateAssistantMessageContent(chatId, assistantMessageId, nextContent)
      },
      onGuestUsage: (nextGuestUsage) => {
        setGuestUsage(nextGuestUsage)
      },
    })
  }

  // 用户主动停止当前 streaming：只中断请求，不回滚已生成内容。
  function handleStopGenerating() {
    abortControllerRef.current?.abort()
  }

  // 重新生成只处理最后一轮：最后一条 assistant 会被新流式结果替换。
  async function handleRegenerateResponse() {
    if (!currentChat || !currentChatId || isGenerating) {
      return
    }

    const lastMessage = currentChat.messages[currentChat.messages.length - 1]
    const lastUserMessage = currentChat.messages[currentChat.messages.length - 2]

    if (
      !lastMessage ||
      !lastUserMessage ||
      lastMessage.role !== 'assistant' ||
      lastUserMessage.role !== 'user'
    ) {
      return
    }

    const targetChatId = currentChatId
    const previousChatSnapshot = currentChat
    const previousChatSummaries = chatSummaries
    const assistantMessageId = crypto.randomUUID()
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }

    setCurrentChat((previousChat) => {
      if (!previousChat || previousChat.id !== targetChatId) {
        return previousChat
      }

      return {
        ...previousChat,
        messages: [...previousChat.messages.slice(0, -1), assistantPlaceholder],
      }
    })

    setRequestError(null)
    setChatActionError(null)
    setChatLoadError(null)
    setGeneratingChatId(targetChatId)
    setGeneratingMessageId(assistantMessageId)

    try {
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      await streamAssistantReply(
        targetChatId,
        lastUserMessage.content,
        assistantMessageId,
        abortController.signal,
        'regenerate',
      )
      await Promise.all([refreshChatList(), loadChat(targetChatId)])
    } catch (error) {
      if (isAbortError(error)) {
        setRequestError(null)

        try {
          await Promise.all([refreshChatList(), loadChat(targetChatId)])
        } catch (syncError) {
          console.error('停止重新生成后的数据库同步失败', syncError)
        }

        return
      }

      console.error('重新生成 AI 回复失败', error)
      setRequestError(t(locale, 'emptyState', 'requestErrorMessage'))

      try {
        await Promise.all([refreshChatList(), loadChat(targetChatId)])
      } catch (syncError) {
        if (
          syncError instanceof AppShellRequestError &&
          syncError.status === 404
        ) {
          try {
            await syncFallbackChat()
            setChatLoadError(t(locale, 'emptyState', 'chatMissingMessage'))
          } catch (fallbackError) {
            console.error('重新生成失败后的对话回退失败', fallbackError)
            setCurrentChat(previousChatSnapshot)
            setChatSummaries(previousChatSummaries)
            setChatLoadError(t(locale, 'emptyState', 'chatLoadErrorMessage'))
          }
        } else {
          console.error('重新生成失败后的数据库同步失败', syncError)
          setCurrentChat(previousChatSnapshot)
          setChatSummaries(previousChatSummaries)
        }
      }
    } finally {
      abortControllerRef.current = null
      setGeneratingChatId(null)
      setGeneratingMessageId(null)
    }
  }

  // 发送消息的主入口：先做本地 UI 占位，再请求服务端写 user message、生成 assistant，并在失败时恢复状态。
  async function handleSendMessage() {
    const trimmedValue = inputValue.trim()

    if (
      !currentChatId ||
      !currentChat ||
      trimmedValue.length === 0 ||
      isGenerating ||
      isGuestLimitReached
    ) {
      return
    }

    const targetChatId = currentChatId
    const previousChatSnapshot = currentChat
    const previousChatSummaries = chatSummaries
    const now = new Date().toISOString()
    const nextChatTitle = shouldAutoUpdateChatTitle({
      currentTitle: currentChat.title,
      existingMessageCount: currentChat.messages.length,
      firstUserMessageContent: trimmedValue,
    })
      ? createChatTitleFromMessage(trimmedValue)
      : null
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedValue,
      createdAt: now,
    }
    const assistantMessageId = crypto.randomUUID()
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }

    setCurrentChat((previousChat) => {
      if (!previousChat || previousChat.id !== targetChatId) {
        return previousChat
      }

      return {
        ...previousChat,
        ...(nextChatTitle
          ? {
              title: nextChatTitle,
            }
          : {}),
        updatedAt: now,
        messages: [...previousChat.messages, userMessage, assistantPlaceholder],
      }
    })
    setChatSummaries((previousChats) =>
      sortChatSummaries(
        previousChats.map((chat) =>
          chat.id === targetChatId
            ? {
                ...chat,
                ...(nextChatTitle
                  ? {
                      title: nextChatTitle,
                    }
                  : {}),
                updatedAt: now,
              }
            : chat,
        ),
      ),
    )

    setRequestError(null)
    setChatActionError(null)
    setChatLoadError(null)
    setGeneratingChatId(targetChatId)
    setGeneratingMessageId(assistantMessageId)
    setInputValue('')

    try {
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      await streamAssistantReply(
        targetChatId,
        trimmedValue,
        assistantMessageId,
        abortController.signal,
        'send',
      )
      await Promise.all([refreshChatList(), loadChat(targetChatId)])
    } catch (error) {
      if (isAbortError(error)) {
        setRequestError(null)
        return
      }

      console.error(LOCAL_REQUEST_ERROR_LOG, error)
      if (
        error instanceof AppShellRequestError &&
        error.code === 'GUEST_LIMIT_REACHED'
      ) {
        if (error.guestUsage) {
          setGuestUsage(error.guestUsage)
        }
        setRequestError(t(locale, 'emptyState', 'guestUsageReachedDescription'))
      } else {
        setRequestError(t(locale, 'emptyState', 'requestErrorMessage'))
      }

      try {
        await Promise.all([refreshChatList(), loadChat(targetChatId)])
      } catch (syncError) {
        if (
          syncError instanceof AppShellRequestError &&
          syncError.status === 404
        ) {
          try {
            await syncFallbackChat()
            setChatLoadError(t(locale, 'emptyState', 'chatMissingMessage'))
          } catch (fallbackError) {
            console.error('消息发送失败后的对话回退失败', fallbackError)
            setCurrentChat(previousChatSnapshot)
            setChatSummaries(previousChatSummaries)
            setChatLoadError(t(locale, 'emptyState', 'chatLoadErrorMessage'))
            setInputValue(trimmedValue)
          }
        } else {
          console.error('消息发送失败后的数据库同步失败', syncError)
          setCurrentChat(previousChatSnapshot)
          setChatSummaries(previousChatSummaries)
          setInputValue(trimmedValue)
        }
      }
    } finally {
      abortControllerRef.current = null
      setGeneratingChatId(null)
      setGeneratingMessageId(null)
    }
  }

  return {
    chatActionError,
    chatListError,
    chatLoadError,
    chatSummaries,
    currentChat,
    currentChatId,
    generatingMessageId,
    guestUsage,
    handleCreateChat,
    handleDeleteChat,
    handleInputChange,
    handleRenameChat,
    handleRegenerateResponse,
    handleRetryChatList,
    handleRetryCurrentChat,
    handleSelectChat,
    handleSendMessage,
    handleStopGenerating,
    inputValue,
    isCurrentChatGenerating,
    isGenerating,
    isGuestLimitReached,
    isGuestUsageLoading,
    requestError,
  }
}
