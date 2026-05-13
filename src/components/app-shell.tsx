'use client'

import type { Locale } from '@/i18n/messages'
import { AppShellMain } from '@/components/app-shell-main'
import { AppShellSidebar } from '@/components/app-shell-sidebar'
import { useAppShellController } from '@/features/chat/use-app-shell-controller'
import type { AuthUser } from '@/types/auth'
import type { Chat, ChatSummary } from '@/types/chat'

type AppShellProps = {
  authUser: AuthUser | null
  initialChatListError: string | null
  initialChatLoadError: string | null
  initialChatSummaries: ChatSummary[]
  initialCurrentChat: Chat | null
  locale: Locale
}

export function AppShell({
  authUser,
  initialChatListError,
  initialChatLoadError,
  initialChatSummaries,
  initialCurrentChat,
  locale,
}: AppShellProps) {
  const {
    chatActionError,
    chatListError,
    chatLoadError,
    chatSummaries,
    clearSearch,
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
    handleSearchQueryChange,
    handleSelectChat,
    handleSendMessage,
    handleStopGenerating,
    inputValue,
    isCurrentChatGenerating,
    isGenerating,
    isGuestLimitReached,
    isGuestUsageLoading,
    isSearchLoading,
    isSearchMode,
    requestError,
    searchError,
    searchQuery,
    searchResults,
  } = useAppShellController({
    authUser,
    initialChatListError,
    initialChatLoadError,
    initialChatSummaries,
    initialCurrentChat,
    locale,
  })

  return (
    <div className="flex min-h-dvh flex-col bg-background md:h-dvh md:flex-row md:overflow-hidden">
      <AppShellSidebar
        authUser={authUser}
        chatActionError={chatActionError}
        chatListError={chatListError}
        chats={chatSummaries}
        isSearchLoading={isSearchLoading}
        isSearchMode={isSearchMode}
        currentChatId={currentChatId}
        locale={locale}
        onCreateChat={handleCreateChat}
        onClearSearch={clearSearch}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onRetryChatList={handleRetryChatList}
        onSearchQueryChange={handleSearchQueryChange}
        onSelectChat={handleSelectChat}
        searchError={searchError}
        searchQuery={searchQuery}
        searchResults={searchResults}
      />
      <AppShellMain
        authUser={authUser}
        chatLoadError={chatLoadError}
        currentChat={currentChat}
        generatingMessageId={generatingMessageId}
        guestLimit={guestUsage.limit}
        guestRemainingCount={guestUsage.remainingCount}
        inputValue={inputValue}
        isGuestLimitReached={isGuestLimitReached}
        isGuestUsageLoading={isGuestUsageLoading}
        isCurrentChatGenerating={isCurrentChatGenerating}
        isGenerating={isGenerating}
        locale={locale}
        onRetryCurrentChat={handleRetryCurrentChat}
        requestError={requestError}
        onInputChange={handleInputChange}
        onRegenerateResponse={handleRegenerateResponse}
        onSendMessage={handleSendMessage}
        onStopGenerating={handleStopGenerating}
      />
    </div>
  )
}
