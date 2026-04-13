'use client'

import { useState } from 'react'
import { t, type Locale } from '@/i18n/messages'
import { AppShellMain } from '@/components/app-shell-main'
import { AppShellSidebar } from '@/components/app-shell-sidebar'
import type { Chat, ChatMessage } from '@/types/chat'

type AppShellProps = {
  locale: Locale
}

const LOCAL_REQUEST_ERROR_LOG = '获取 AI 流式回复失败'
const LOCAL_STREAM_PARSE_ERROR = '流式响应解析失败'

export function AppShell({ locale }: AppShellProps) {
  // Keep local state in the shell so Sidebar and Main read from the same source of truth.
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [generatingChatId, setGeneratingChatId] = useState<string | null>(null)
  const [generatingMessageId, setGeneratingMessageId] = useState<string | null>(
    null,
  )
  const [inputValue, setInputValue] = useState('')
  const [requestError, setRequestError] = useState<string | null>(null)

  const currentChat = chats.find((chat) => chat.id === currentChatId) ?? null
  const isGenerating = generatingChatId !== null
  const isCurrentChatGenerating =
    currentChat !== null && currentChat.id === generatingChatId

  function handleCreateChat() {
    const createdChat: Chat = {
      id: crypto.randomUUID(),
      title: `${t(locale, 'sidebar', 'newChatDefaultTitle')} ${chats.length + 1}`,
      createdAt: new Date().toISOString(),
      messages: [],
    }

    setChats((previousChats) => [createdChat, ...previousChats])
    setCurrentChatId(createdChat.id)
    setRequestError(null)
  }

  function handleSelectChat(chatId: string) {
    setCurrentChatId(chatId)
    setRequestError(null)
  }

  function handleInputChange(nextValue: string) {
    setInputValue(nextValue)
  }

  function updateAssistantMessageContent(
    targetChatId: string,
    assistantMessageId: string,
    content: string,
  ) {
    setChats((previousChats) =>
      previousChats.map((chat) =>
        chat.id === targetChatId
          ? {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === assistantMessageId
                  ? {
                      ...message,
                      content,
                    }
                  : message,
              ),
            }
          : chat,
      ),
    )
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
    messages: ChatMessage[],
    targetChatId: string,
    assistantMessageId: string,
  ) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
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
          updateAssistantMessageContent(
            targetChatId,
            assistantMessageId,
            nextContent,
          )
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
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedValue,
      createdAt: new Date().toISOString(),
    }
    const assistantMessageId = crypto.randomUUID()
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }
    const nextMessagesForRequest: ChatMessage[] = [
      ...currentChat.messages,
      userMessage,
    ]

    setChats((previousChats) =>
      previousChats.map((chat) => {
        if (chat.id !== targetChatId) {
          return chat
        }

        return {
          ...chat,
          messages: [...nextMessagesForRequest, assistantPlaceholder],
        }
      }),
    )

    setRequestError(null)
    setGeneratingChatId(targetChatId)
    setGeneratingMessageId(assistantMessageId)
    setInputValue('')

    try {
      await streamAssistantReply(
        nextMessagesForRequest,
        targetChatId,
        assistantMessageId,
      )
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
        chats={chats}
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
