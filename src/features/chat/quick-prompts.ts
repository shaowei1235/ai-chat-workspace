import { t, type Locale } from '@/i18n/messages'

export type QuickPromptGroupId = 'writing' | 'work' | 'learning'

export type QuickPromptPreset = {
  group: QuickPromptGroupId
  id: string
  label: string
  prompt: string
}

export type QuickPromptGroup = {
  id: QuickPromptGroupId
  label: string
  presets: QuickPromptPreset[]
}

// 预设模板属于产品提供的引导内容，后续如果要接权限分层或模板持久化，
// 继续沿用这层结构即可，不需要先把数据散落在 JSX 里。
export function getQuickPromptGroups(locale: Locale): QuickPromptGroup[] {
  return [
    {
      id: 'writing',
      label: t(locale, 'presets', 'groupWriting'),
      presets: [
        {
          id: 'summarize-text',
          group: 'writing',
          label: t(locale, 'presets', 'summarizeLabel'),
          prompt: t(locale, 'presets', 'summarizePrompt'),
        },
        {
          id: 'rewrite-tone',
          group: 'writing',
          label: t(locale, 'presets', 'rewriteLabel'),
          prompt: t(locale, 'presets', 'rewritePrompt'),
        },
      ],
    },
    {
      id: 'work',
      label: t(locale, 'presets', 'groupWork'),
      presets: [
        {
          id: 'todo-list',
          group: 'work',
          label: t(locale, 'presets', 'todoLabel'),
          prompt: t(locale, 'presets', 'todoPrompt'),
        },
        {
          id: 'meeting-actions',
          group: 'work',
          label: t(locale, 'presets', 'meetingLabel'),
          prompt: t(locale, 'presets', 'meetingPrompt'),
        },
      ],
    },
    {
      id: 'learning',
      label: t(locale, 'presets', 'groupLearning'),
      presets: [
        {
          id: 'explain-concept',
          group: 'learning',
          label: t(locale, 'presets', 'explainLabel'),
          prompt: t(locale, 'presets', 'explainPrompt'),
        },
        {
          id: 'outline-idea',
          group: 'learning',
          label: t(locale, 'presets', 'outlineLabel'),
          prompt: t(locale, 'presets', 'outlinePrompt'),
        },
      ],
    },
  ]
}
