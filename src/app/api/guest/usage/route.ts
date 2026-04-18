import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  GUEST_ID_COOKIE_NAME,
  createGuestCookieValue,
  getGuestUsage,
  resolveGuestId,
} from '@/features/guest/guest-data'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const { guestId, shouldSetCookie } = resolveGuestId(
      cookieStore.get(GUEST_ID_COOKIE_NAME)?.value,
    )
    const guestUsage = await getGuestUsage(guestId)
    const response = NextResponse.json({ guestUsage })

    if (shouldSetCookie) {
      response.headers.set('Set-Cookie', createGuestCookieValue(guestId))
    }

    return response
  } catch (error) {
    console.error('读取 Guest 用量失败', error)

    return NextResponse.json({ error: 'GUEST_USAGE_FETCH_FAILED' }, { status: 500 })
  }
}
