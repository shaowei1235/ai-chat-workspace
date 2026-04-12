'use client'

import { useEffect, useRef, useState } from 'react'
import { t, type Locale } from '@/i18n/messages'
import { AppShellMain } from '@/components/app-shell-main'
import { AppShellSidebar } from '@/components/app-shell-sidebar'
import type { Chat, ChatMessage } from '@/types/chat'

type AppShellProps = {
  locale: Locale
}

const LOCAL_ASSISTANT_REPLY_PREFIX =
  '这是一个本地假回复，用来占位未来的 AI 输出：'
const LOCAL_ASSISTANT_REPLY_SUFFIX = '后续步骤会把这里替换成真实模型返回内容。'

export function AppShell({ locale }: AppShellProps) {
  // Keep local state in the shell so Sidebar and Main read from the same source of truth.
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [generatingChatId, setGeneratingChatId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const replyTimerRef = useRef<number | null>(null)

  const currentChat = chats.find((chat) => chat.id === currentChatId) ?? null
  const isGenerating = generatingChatId !== null
  const isCurrentChatGenerating =
    currentChat !== null && currentChat.id === generatingChatId

  useEffect(() => {
    return () => {
      if (replyTimerRef.current !== null) {
        window.clearTimeout(replyTimerRef.current)
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
  }

  function handleSelectChat(chatId: string) {
    setCurrentChatId(chatId)
  }

  function handleInputChange(nextValue: string) {
    setInputValue(nextValue)
  }

  function buildAssistantReply(userInput: string) {
    return [
      LOCAL_ASSISTANT_REPLY_PREFIX,
      `“${userInput}”`,
      LOCAL_ASSISTANT_REPLY_SUFFIX,
    ].join(' ')
  }

  function handleSendMessage() {
    const trimmedValue = inputValue.trim()

    if (!currentChatId || trimmedValue.length === 0 || isGenerating) {
      return
    }

    const targetChatId = currentChatId

    const nextMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedValue,
      createdAt: new Date().toISOString(),
    }

    setChats((previousChats) =>
      previousChats.map((chat) =>
        chat.id === targetChatId
          ? {
              ...chat,
              messages: [...chat.messages, nextMessage],
            }
          : chat,
      ),
    )
    setGeneratingChatId(targetChatId)
    setInputValue('')

    // Simulate the time gap between sending a user message and receiving an AI reply.
    replyTimerRef.current = window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: buildAssistantReply(trimmedValue),
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
      setGeneratingChatId(null)
      replyTimerRef.current = null
    }, 900)
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
        isCurrentChatGenerating={isCurrentChatGenerating}
        isGenerating={isGenerating}
        inputValue={inputValue}
        locale={locale}
        onInputChange={handleInputChange}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
