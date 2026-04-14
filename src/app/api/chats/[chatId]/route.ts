import { NextResponse } from 'next/server'
import { getChatById } from '@/features/chat/chat-data'

type ChatRouteContext = {
  params: Promise<{
    chatId: string
  }>
}

export async function GET(_request: Request, context: ChatRouteContext) {
  try {
    const { chatId } = await context.params
    const chat = await getChatById(chatId)

    if (!chat) {
      return NextResponse.json({ error: 'CHAT_NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json({ chat })
  } catch (error) {
    console.error('读取当前对话失败', error)

    return NextResponse.json({ error: 'CHAT_FETCH_FAILED' }, { status: 500 })
  }
}
