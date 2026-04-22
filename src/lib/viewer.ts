import 'server-only'

import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import {
  GUEST_ID_COOKIE_NAME,
  createGuestCookieValue,
  resolveGuestId,
} from '@/features/guest/guest-data'
import type { AuthUser } from '@/types/auth'
import type { ChatOwnerScope } from '@/types/chat-owner'

type ViewerResolution = {
  authUser: AuthUser | null
  guestCookieValue: string | null
  owner: ChatOwnerScope
}

function buildAuthUser(sessionUser: {
  email?: string | null
  id: string
  image?: string | null
  name?: string | null
}): AuthUser {
  return {
    email: sessionUser.email ?? null,
    id: sessionUser.id,
    image: sessionUser.image ?? null,
    name: sessionUser.name ?? null,
  }
}

// 统一解析“当前请求是谁”，并把 user / guest 身份转换成数据库查询可直接使用的 owner scope。
export async function resolveViewer(): Promise<ViewerResolution> {
  const [session, cookieStore] = await Promise.all([
    getServerSession(authOptions),
    cookies(),
  ])

  if (session?.user?.id) {
    const authUser = buildAuthUser(session.user)

    return {
      authUser,
      guestCookieValue: null,
      owner: {
        kind: 'user',
        userId: authUser.id,
      },
    }
  }

  const { guestId, shouldSetCookie } = resolveGuestId(
    cookieStore.get(GUEST_ID_COOKIE_NAME)?.value,
  )

  return {
    authUser: null,
    guestCookieValue: shouldSetCookie ? createGuestCookieValue(guestId) : null,
    owner: {
      kind: 'guest',
      guestId,
    },
  }
}
