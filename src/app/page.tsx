import { AppShell } from '@/components/app-shell'
import { getChatById, listChatSummaries } from '@/features/chat/chat-data'
import { getLocale } from '@/i18n/get-locale'
import { t } from '@/i18n/messages'
import { resolveViewer } from '@/lib/viewer'
import type { Chat, ChatSummary } from '@/types/chat'

export default async function Home() {
  const locale = await getLocale()
  const { authUser, owner } = await resolveViewer()
  let chats: ChatSummary[] = []
  let initialCurrentChat: Chat | null = null
  let initialChatListError: string | null = null
  let initialChatLoadError: string | null = null

  try {
    chats = await listChatSummaries(owner)
  } catch (error) {
    console.error('首页读取对话列表失败', error)
    initialChatListError = t(locale, 'sidebar', 'loadErrorDescription')
  }

  if (chats.length > 0) {
    try {
      initialCurrentChat = await getChatById(chats[0].id, owner)
    } catch (error) {
      console.error('首页读取当前对话失败', error)
      initialChatLoadError = t(locale, 'emptyState', 'chatLoadErrorMessage')
    }
  }

  return (
    <AppShell
      authUser={authUser}
      initialChatListError={initialChatListError}
      initialChatLoadError={initialChatLoadError}
      initialChatSummaries={chats}
      initialCurrentChat={initialCurrentChat}
      locale={locale}
    />
  )
}
