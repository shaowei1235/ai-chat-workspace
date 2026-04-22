import { NextResponse } from 'next/server'
import { createChat, listChatSummaries } from '@/features/chat/chat-data'
import { resolveViewer } from '@/lib/viewer'

type CreateChatBody = {
  title?: string
}

export async function GET() {
  try {
    const { guestCookieValue, owner } = await resolveViewer()
    const chats = await listChatSummaries(owner)

    const response = NextResponse.json({ chats })

    if (guestCookieValue) {
      response.headers.set('Set-Cookie', guestCookieValue)
    }

    return response
  } catch (error) {
    console.error('读取对话列表失败', error)

    return NextResponse.json({ error: 'CHAT_LIST_FAILED' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { guestCookieValue, owner } = await resolveViewer()
    const body = (await request.json()) as CreateChatBody

    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json({ error: 'INVALID_CHAT_TITLE' }, { status: 400 })
    }

    const chat = await createChat(body.title.trim(), owner)

    const response = NextResponse.json({ chat }, { status: 201 })

    if (guestCookieValue) {
      response.headers.set('Set-Cookie', guestCookieValue)
    }

    return response
  } catch (error) {
    console.error('创建对话失败', error)

    return NextResponse.json({ error: 'CHAT_CREATE_FAILED' }, { status: 500 })
  }
}
