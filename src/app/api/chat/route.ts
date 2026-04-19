import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/auth'
import {
  createMessage,
  deleteMessage,
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
  mode?: 'send' | 'regenerate'
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const isAuthenticated = Boolean(session?.user)
    const cookieStore = await cookies()
    const { guestId, shouldSetCookie } = resolveGuestId(
      cookieStore.get(GUEST_ID_COOKIE_NAME)?.value,
    )
    const body = (await request.json()) as ChatRouteBody
    const chatId = body.chatId
    const mode = body.mode === 'regenerate' ? 'regenerate' : 'send'
    const content = body.content?.trim()

    if (typeof chatId !== 'string' || chatId.length === 0) {
      return NextResponse.json({ error: 'INVALID_CHAT_ID' }, { status: 400 })
    }

    if (mode === 'send' && !content) {
      return NextResponse.json({ error: 'INVALID_MESSAGE_CONTENT' }, { status: 400 })
    }

    const existingChat = await getChatById(chatId)

    if (!existingChat) {
      return NextResponse.json({ error: 'CHAT_NOT_FOUND' }, { status: 404 })
    }

    let guestUsage = null

    if (mode === 'send') {
      const nextChatTitle = shouldAutoUpdateChatTitle({
        currentTitle: existingChat.title,
        existingMessageCount: existingChat.messages.length,
        firstUserMessageContent: content!,
      })
        ? createChatTitleFromMessage(content!)
        : null

      guestUsage = isAuthenticated
        ? null
        : await consumeGuestUsage(guestId)

      try {
        await createMessage({
          chatId,
          role: 'user',
          content: content!,
          ...(nextChatTitle
            ? {
                nextChatTitle,
              }
            : {}),
        })
      } catch (error) {
        if (!isAuthenticated) {
          await restoreGuestUsage(guestId)
        }
        throw error
      }
    } else {
      const lastMessage = existingChat.messages[existingChat.messages.length - 1]
      const lastUserMessage = existingChat.messages[existingChat.messages.length - 2]

      if (
        !lastMessage ||
        !lastUserMessage ||
        lastMessage.role !== 'assistant' ||
        lastUserMessage.role !== 'user'
      ) {
        return NextResponse.json(
          { error: 'INVALID_REGENERATE_TARGET' },
          { status: 400 },
        )
      }

      await deleteMessage(lastMessage.id)
    }

    const messages = await listMessagesByChatId(chatId)
    let assistantContent = ''

    const stream = await streamAssistantReply({
      messages,
      signal: request.signal,
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
        ...(guestUsage
          ? {
              'X-Guest-Limit': String(guestUsage.limit),
              'X-Guest-Remaining': String(guestUsage.remainingCount),
              'X-Guest-Used': String(guestUsage.usedCount),
            }
          : {}),
      },
    })

    if (!isAuthenticated && shouldSetCookie) {
      response.headers.set('Set-Cookie', createGuestCookieValue(guestId))
    }

    return response
  } catch (error) {
    if (
      request.signal.aborted ||
      (error instanceof Error && error.name === 'AbortError')
    ) {
      return new Response(null, { status: 204 })
    }

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
