export const locales = ['zh-CN', 'ja'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'zh-CN'

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' && (locales as readonly string[]).includes(value)
  )
}

type MessageNamespace = 'common' | 'sidebar' | 'emptyState' | 'auth'

type MessageDictionary = Record<MessageNamespace, Record<string, string>>

export const messages: Record<Locale, MessageDictionary> = {
  'zh-CN': {
    common: {
      appName: 'AI Chat Workspace',
      appDescription: '循序渐进构建的 AI Chat Workspace 学习与面试项目。',
    },
    sidebar: {
      newChat: '新建对话',
      chatSectionTitle: '对话',
      userSectionTitle: '账号',
    },
    emptyState: {
      title: '开始一个对话',
      description: '从左侧新建对话，或从示例开始。',
      inputPlaceholder: '在这里输入你的问题…',
      examplesTitle: '示例',
      example1: '总结一段文本',
      example2: '生成待办清单',
      example3: '改写成更专业的语气',
    },
    auth: {},
  },
  ja: {
    common: {
      appName: 'AIチャットワークスペース',
      appDescription:
        'AIチャットワークスペースを段階的に構築する学習・面接プロジェクト。',
    },
    sidebar: {
      newChat: '新規チャット',
      chatSectionTitle: 'チャット',
      userSectionTitle: 'アカウント',
    },
    emptyState: {
      title: '会話を開始',
      description: '左の新規チャット、または例から開始できます。',
      inputPlaceholder: 'ここに質問を入力…',
      examplesTitle: '例',
      example1: '文章を要約する',
      example2: 'ToDoリストを作成する',
      example3: 'より丁寧な表現に書き換える',
    },
    auth: {},
  },
}

export function t(locale: Locale, namespace: MessageNamespace, key: string) {
  // Minimal i18n for early steps: centralized messages + explicit locale selection (zh-CN/ja).
  return messages[locale][namespace][key] ?? `${namespace}.${key}`
}
