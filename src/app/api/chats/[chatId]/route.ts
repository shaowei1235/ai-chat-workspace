import { NextResponse } from 'next/server'
import { deleteChat, getChatById } from '@/features/chat/chat-data'

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

export async function DELETE(_request: Request, context: ChatRouteContext) {
  try {
    const { chatId } = await context.params
    const chat = await getChatById(chatId)

    if (!chat) {
      return NextResponse.json({ error: 'CHAT_NOT_FOUND' }, { status: 404 })
    }

    await deleteChat(chatId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除对话失败', error)

    return NextResponse.json({ error: 'CHAT_DELETE_FAILED' }, { status: 500 })
  }
}
