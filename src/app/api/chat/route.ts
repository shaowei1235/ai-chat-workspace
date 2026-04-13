import { NextResponse } from 'next/server'
import { streamAssistantReply } from '@/lib/ai/openai'
import type { ChatMessage } from '@/types/chat'

type ChatRouteBody = {
  messages?: ChatMessage[]
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string' &&
    typeof candidate.createdAt === 'string'
  )
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRouteBody
    const messages = body.messages

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'INVALID_MESSAGES' },
        { status: 400 },
      )
    }

    if (!messages.every(isChatMessage)) {
      return NextResponse.json(
        { error: 'INVALID_MESSAGE_SHAPE' },
        { status: 400 },
      )
    }

    const stream = await streamAssistantReply({ messages })

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
