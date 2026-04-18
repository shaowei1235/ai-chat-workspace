import { NextResponse } from 'next/server'
import { deleteChat, getChatById, renameChat } from '@/features/chat/chat-data'

const MAX_CHAT_TITLE_LENGTH = 50

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

export async function PATCH(request: Request, context: ChatRouteContext) {
  try {
    const { chatId } = await context.params
    const chat = await getChatById(chatId)

    if (!chat) {
      return NextResponse.json({ error: 'CHAT_NOT_FOUND' }, { status: 404 })
    }

    const body = (await request.json()) as {
      title?: unknown
    }
    const nextTitle =
      typeof body.title === 'string' ? body.title.trim() : ''

    if (nextTitle.length === 0) {
      return NextResponse.json({ error: 'INVALID_CHAT_TITLE' }, { status: 400 })
    }

    if (nextTitle.length > MAX_CHAT_TITLE_LENGTH) {
      return NextResponse.json(
        { error: 'CHAT_TITLE_TOO_LONG' },
        { status: 400 },
      )
    }

    const renamedChat = await renameChat(chatId, nextTitle)

    return NextResponse.json({ chat: renamedChat })
  } catch (error) {
    console.error('重命名对话失败', error)

    return NextResponse.json({ error: 'CHAT_RENAME_FAILED' }, { status: 500 })
  }
}
