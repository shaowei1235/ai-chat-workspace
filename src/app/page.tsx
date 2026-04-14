import { AppShell } from '@/components/app-shell'
import { getChatById, listChatSummaries } from '@/features/chat/chat-data'
import { getLocale } from '@/i18n/get-locale'

export default async function Home() {
  const locale = await getLocale()
  const chats = await listChatSummaries()
  const initialCurrentChat =
    chats.length > 0 ? await getChatById(chats[0].id) : null

  return (
    <AppShell
      initialChatSummaries={chats}
      initialCurrentChat={initialCurrentChat}
      locale={locale}
    />
  )
}
