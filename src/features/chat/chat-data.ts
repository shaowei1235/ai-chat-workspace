import 'server-only'

import { MessageRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { Chat, ChatMessage, ChatMessageRole, ChatSummary } from '@/types/chat'

function mapMessageRole(role: MessageRole): ChatMessageRole {
  return role === MessageRole.USER ? 'user' : 'assistant'
}

function mapPrismaMessage(message: {
  id: string
  role: MessageRole
  content: string
  createdAt: Date
}): ChatMessage {
  return {
    id: message.id,
    role: mapMessageRole(message.role),
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  }
}

function mapPrismaChatSummary(chat: {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}): ChatSummary {
  return {
    id: chat.id,
    title: chat.title,
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
  }
}

function mapPrismaChat(chat: {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: Array<{
    id: string
    role: MessageRole
    content: string
    createdAt: Date
  }>
}): Chat {
  return {
    ...mapPrismaChatSummary(chat),
    messages: chat.messages.map(mapPrismaMessage),
  }
}

export async function listChatSummaries(): Promise<ChatSummary[]> {
  const chats = await prisma.chat.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return chats.map(mapPrismaChatSummary)
}

export async function getChatById(chatId: string): Promise<Chat | null> {
  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  return chat ? mapPrismaChat(chat) : null
}

export async function createChat(title: string): Promise<Chat> {
  const chat = await prisma.chat.create({
    data: {
      title,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  return mapPrismaChat(chat)
}

export async function createMessage(params: {
  chatId: string
  role: ChatMessageRole
  content: string
  nextChatTitle?: string
}): Promise<ChatMessage> {
  const role = params.role === 'user' ? MessageRole.USER : MessageRole.ASSISTANT

  const [, message] = await prisma.$transaction([
    prisma.chat.update({
      where: {
        id: params.chatId,
      },
      data: {
        ...(params.nextChatTitle
          ? {
              title: params.nextChatTitle,
            }
          : {}),
        updatedAt: new Date(),
      },
    }),
    prisma.message.create({
      data: {
        chatId: params.chatId,
        role,
        content: params.content,
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    }),
  ])

  return mapPrismaMessage(message)
}

export async function listMessagesByChatId(chatId: string): Promise<ChatMessage[]> {
  const messages = await prisma.message.findMany({
    where: {
      chatId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  })

  return messages.map(mapPrismaMessage)
}

export async function deleteChat(chatId: string): Promise<void> {
  await prisma.chat.delete({
    where: {
      id: chatId,
    },
  })
}

export async function renameChat(
  chatId: string,
  title: string,
): Promise<ChatSummary> {
  const chat = await prisma.chat.update({
    where: {
      id: chatId,
    },
    data: {
      title,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return mapPrismaChatSummary(chat)
}
