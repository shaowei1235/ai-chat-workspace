import 'server-only'

import { prisma } from '@/lib/prisma'

export const GUEST_ID_COOKIE_NAME = 'acw-guest-id'
export const GUEST_MESSAGE_LIMIT = 10

export type GuestUsageSnapshot = {
  limit: number
  remainingCount: number
  usedCount: number
}

export class GuestLimitReachedError extends Error {
  constructor(readonly guestUsage: GuestUsageSnapshot) {
    super('GUEST_LIMIT_REACHED')
  }
}

function buildGuestUsageSnapshot(usedCount: number): GuestUsageSnapshot {
  return {
    limit: GUEST_MESSAGE_LIMIT,
    usedCount,
    remainingCount: Math.max(GUEST_MESSAGE_LIMIT - usedCount, 0),
  }
}

export function resolveGuestId(currentGuestId?: string | null) {
  if (typeof currentGuestId === 'string' && currentGuestId.length > 0) {
    return {
      guestId: currentGuestId,
      shouldSetCookie: false,
    }
  }

  return {
    guestId: crypto.randomUUID(),
    shouldSetCookie: true,
  }
}

export function createGuestCookieValue(guestId: string) {
  return `${GUEST_ID_COOKIE_NAME}=${guestId}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`
}

export async function getGuestUsage(guestId: string): Promise<GuestUsageSnapshot> {
  const usage = await prisma.guestUsage.findUnique({
    where: {
      guestId,
    },
    select: {
      usedCount: true,
    },
  })

  return buildGuestUsageSnapshot(usage?.usedCount ?? 0)
}

export async function consumeGuestUsage(
  guestId: string,
): Promise<GuestUsageSnapshot> {
  const usage = await prisma.$transaction(async (tx) => {
    await tx.guestUsage.upsert({
      where: {
        guestId,
      },
      create: {
        guestId,
      },
      update: {},
    })

    const updated = await tx.guestUsage.updateMany({
      where: {
        guestId,
        usedCount: {
          lt: GUEST_MESSAGE_LIMIT,
        },
      },
      data: {
        usedCount: {
          increment: 1,
        },
      },
    })

    const nextUsage = await tx.guestUsage.findUnique({
      where: {
        guestId,
      },
      select: {
        usedCount: true,
      },
    })

    if (!nextUsage) {
      throw new Error('GUEST_USAGE_NOT_FOUND')
    }

    if (updated.count === 0) {
      throw new GuestLimitReachedError(
        buildGuestUsageSnapshot(nextUsage.usedCount),
      )
    }

    return buildGuestUsageSnapshot(nextUsage.usedCount)
  })

  return usage
}

export async function restoreGuestUsage(
  guestId: string,
): Promise<GuestUsageSnapshot> {
  const usage = await prisma.$transaction(async (tx) => {
    const updated = await tx.guestUsage.updateMany({
      where: {
        guestId,
        usedCount: {
          gt: 0,
        },
      },
      data: {
        usedCount: {
          decrement: 1,
        },
      },
    })

    const nextUsage = await tx.guestUsage.findUnique({
      where: {
        guestId,
      },
      select: {
        usedCount: true,
      },
    })

    if (!nextUsage) {
      return buildGuestUsageSnapshot(0)
    }

    if (updated.count === 0) {
      return buildGuestUsageSnapshot(nextUsage.usedCount)
    }

    return buildGuestUsageSnapshot(nextUsage.usedCount)
  })

  return usage
}
