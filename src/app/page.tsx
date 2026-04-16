import { AppShell } from '@/components/app-shell'
import { getChatById, listChatSummaries } from '@/features/chat/chat-data'
import { getLocale } from '@/i18n/get-locale'
import { t } from '@/i18n/messages'
import type { Chat, ChatSummary } from '@/types/chat'

export default async function Home() {
  const locale = await getLocale()
  let chats: ChatSummary[] = []
  let initialCurrentChat: Chat | null = null
  let initialChatListError: string | null = null
  let initialChatLoadError: string | null = null

  try {
    chats = await listChatSummaries()
  } catch (error) {
    console.error('首页读取对话列表失败', error)
    initialChatListError = t(locale, 'sidebar', 'loadErrorDescription')
  }

  if (chats.length > 0) {
    try {
      initialCurrentChat = await getChatById(chats[0].id)
    } catch (error) {
      console.error('首页读取当前对话失败', error)
      initialChatLoadError = t(locale, 'emptyState', 'chatLoadErrorMessage')
    }
  }

  return (
    <AppShell
      initialChatListError={initialChatListError}
      initialChatLoadError={initialChatLoadError}
      initialChatSummaries={chats}
      initialCurrentChat={initialCurrentChat}
      locale={locale}
    />
  )
}
