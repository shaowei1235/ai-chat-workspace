import {
  AppShellRequestError,
  type GuestUsageInfo,
} from '@/features/chat/chat-client'

const LOCAL_STREAM_PARSE_ERROR = '流式响应解析失败'

type ConsumeAssistantStreamParams = {
  chatId: string
  content: string
  signal: AbortSignal
  onDelta: (content: string) => void
  onGuestUsage: (guestUsage: GuestUsageInfo) => void
}

type ErrorResponse = {
  error?: string
  guestUsage?: GuestUsageInfo
}

// 负责消费聊天 SSE 流，把服务端事件转换成前端更容易使用的回调。
export async function consumeAssistantStream({
  chatId,
  content,
  signal,
  onDelta,
  onGuestUsage,
}: ConsumeAssistantStreamParams) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify({ chatId, content }),
  })

  if (!response.ok || !response.body) {
    if (!response.ok) {
      let errorCode: string | null = null
      let nextGuestUsage: GuestUsageInfo | null = null

      try {
        const body = (await response.json()) as ErrorResponse
        errorCode = typeof body.error === 'string' ? body.error : null
        nextGuestUsage =
          body.guestUsage &&
          typeof body.guestUsage.limit === 'number' &&
          typeof body.guestUsage.remainingCount === 'number' &&
          typeof body.guestUsage.usedCount === 'number'
            ? body.guestUsage
            : null
      } catch {
        errorCode = null
      }

      throw new AppShellRequestError(
        `聊天请求失败: ${response.status}`,
        response.status,
        errorCode,
        nextGuestUsage,
      )
    }

    throw new Error(`聊天请求失败: ${response.status}`)
  }

  const nextGuestLimit = Number(response.headers.get('X-Guest-Limit'))
  const nextGuestRemaining = Number(response.headers.get('X-Guest-Remaining'))
  const nextGuestUsed = Number(response.headers.get('X-Guest-Used'))

  if (
    Number.isFinite(nextGuestLimit) &&
    Number.isFinite(nextGuestRemaining) &&
    Number.isFinite(nextGuestUsed)
  ) {
    onGuestUsage({
      limit: nextGuestLimit,
      remainingCount: nextGuestRemaining,
      usedCount: nextGuestUsed,
    })
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let nextContent = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const eventChunks = buffer.split('\n\n')
    buffer = eventChunks.pop() ?? ''

    for (const chunk of eventChunks) {
      const lines = chunk.split('\n')
      const eventName = lines
        .find((line) => line.startsWith('event: '))
        ?.slice(7)
        .trim()
      const data = lines
        .filter((line) => line.startsWith('data: '))
        .map((line) => line.slice(6))
        .join('\n')

      if (!eventName) {
        continue
      }

      if (eventName === 'delta') {
        nextContent += data
        onDelta(nextContent)
      }

      if (eventName === 'error') {
        throw new Error(data || LOCAL_STREAM_PARSE_ERROR)
      }

      if (eventName === 'done') {
        return
      }
    }
  }
}
