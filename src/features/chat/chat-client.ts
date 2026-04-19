import type { Chat, ChatSummary } from '@/types/chat'

export type ChatsResponse = {
  chats: ChatSummary[]
}

export type ChatResponse = {
  chat: Chat
}

export type RenameChatResponse = {
  chat: ChatSummary
}

type ErrorResponse = {
  error?: string
  guestUsage?: GuestUsageInfo
}

export type GuestUsageInfo = {
  limit: number
  remainingCount: number
  usedCount: number
}

export type GuestUsageResponse = {
  guestUsage: GuestUsageInfo
}

export const DEFAULT_GUEST_LIMIT = 10

export class AppShellRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null = null,
    readonly guestUsage: GuestUsageInfo | null = null,
  ) {
    super(message)
  }
}

// 统一解析接口响应，让 hook 不再关心每个 fetch 的错误细节。
export async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorCode: string | null = null
    let guestUsage: GuestUsageInfo | null = null

    try {
      const body = (await response.json()) as ErrorResponse
      errorCode = typeof body.error === 'string' ? body.error : null
      guestUsage =
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
      `请求失败: ${response.status}`,
      response.status,
      errorCode,
      guestUsage,
    )
  }

  return (await response.json()) as T
}

export async function fetchChatSummaries() {
  const response = await fetch('/api/chats', {
    method: 'GET',
    cache: 'no-store',
  })

  return readJson<ChatsResponse>(response)
}

export async function fetchChat(chatId: string) {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: 'GET',
    cache: 'no-store',
  })

  return readJson<ChatResponse>(response)
}

export async function createChat(title: string) {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  })

  return readJson<ChatResponse>(response)
}

export async function deleteChat(chatId: string) {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: 'DELETE',
  })

  return readJson<{ success: true }>(response)
}

export async function renameChat(chatId: string, title: string) {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  })

  return readJson<RenameChatResponse>(response)
}

export async function fetchGuestUsage() {
  const response = await fetch('/api/guest/usage', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    return {
      guestUsage: {
        limit: DEFAULT_GUEST_LIMIT,
        remainingCount: DEFAULT_GUEST_LIMIT,
        usedCount: 0,
      },
    } satisfies GuestUsageResponse
  }

  return readJson<GuestUsageResponse>(response)
}
