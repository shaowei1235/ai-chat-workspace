export const locales = ['zh-CN', 'ja'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'zh-CN'

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' && (locales as readonly string[]).includes(value)
  )
}

type MessageNamespace = 'common' | 'sidebar' | 'emptyState' | 'auth' | 'presets'

type MessageDictionary = Record<MessageNamespace, Record<string, string>>

export const messages: Record<Locale, MessageDictionary> = {
  'zh-CN': {
    common: {
      appName: 'AI Chat Workspace',
      appDescription: '循序渐进构建的 AI Chat Workspace 学习与面试项目。',
      retryAction: '重试',
    },
    sidebar: {
      newChat: '新建对话',
      chatSectionTitle: '对话',
      settingsSectionTitle: '设置',
      languageLabel: '语言',
      themeLabel: '主题',
      localeZhCn: '中文',
      localeJa: '日本語',
      themeLight: '浅色',
      themeDark: '深色',
      renameChatLabel: '重命名对话',
      renameChatErrorEmpty: '标题不能为空。',
      renameChatErrorTooLong: '标题最多支持 50 个字符。',
      renameChatErrorFailed: '重命名失败，请稍后再试。',
      deleteChatLabel: '删除对话',
      deleteChatError: '删除对话失败，请稍后再试。',
      emptyTitle: '还没有历史对话',
      emptyDescription: '点击上方“新建对话”开始第一条会话。',
      newChatDefaultTitle: '新对话',
      loadErrorTitle: '对话列表加载失败',
      loadErrorDescription: '暂时无法读取对话列表，请重试。',
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
      activeDescription: '当前会话已接入流式 AI 回复链路。',
      chatLoadErrorMessage: '当前对话加载失败，请重试或切换其他对话。',
      chatMissingMessage: '当前对话不存在，已回退到可用状态。',
      messageAreaTitle: '开始发送你的第一条消息',
      pendingInputDescription: 'AI 正在流式生成回复，请稍候…',
      requestErrorMessage: '回复生成失败，请稍后再试。',
      guestUsageLoading: '正在读取 Guest 试用额度…',
      guestUsageRemainingPrefix: 'Guest 剩余',
      guestUsageRemainingSuffix: '次',
      guestUsageReached: 'Guest 试用额度已用尽',
      guestUsageReachedDescription: '当前已达到 Guest 上限，暂时无法继续发送。',
      guestUsageLoggedIn: '已登录，当前不受 Guest 试用限额影响。',
      continueWithGitHub: 'GitHub 登录继续使用',
      sendButtonLabel: '发送消息',
      stopGeneratingLabel: '停止生成',
      regenerateLabel: '重新生成',
      emptyChatTitle: '这个会话还没有消息',
      emptyChatDescription:
        '在底部输入框里发送第一条消息，先建立最小聊天交互。',
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
    auth: {
      guestName: 'Guest',
      guestRole: '试用模式',
      githubLoggedIn: 'GitHub 已登录',
      signInWithGitHub: 'GitHub 登录',
      signOut: '退出登录',
    },
    presets: {
      groupWriting: '写作',
      groupWork: '工作',
      groupLearning: '学习',
      summarizeLabel: '总结一段文本',
      summarizePrompt: '请帮我总结下面这段内容，并提炼出 3 个最重要的观点：',
      rewriteLabel: '改写成更专业的语气',
      rewritePrompt: '请将下面这段内容改写成更专业、清晰且自然的表达：',
      todoLabel: '生成待办清单',
      todoPrompt: '请根据下面的信息整理一份清晰的待办清单，并按优先级排序：',
      meetingLabel: '提炼会议行动项',
      meetingPrompt: '请从下面这段会议记录中提炼行动项，并标明负责人和截止时间：',
      explainLabel: '解释一个前端概念',
      explainPrompt: '请用初学者能理解的语言解释这个前端概念，并举一个简单例子：',
      outlineLabel: '整理结构化大纲',
      outlinePrompt: '请把下面的想法整理成一个结构清晰、层级明确的大纲：',
    },
  },
  ja: {
    common: {
      appName: 'AIチャットワークスペース',
      appDescription:
        'AIチャットワークスペースを段階的に構築する学習・面接プロジェクト。',
      retryAction: '再試行',
    },
    sidebar: {
      newChat: '新規チャット',
      chatSectionTitle: 'チャット',
      settingsSectionTitle: '設定',
      languageLabel: '言語',
      themeLabel: 'テーマ',
      localeZhCn: '中文',
      localeJa: '日本語',
      themeLight: 'ライト',
      themeDark: 'ダーク',
      renameChatLabel: 'チャット名を変更',
      renameChatErrorEmpty: 'タイトルは空にできません。',
      renameChatErrorTooLong: 'タイトルは 50 文字以内で入力してください。',
      renameChatErrorFailed:
        'チャット名の変更に失敗しました。しばらくしてから再度お試しください。',
      deleteChatLabel: 'チャットを削除',
      deleteChatError:
        'チャットの削除に失敗しました。しばらくしてから再度お試しください。',
      emptyTitle: 'まだチャット履歴がありません',
      emptyDescription: '上の「新規チャット」を押して最初の会話を始めます。',
      newChatDefaultTitle: '新しいチャット',
      loadErrorTitle: 'チャット一覧の読み込みに失敗しました',
      loadErrorDescription:
        '現在チャット一覧を取得できません。再試行してください。',
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
      activeDescription: '現在の会話ではストリーミング AI 返信が使えます。',
      chatLoadErrorMessage:
        '現在のチャットを読み込めませんでした。再試行するか別のチャットを選んでください。',
      chatMissingMessage:
        '現在のチャットは存在しないため、利用可能な状態に戻しました。',
      messageAreaTitle: '最初のメッセージを送信してください',
      pendingInputDescription:
        'AI が返信をストリーミング中です。しばらくお待ちください…',
      requestErrorMessage:
        '返信の生成に失敗しました。しばらくしてから再度お試しください。',
      guestUsageLoading: 'Guest 利用回数を読み込み中です…',
      guestUsageRemainingPrefix: 'Guest 残り',
      guestUsageRemainingSuffix: '回',
      guestUsageReached: 'Guest の試用回数を使い切りました',
      guestUsageReachedDescription:
        'Guest 上限に達したため、これ以上送信できません。',
      guestUsageLoggedIn:
        'ログイン済みのため、Guest 試用回数の制限を受けません。',
      continueWithGitHub: 'GitHub にログインして続行',
      sendButtonLabel: 'メッセージを送信',
      stopGeneratingLabel: '生成を停止',
      regenerateLabel: '再生成',
      emptyChatTitle: 'この会話にはまだメッセージがありません',
      emptyChatDescription:
        '下の入力欄から最初のメッセージを送って、最小の会話フローを作ります。',
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
    auth: {
      guestName: 'Guest',
      guestRole: '試用モード',
      githubLoggedIn: 'GitHub でログイン済み',
      signInWithGitHub: 'GitHub でログイン',
      signOut: 'ログアウト',
    },
    presets: {
      groupWriting: '作成',
      groupWork: '仕事',
      groupLearning: '学習',
      summarizeLabel: '文章を要約する',
      summarizePrompt: '次の内容を要約し、特に重要なポイントを 3 つに整理してください：',
      rewriteLabel: 'より丁寧な表現に書き換える',
      rewritePrompt: '次の内容を、より丁寧でプロフェッショナルな表現に書き換えてください：',
      todoLabel: 'ToDoリストを作成する',
      todoPrompt: '次の内容をもとに、優先順位つきの ToDo リストに整理してください：',
      meetingLabel: '会議のアクション項目を整理する',
      meetingPrompt: '次の会議メモからアクション項目を抽出し、担当者と期限を整理してください：',
      explainLabel: 'フロントエンド概念を説明する',
      explainPrompt: 'このフロントエンドの概念を初心者向けにやさしく説明し、簡単な例も添えてください：',
      outlineLabel: '構造化されたアウトラインにする',
      outlinePrompt: '次のアイデアを、構造が分かりやすいアウトラインに整理してください：',
    },
  },
}

export function t(locale: Locale, namespace: MessageNamespace, key: string) {
  // Minimal i18n for early steps: centralized messages + explicit locale selection (zh-CN/ja).
  return messages[locale][namespace][key] ?? `${namespace}.${key}`
}
