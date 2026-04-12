export type Chat = {
  id: string
  title: string
  // Keep timestamps serializable so the shape can move to API/database boundaries later.
  createdAt: string
}
