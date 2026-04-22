import 'server-only'

import { MessageRole, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { ChatOwnerScope } from '@/types/chat-owner'
import type { Chat, ChatMessage, ChatMessageRole, ChatSummary } from '@/types/chat'

function buildChatOwnerWhere(owner: ChatOwnerScope): Prisma.ChatWhereInput {
  return owner.kind === 'user'
    ? {
        userId: owner.userId,
      }
    : {
        guestId: owner.guestId,
      }
}

function buildChatOwnerCreateData(owner: ChatOwnerScope) {
  return owner.kind === 'user'
    ? {
        userId: owner.userId,
      }
    : {
        guestId: owner.guestId,
      }
}

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

export async function listChatSummaries(
  owner: ChatOwnerScope,
): Promise<ChatSummary[]> {
  const chats = await prisma.chat.findMany({
    where: buildChatOwnerWhere(owner),
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

export async function getChatById(
  chatId: string,
  owner: ChatOwnerScope,
): Promise<Chat | null> {
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      ...buildChatOwnerWhere(owner),
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

export async function createChat(
  title: string,
  owner: ChatOwnerScope,
): Promise<Chat> {
  const chat = await prisma.chat.create({
    data: {
      ...buildChatOwnerCreateData(owner),
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
  owner: ChatOwnerScope
  nextChatTitle?: string
}): Promise<ChatMessage> {
  const role = params.role === 'user' ? MessageRole.USER : MessageRole.ASSISTANT

  const message = await prisma.$transaction(async (tx) => {
    const chat = await tx.chat.findFirst({
      where: {
        id: params.chatId,
        ...buildChatOwnerWhere(params.owner),
      },
      select: {
        id: true,
      },
    })

    if (!chat) {
      throw new Error('CHAT_NOT_FOUND_OR_FORBIDDEN')
    }

    await tx.chat.update({
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
    })

    return tx.message.create({
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
    })
  })

  return mapPrismaMessage(message)
}

export async function listMessagesByChatId(
  chatId: string,
  owner: ChatOwnerScope,
): Promise<ChatMessage[]> {
  const messages = await prisma.message.findMany({
    where: {
      chatId,
      chat: buildChatOwnerWhere(owner),
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

export async function deleteMessage(messageId: string): Promise<void> {
  await prisma.message.delete({
    where: {
      id: messageId,
    },
  })
}

export async function deleteChat(
  chatId: string,
  owner: ChatOwnerScope,
): Promise<void> {
  await prisma.chat.deleteMany({
    where: {
      id: chatId,
      ...buildChatOwnerWhere(owner),
    },
  })
}

export async function renameChat(
  chatId: string,
  title: string,
  owner: ChatOwnerScope,
): Promise<ChatSummary> {
  const chat = await prisma.$transaction(async (tx) => {
    const existingChat = await tx.chat.findFirst({
      where: {
        id: chatId,
        ...buildChatOwnerWhere(owner),
      },
      select: {
        id: true,
      },
    })

    if (!existingChat) {
      throw new Error('CHAT_NOT_FOUND_OR_FORBIDDEN')
    }

    return tx.chat.update({
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
  })

  return mapPrismaChatSummary(chat)
}
