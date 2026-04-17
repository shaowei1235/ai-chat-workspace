import { NextResponse } from 'next/server'
import {
  createMessage,
  getChatById,
  listMessagesByChatId,
} from '@/features/chat/chat-data'
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

    return new Response(stream, {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('聊天接口流式请求失败', error)

    return NextResponse.json(
      { error: 'ASSISTANT_REPLY_FAILED' },
      { status: 500 },
    )
  }
}
