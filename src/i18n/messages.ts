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
      emptyTitle: '还没有历史对话',
      emptyDescription: '点击上方“新建对话”开始第一条会话。',
      newChatDefaultTitle: '新对话',
      userSectionTitle: '账号',
      userName: 'Workspace User',
      userRole: 'Personal Plan',
    },
    emptyState: {
      title: '新对话',
      description: '从一个清晰的问题开始当前会话。',
      heroTitle: '有什么我能帮你的吗？',
      heroSubtitle: '你可以直接输入问题，或从下方示例开始。',
      inputPlaceholder: '在这里输入你的问题…',
      activeDescription: '当前会话已接入基础 AI 回复链路，后续步骤再升级为流式输出。',
      messageAreaLabel: '消息区域',
      messageAreaTitle: '开始发送你的第一条消息',
      inputDescription: '发送后会调用 AI 生成一条回复。',
      pendingInputDescription: 'AI 正在回复，请稍候…',
      requestErrorMessage: '回复生成失败，请稍后再试。',
      sendButtonLabel: '发送消息',
      emptyChatTitle: '这个会话还没有消息',
      emptyChatDescription: '在底部输入框里发送第一条消息，先建立最小聊天交互。',
      emptyInputGuard: '请先新建或选择一个对话',
      userRoleLabel: '你',
      assistantRoleLabel: 'AI',
      pendingReplyLabel: 'AI 正在回复…',
      example1: '总结一段文本',
      example2: '生成待办清单',
      example3: '改写成更专业的语气',
      example4: '提炼会议纪要中的行动项',
      example5: '解释一个前端概念给初学者',
      example6: '把想法整理成结构化大纲',
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
      emptyTitle: 'まだチャット履歴がありません',
      emptyDescription: '上の「新規チャット」を押して最初の会話を始めます。',
      newChatDefaultTitle: '新しいチャット',
      userSectionTitle: 'アカウント',
      userName: 'Workspace User',
      userRole: 'Personal Plan',
    },
    emptyState: {
      title: '新しいチャット',
      description: '明確な質問から今の会話を始めます。',
      heroTitle: 'どのようにお手伝いできますか？',
      heroSubtitle: 'そのまま質問を入力するか、下の例から始められます。',
      inputPlaceholder: 'ここに質問を入力…',
      activeDescription: '現在の会話では基本的な AI 返信フローが使え、次の段階でストリーミングに拡張します。',
      messageAreaLabel: 'メッセージ領域',
      messageAreaTitle: '最初のメッセージを送信してください',
      inputDescription: '送信後に AI が返信を生成します。',
      pendingInputDescription: 'AI が返信中です。しばらくお待ちください…',
      requestErrorMessage: '返信の生成に失敗しました。しばらくしてから再度お試しください。',
      sendButtonLabel: 'メッセージを送信',
      emptyChatTitle: 'この会話にはまだメッセージがありません',
      emptyChatDescription: '下の入力欄から最初のメッセージを送って、最小の会話フローを作ります。',
      emptyInputGuard: '先にチャットを新規作成するか選択してください',
      userRoleLabel: 'あなた',
      assistantRoleLabel: 'AI',
      pendingReplyLabel: 'AI が返信中です…',
      example1: '文章を要約する',
      example2: 'ToDoリストを作成する',
      example3: 'より丁寧な表現に書き換える',
      example4: '会議メモからアクション項目を整理する',
      example5: 'フロントエンドの概念を初心者向けに説明する',
      example6: 'アイデアを構造化されたアウトラインにまとめる',
    },
    auth: {},
  },
}

export function t(locale: Locale, namespace: MessageNamespace, key: string) {
  // Minimal i18n for early steps: centralized messages + explicit locale selection (zh-CN/ja).
  return messages[locale][namespace][key] ?? `${namespace}.${key}`
}
