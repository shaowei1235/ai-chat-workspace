'use client'

import { useState } from 'react'
import { t, type Locale } from '@/i18n/messages'
import { AppShellMain } from '@/components/app-shell-main'
import { AppShellSidebar } from '@/components/app-shell-sidebar'
import type { Chat, ChatMessage, ChatSummary } from '@/types/chat'

type AppShellProps = {
  initialChatListError: string | null
  initialChatLoadError: string | null
  initialChatSummaries: ChatSummary[]
  initialCurrentChat: Chat | null
  locale: Locale
}

type ChatsResponse = {
  chats: ChatSummary[]
}

type ChatResponse = {
  chat: Chat
}

type ErrorResponse = {
  error?: string
}

const LOCAL_REQUEST_ERROR_LOG = '获取 AI 流式回复失败'
const LOCAL_STREAM_PARSE_ERROR = '流式响应解析失败'

class AppShellRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null = null,
  ) {
    super(message)
  }
}

function sortChatSummaries(chats: ChatSummary[]) {
  return [...chats].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )
}

export function AppShell({
  initialChatListError,
  initialChatLoadError,
  initialChatSummaries,
  initialCurrentChat,
  locale,
}: AppShellProps) {
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
  const [requestError, setRequestError] = useState<string | null>(null)

  const isGenerating = generatingChatId !== null
  const isCurrentChatGenerating =
    currentChat !== null && currentChat.id === generatingChatId

  // 统一处理前端 fetch 返回：成功时解析 JSON，失败时转换成带状态码的错误对象。
  async function readJson<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorCode: string | null = null

      try {
        const body = (await response.json()) as ErrorResponse
        errorCode = typeof body.error === 'string' ? body.error : null
      } catch {
        errorCode = null
      }

      throw new AppShellRequestError(
        `请求失败: ${response.status}`,
        response.status,
        errorCode,
      )
    }

    return (await response.json()) as T
  }

  // 从数据库重新拉取 sidebar 的 chat 列表，并按最近更新时间重新排序。
  async function refreshChatList() {
    const response = await fetch('/api/chats', {
      method: 'GET',
      cache: 'no-store',
    })
    const data = await readJson<ChatsResponse>(response)

    setChatSummaries(sortChatSummaries(data.chats))
    setChatListError(null)

    return data.chats
  }

  // 读取某个 chat 的完整内容，用于主区域显示消息列表。
  async function loadChat(chatId: string) {
    const response = await fetch(`/api/chats/${chatId}`, {
      method: 'GET',
      cache: 'no-store',
    })
    const data = await readJson<ChatResponse>(response)

    setCurrentChatId(chatId)
    setCurrentChat(data.chat)
    setChatLoadError(null)

    return data.chat
  }

  // 当 sidebar 列表读取失败时，给“重试”按钮使用的最小恢复动作。
  async function handleRetryChatList() {
    try {
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
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${t(locale, 'sidebar', 'newChatDefaultTitle')} ${chatSummaries.length + 1}`,
        }),
      })
      const data = await readJson<ChatResponse>(response)

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
      setRequestError(null)
    } catch (error) {
      console.error('创建数据库对话失败', error)
      setChatListError(t(locale, 'sidebar', 'loadErrorDescription'))
    }
  }

  // 切换当前会话：读取目标 chat 的数据库内容，并处理它不存在或加载失败的情况。
  async function handleSelectChat(chatId: string) {
    try {
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
  ) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId, content }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`聊天请求失败: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let nextContent = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const eventChunks = buffer.split('\n\n')
      buffer = eventChunks.pop() ?? ''

      for (const chunk of eventChunks) {
        const lines = chunk.split('\n')
        const eventName = lines
          .find((line) => line.startsWith('event: '))
          ?.slice(7)
          .trim()
        const data = lines
          .filter((line) => line.startsWith('data: '))
          .map((line) => line.slice(6))
          .join('\n')

        if (!eventName) {
          continue
        }

        if (eventName === 'delta') {
          nextContent += data
          updateAssistantMessageContent(chatId, assistantMessageId, nextContent)
        }

        if (eventName === 'error') {
          throw new Error(data || LOCAL_STREAM_PARSE_ERROR)
        }

        if (eventName === 'done') {
          return
        }
      }
    }
  }

  // 发送消息的主入口：先做本地 UI 占位，再请求服务端写 user message、生成 assistant，并在失败时恢复状态。
  async function handleSendMessage() {
    const trimmedValue = inputValue.trim()

    if (!currentChatId || !currentChat || trimmedValue.length === 0 || isGenerating) {
      return
    }

    const targetChatId = currentChatId
    const previousChatSnapshot = currentChat
    const previousChatSummaries = chatSummaries
    const now = new Date().toISOString()
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
                updatedAt: now,
              }
            : chat,
        ),
      ),
    )

    setRequestError(null)
    setChatLoadError(null)
    setGeneratingChatId(targetChatId)
    setGeneratingMessageId(assistantMessageId)
    setInputValue('')

    try {
      await streamAssistantReply(targetChatId, trimmedValue, assistantMessageId)
      await Promise.all([refreshChatList(), loadChat(targetChatId)])
    } catch (error) {
      console.error(LOCAL_REQUEST_ERROR_LOG, error)
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
      setGeneratingChatId(null)
      setGeneratingMessageId(null)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      <AppShellSidebar
        chatListError={chatListError}
        chats={chatSummaries}
        currentChatId={currentChatId}
        locale={locale}
        onCreateChat={handleCreateChat}
        onRetryChatList={handleRetryChatList}
        onSelectChat={handleSelectChat}
      />
      <AppShellMain
        chatLoadError={chatLoadError}
        currentChat={currentChat}
        generatingMessageId={generatingMessageId}
        inputValue={inputValue}
        isCurrentChatGenerating={isCurrentChatGenerating}
        isGenerating={isGenerating}
        locale={locale}
        onRetryCurrentChat={handleRetryCurrentChat}
        requestError={requestError}
        onInputChange={handleInputChange}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
