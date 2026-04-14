import { NextResponse } from 'next/server'
import { createChat, listChatSummaries } from '@/features/chat/chat-data'

type CreateChatBody = {
  title?: string
}

export async function GET() {
  try {
    const chats = await listChatSummaries()

    return NextResponse.json({ chats })
  } catch (error) {
    console.error('读取对话列表失败', error)

    return NextResponse.json({ error: 'CHAT_LIST_FAILED' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateChatBody

    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json({ error: 'INVALID_CHAT_TITLE' }, { status: 400 })
    }

    const chat = await createChat(body.title.trim())

    return NextResponse.json({ chat }, { status: 201 })
  } catch (error) {
    console.error('创建对话失败', error)

    return NextResponse.json({ error: 'CHAT_CREATE_FAILED' }, { status: 500 })
  }
}
