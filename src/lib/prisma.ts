import { PrismaClient } from '@prisma/client'

declare global {
  // Reuse a single Prisma client in development to avoid exhausting database connections.
  var __prisma: PrismaClient | undefined
}

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
