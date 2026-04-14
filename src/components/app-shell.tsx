'use client'

import { useState } from 'react'
import { t, type Locale } from '@/i18n/messages'
import { AppShellMain } from '@/components/app-shell-main'
import { AppShellSidebar } from '@/components/app-shell-sidebar'
import type { Chat, ChatMessage, ChatSummary } from '@/types/chat'

type AppShellProps = {
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

const LOCAL_REQUEST_ERROR_LOG = '获取 AI 流式回复失败'
const LOCAL_STREAM_PARSE_ERROR = '流式响应解析失败'

function sortChatSummaries(chats: ChatSummary[]) {
  return [...chats].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )
}

export function AppShell({
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
  const [requestError, setRequestError] = useState<string | null>(null)

  const isGenerating = generatingChatId !== null
  const isCurrentChatGenerating =
    currentChat !== null && currentChat.id === generatingChatId

  async function readJson<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }

    return (await response.json()) as T
  }

  async function refreshChatList() {
    const response = await fetch('/api/chats', {
      method: 'GET',
      cache: 'no-store',
    })
    const data = await readJson<ChatsResponse>(response)

    setChatSummaries(sortChatSummaries(data.chats))
  }

  async function loadChat(chatId: string) {
    const response = await fetch(`/api/chats/${chatId}`, {
      method: 'GET',
      cache: 'no-store',
    })
    const data = await readJson<ChatResponse>(response)

    setCurrentChatId(chatId)
    setCurrentChat(data.chat)
  }

  function handleInputChange(nextValue: string) {
    setInputValue(nextValue)
  }

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
      setRequestError(null)
    } catch (error) {
      console.error('创建数据库对话失败', error)
      setRequestError(t(locale, 'emptyState', 'requestErrorMessage'))
    }
  }

  async function handleSelectChat(chatId: string) {
    try {
      setRequestError(null)
      await loadChat(chatId)
    } catch (error) {
      console.error('加载数据库对话失败', error)
      setRequestError(t(locale, 'emptyState', 'requestErrorMessage'))
    }
  }

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

  function finalizeAssistantMessageAsError(
    targetChatId: string,
    assistantMessageId: string,
  ) {
    updateAssistantMessageContent(
      targetChatId,
      assistantMessageId,
      t(locale, 'emptyState', 'requestErrorMessage'),
    )
  }

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

  async function handleSendMessage() {
    const trimmedValue = inputValue.trim()

    if (!currentChatId || !currentChat || trimmedValue.length === 0 || isGenerating) {
      return
    }

    const targetChatId = currentChatId
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
    setGeneratingChatId(targetChatId)
    setGeneratingMessageId(assistantMessageId)
    setInputValue('')

    try {
      await streamAssistantReply(targetChatId, trimmedValue, assistantMessageId)
      await Promise.all([refreshChatList(), loadChat(targetChatId)])
    } catch (error) {
      console.error(LOCAL_REQUEST_ERROR_LOG, error)
      finalizeAssistantMessageAsError(targetChatId, assistantMessageId)
      setRequestError(t(locale, 'emptyState', 'requestErrorMessage'))
    } finally {
      setGeneratingChatId(null)
      setGeneratingMessageId(null)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      <AppShellSidebar
        chats={chatSummaries}
        currentChatId={currentChatId}
        locale={locale}
        onCreateChat={handleCreateChat}
        onSelectChat={handleSelectChat}
      />
      <AppShellMain
        currentChat={currentChat}
        generatingMessageId={generatingMessageId}
        inputValue={inputValue}
        isCurrentChatGenerating={isCurrentChatGenerating}
        isGenerating={isGenerating}
        locale={locale}
        requestError={requestError}
        onInputChange={handleInputChange}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
