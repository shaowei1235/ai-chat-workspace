import type { ChatMessage } from '@/types/chat'

type OpenAIMessageInput = {
  role: ChatMessage['role']
  content: Array<{
    type: 'input_text' | 'output_text'
    text: string
  }>
}

export type GenerateAssistantReplyParams = {
  messages: ChatMessage[]
}

export type GenerateAssistantReplyResult = {
  content: string
}

type OpenAIResponsesResponse = {
  output?: Array<{
    type?: string
    role?: string
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
  output_text?: string
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
        // Responses API expects assistant history to be represented as output_text.
        type: message.role === 'assistant' ? 'output_text' : 'input_text',
        text: message.content,
      },
    ],
  }))
}

export async function generateAssistantReply({
  messages,
}: GenerateAssistantReplyParams): Promise<GenerateAssistantReplyResult> {
  const { apiKey, model } = getOpenAIConfig()

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: mapMessagesToResponsesInput(messages),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI 请求失败: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as OpenAIResponsesResponse
  const content =
    data.output_text ??
    data.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
      .map((item) => item.text ?? '')
      .join('\n')
      .trim()

  if (!content) {
    throw new Error('OpenAI 未返回可用文本')
  }

  return {
    content,
  }
}
