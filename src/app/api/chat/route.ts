import { NextResponse } from 'next/server'
import {
  createMessage,
  deleteMessage,
  getChatById,
  listMessagesByChatId,
} from '@/features/chat/chat-data'
import {
  GuestLimitReachedError,
  consumeGuestUsage,
  restoreGuestUsage,
} from '@/features/guest/guest-data'
import {
  createChatTitleFromMessage,
  shouldAutoUpdateChatTitle,
} from '@/features/chat/chat-title'
import { resolveViewer } from '@/lib/viewer'
import { streamAssistantReply } from '@/lib/ai/openai'

type ChatRouteBody = {
  chatId?: string
  content?: string
  mode?: 'send' | 'regenerate'
}

export async function POST(request: Request) {
  try {
    const { guestCookieValue, owner } = await resolveViewer()
    const isAuthenticated = owner.kind === 'user'
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

    const existingChat = await getChatById(chatId, owner)

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
        : await consumeGuestUsage(owner.guestId)

      try {
        await createMessage({
          chatId,
          role: 'user',
          content: content!,
          owner,
          ...(nextChatTitle
            ? {
                nextChatTitle,
              }
            : {}),
        })
      } catch (error) {
        if (!isAuthenticated) {
          await restoreGuestUsage(owner.guestId)
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

    const messages = await listMessagesByChatId(chatId, owner)
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
          owner,
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

    if (guestCookieValue) {
      response.headers.set('Set-Cookie', guestCookieValue)
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
