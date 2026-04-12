export type ChatMessageRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatMessageRole
  content: string
  // Keep timestamps serializable so the shape can move to API/database boundaries later.
  createdAt: string
}

export type Chat = {
  id: string
  title: string
  // Keep timestamps serializable so the shape can move to API/database boundaries later.
  createdAt: string
  messages: ChatMessage[]
}
