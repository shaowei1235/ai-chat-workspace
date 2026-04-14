import type { ChatMessage } from '@/types/chat'

type OpenAIMessageInput = {
  role: ChatMessage['role']
  content: Array<{
    type: 'input_text' | 'output_text'
    text: string
  }>
}

export type StreamAssistantReplyParams = {
  messages: ChatMessage[]
  onDelta?: (delta: string) => void | Promise<void>
  onComplete?: () => void | Promise<void>
  onError?: (message: string) => void | Promise<void>
}

type OpenAIStreamingEvent = {
  type?: string
  delta?: string
  error?: {
    message?: string
  }
}

function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY
  const model =
    process.env.NODE_ENV === 'development' ? 'gpt-4.1-nano' : 'gpt-4.1-mini'

  if (!apiKey) {
    throw new Error('缺少 OPENAI_API_KEY 环境变量')
  }

  return { apiKey, model }
}

function mapMessagesToResponsesInput(
  messages: ChatMessage[],
): OpenAIMessageInput[] {
  return messages.map((message) => ({
    role: message.role,
    content: [
      {
        type: message.role === 'assistant' ? 'output_text' : 'input_text',
        text: message.content,
      },
    ],
  }))
}

function encodeSseEvent(event: string, data: string) {
  return `event: ${event}\ndata: ${data}\n\n`
}

function parseSseChunk(chunk: string) {
  return chunk
    .split('\n\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const dataLines = entry
        .split('\n')
        .filter((line) => line.startsWith('data: '))
        .map((line) => line.slice(6))

      return dataLines.join('\n')
    })
    .filter(Boolean)
}

export async function streamAssistantReply({
  messages,
  onDelta,
  onComplete,
  onError,
}: StreamAssistantReplyParams): Promise<ReadableStream<Uint8Array>> {
  const { apiKey, model } = getOpenAIConfig()

  const openAIResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: true,
      input: mapMessagesToResponsesInput(messages),
    }),
  })

  if (!openAIResponse.ok || !openAIResponse.body) {
    const errorText = await openAIResponse.text()
    throw new Error(`OpenAI 请求失败: ${openAIResponse.status} ${errorText}`)
  }

  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const reader = openAIResponse.body.getReader()
  let buffer = ''
  let didComplete = false

  // Convert OpenAI's event stream into a smaller app-level event stream for the client.
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            controller.enqueue(encoder.encode(encodeSseEvent('done', '')))
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''

          for (const part of parts) {
            for (const dataLine of parseSseChunk(part)) {
              if (dataLine === '[DONE]') {
                if (!didComplete) {
                  didComplete = true
                  await onComplete?.()
                }
                controller.enqueue(encoder.encode(encodeSseEvent('done', '')))
                controller.close()
                return
              }

              const event = JSON.parse(dataLine) as OpenAIStreamingEvent

              if (event.type === 'response.output_text.delta' && event.delta) {
                await onDelta?.(event.delta)
                controller.enqueue(
                  encoder.encode(encodeSseEvent('delta', event.delta)),
                )
              }

              if (event.type === 'response.completed') {
                if (!didComplete) {
                  didComplete = true
                  await onComplete?.()
                }
                controller.enqueue(encoder.encode(encodeSseEvent('done', '')))
              }

              if (
                event.type === 'response.failed' ||
                event.type === 'error'
              ) {
                const message = event.error?.message ?? 'AI 流式回复失败'
                await onError?.(message)
                controller.enqueue(
                  encoder.encode(
                    encodeSseEvent('error', message),
                  ),
                )
              }
            }
          }
        }

        if (!didComplete) {
          didComplete = true
          await onComplete?.()
        }
        controller.close()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'AI 流式回复失败'
        await onError?.(message)
        controller.enqueue(
          encoder.encode(
            encodeSseEvent('error', message),
          ),
        )
        controller.close()
      } finally {
        reader.releaseLock()
      }
    },
  })
}
