export type ChatOwnerScope =
  | {
      kind: 'user'
      userId: string
    }
  | {
      kind: 'guest'
      guestId: string
    }
