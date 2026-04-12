'use client'

import { useEffect, useRef, useState } from 'react'
import { t, type Locale } from '@/i18n/messages'
import { AppShellMain } from '@/components/app-shell-main'
import { AppShellSidebar } from '@/components/app-shell-sidebar'
import type { Chat, ChatMessage } from '@/types/chat'

type AppShellProps = {
  locale: Locale
}

const LOCAL_REQUEST_ERROR_LOG = '获取 AI 回复失败'

export function AppShell({ locale }: AppShellProps) {
  // Keep local state in the shell so Sidebar and Main read from the same source of truth.
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [generatingChatId, setGeneratingChatId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [requestError, setRequestError] = useState<string | null>(null)
  const pendingDelayRef = useRef<number | null>(null)

  const currentChat = chats.find((chat) => chat.id === currentChatId) ?? null
  const isGenerating = generatingChatId !== null
  const isCurrentChatGenerating =
    currentChat !== null && currentChat.id === generatingChatId

  useEffect(() => {
    return () => {
      if (pendingDelayRef.current !== null) {
        window.clearTimeout(pendingDelayRef.current)
      }
    }
  }, [])

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

  async function waitForPendingDelay() {
    await new Promise<void>((resolve) => {
      pendingDelayRef.current = window.setTimeout(() => {
        pendingDelayRef.current = null
        resolve()
      }, 300)
    })
  }

  async function requestAssistantReply(messages: ChatMessage[]) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    })

    if (!response.ok) {
      throw new Error(`聊天请求失败: ${response.status}`)
    }

    const data = (await response.json()) as {
      content?: string
    }

    if (!data.content) {
      throw new Error('聊天接口未返回内容')
    }

    return data.content
  }

  async function handleSendMessage() {
    const trimmedValue = inputValue.trim()

    if (!currentChatId || trimmedValue.length === 0 || isGenerating) {
      return
    }

    const targetChatId = currentChatId
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedValue,
      createdAt: new Date().toISOString(),
    }

    let nextMessagesForRequest: ChatMessage[] = []

    setChats((previousChats) =>
      previousChats.map((chat) => {
        if (chat.id !== targetChatId) {
          return chat
        }

        nextMessagesForRequest = [...chat.messages, userMessage]

        return {
          ...chat,
          messages: nextMessagesForRequest,
        }
      }),
    )

    setRequestError(null)
    setGeneratingChatId(targetChatId)
    setInputValue('')

    try {
      await waitForPendingDelay()

      const assistantContent = await requestAssistantReply(nextMessagesForRequest)
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        createdAt: new Date().toISOString(),
      }

      setChats((previousChats) =>
        previousChats.map((chat) =>
          chat.id === targetChatId
            ? {
                ...chat,
                messages: [...chat.messages, assistantMessage],
              }
            : chat,
        ),
      )
    } catch (error) {
      console.error(LOCAL_REQUEST_ERROR_LOG, error)
      setRequestError(t(locale, 'emptyState', 'requestErrorMessage'))
    } finally {
      setGeneratingChatId(null)
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
