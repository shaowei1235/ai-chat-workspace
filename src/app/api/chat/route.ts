import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  createMessage,
  getChatById,
  listMessagesByChatId,
} from '@/features/chat/chat-data'
import {
  GUEST_ID_COOKIE_NAME,
  GuestLimitReachedError,
  consumeGuestUsage,
  createGuestCookieValue,
  resolveGuestId,
  restoreGuestUsage,
} from '@/features/guest/guest-data'
import {
  createChatTitleFromMessage,
  shouldAutoUpdateChatTitle,
} from '@/features/chat/chat-title'
import { streamAssistantReply } from '@/lib/ai/openai'

type ChatRouteBody = {
  chatId?: string
  content?: string
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const { guestId, shouldSetCookie } = resolveGuestId(
      cookieStore.get(GUEST_ID_COOKIE_NAME)?.value,
    )
    const body = (await request.json()) as ChatRouteBody
    const chatId = body.chatId
    const content = body.content?.trim()

    if (typeof chatId !== 'string' || chatId.length === 0) {
      return NextResponse.json({ error: 'INVALID_CHAT_ID' }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: 'INVALID_MESSAGE_CONTENT' }, { status: 400 })
    }

    const existingChat = await getChatById(chatId)

    if (!existingChat) {
      return NextResponse.json({ error: 'CHAT_NOT_FOUND' }, { status: 404 })
    }

    const nextChatTitle = shouldAutoUpdateChatTitle({
      currentTitle: existingChat.title,
      existingMessageCount: existingChat.messages.length,
      firstUserMessageContent: content,
    })
      ? createChatTitleFromMessage(content)
      : null

    const guestUsage = await consumeGuestUsage(guestId)

    try {
      await createMessage({
        chatId,
        role: 'user',
        content,
        ...(nextChatTitle
          ? {
              nextChatTitle,
            }
          : {}),
      })
    } catch (error) {
      await restoreGuestUsage(guestId)
      throw error
    }

    const messages = await listMessagesByChatId(chatId)
    let assistantContent = ''

    const stream = await streamAssistantReply({
      messages,
      onDelta(delta) {
        assistantContent += delta
      },
      async onComplete() {
        if (assistantContent.length === 0) {
          return
        }

        await createMessage({
          chatId,
          role: 'assistant',
          content: assistantContent,
        })
      },
    })

    const response = new Response(stream, {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream; charset=utf-8',
        'X-Guest-Limit': String(guestUsage.limit),
        'X-Guest-Remaining': String(guestUsage.remainingCount),
        'X-Guest-Used': String(guestUsage.usedCount),
      },
    })

    if (shouldSetCookie) {
      response.headers.set('Set-Cookie', createGuestCookieValue(guestId))
    }

    return response
  } catch (error) {
    if (error instanceof GuestLimitReachedError) {
      return NextResponse.json(
        {
          error: 'GUEST_LIMIT_REACHED',
          guestUsage: error.guestUsage,
        },
        { status: 429 },
      )
    }

    console.error('聊天接口流式请求失败', error)

    return NextResponse.json(
      { error: 'ASSISTANT_REPLY_FAILED' },
      { status: 500 },
    )
  }
}
