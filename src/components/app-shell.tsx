'use client'

import { useState } from 'react'
import { t, type Locale } from '@/i18n/messages'
import { AppShellMain } from '@/components/app-shell-main'
import { AppShellSidebar } from '@/components/app-shell-sidebar'
import type { Chat, ChatMessage } from '@/types/chat'

type AppShellProps = {
  locale: Locale
}

export function AppShell({ locale }: AppShellProps) {
  // Keep local state in the shell so Sidebar and Main read from the same source of truth.
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')

  const currentChat = chats.find((chat) => chat.id === currentChatId) ?? null

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

  function handleSendMessage() {
    const trimmedValue = inputValue.trim()

    if (!currentChatId || trimmedValue.length === 0) {
      return
    }

    const nextMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedValue,
      createdAt: new Date().toISOString(),
    }

    setChats((previousChats) =>
      previousChats.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, nextMessage],
            }
          : chat,
      ),
    )
    setInputValue('')
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
        locale={locale}
        onInputChange={handleInputChange}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
