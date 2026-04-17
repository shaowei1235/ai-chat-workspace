import { locales, messages } from '@/i18n/messages'

const MAX_CHAT_TITLE_LENGTH = 24

function trimAndNormalizeWhitespace(content: string) {
  return content.replace(/\s+/g, ' ').trim()
}

function truncateTitle(title: string) {
  if (title.length <= MAX_CHAT_TITLE_LENGTH) {
    return title
  }

  return `${title.slice(0, MAX_CHAT_TITLE_LENGTH).trimEnd()}…`
}

export function createChatTitleFromMessage(content: string) {
  const normalizedContent = trimAndNormalizeWhitespace(content)

  if (normalizedContent.length === 0) {
    return null
  }

  return truncateTitle(normalizedContent)
}

export function isDefaultChatTitle(title: string) {
  return locales.some((locale) => {
    const baseTitle = messages[locale].sidebar.newChatDefaultTitle

    return title === baseTitle || title.startsWith(`${baseTitle} `)
  })
}

export function shouldAutoUpdateChatTitle(params: {
  currentTitle: string
  existingMessageCount: number
  firstUserMessageContent: string
}) {
  return (
    params.existingMessageCount === 0 &&
    isDefaultChatTitle(params.currentTitle) &&
    createChatTitleFromMessage(params.firstUserMessageContent) !== null
  )
}
