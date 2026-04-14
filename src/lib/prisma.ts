import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

declare global {
  // Reuse a single Prisma client in development to avoid exhausting database connections.
  var __prisma: PrismaClient | undefined
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('缺少 DATABASE_URL 环境变量')
  }

  return databaseUrl
}

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
})

export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
