import { NextResponse } from 'next/server'
import { searchChatContents } from '@/features/chat/chat-data'
import { resolveViewer } from '@/lib/viewer'

export async function GET(request: Request) {
  try {
    const { guestCookieValue, owner } = await resolveViewer()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim() ?? ''

    if (query.length === 0) {
      const response = NextResponse.json({ results: [] })

      if (guestCookieValue) {
        response.headers.set('Set-Cookie', guestCookieValue)
      }

      return response
    }

    const results = await searchChatContents(owner, query)
    const response = NextResponse.json({ results })

    if (guestCookieValue) {
      response.headers.set('Set-Cookie', guestCookieValue)
    }

    return response
  } catch (error) {
    console.error('搜索对话内容失败', error)

    return NextResponse.json({ error: 'CHAT_SEARCH_FAILED' }, { status: 500 })
  }
}
