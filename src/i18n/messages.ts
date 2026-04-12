export type Locale = 'zh-CN' | 'ja'

export const defaultLocale: Locale = 'zh-CN'

const zhCN = {
  'appShell.brand': 'AI Chat Workspace',
  'appShell.newChat': '新建对话',
  'appShell.chatSectionTitle': '对话',
  'appShell.userSectionTitle': '账号',
  'appShell.emptyTitle': '开始一个对话',
  'appShell.emptyDescription':
    '从左侧创建新对话。这里将显示消息内容与输入区域。',
} as const

export type MessageKey = keyof typeof zhCN

const ja: Record<MessageKey, string> = {
  'appShell.brand': 'AIチャットワークスペース',
  'appShell.newChat': '新規チャット',
  'appShell.chatSectionTitle': 'チャット',
  'appShell.userSectionTitle': 'アカウント',
  'appShell.emptyTitle': '会話を開始',
  'appShell.emptyDescription':
    '左の新規チャットから開始できます。ここにメッセージと入力欄が表示されます。',
}

export const messages: Record<Locale, Record<MessageKey, string>> = {
  'zh-CN': zhCN,
  ja,
}

export function t(locale: Locale, key: MessageKey) {
  // A minimal i18n helper for early steps: centralizes user-visible strings and supports zh-CN/ja.
  return messages[locale][key]
}
