import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { localeCookieName } from '@/i18n/get-locale'
import { defaultLocale, isLocale } from '@/i18n/messages'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      locale?: unknown
    }
    const nextLocale = isLocale(body.locale) ? body.locale : defaultLocale
    const cookieStore = await cookies()

    cookieStore.set(localeCookieName, nextLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })

    return NextResponse.json({ locale: nextLocale })
  } catch (error) {
    console.error('写入语言设置失败', error)

    return NextResponse.json({ error: 'LOCALE_UPDATE_FAILED' }, { status: 500 })
  }
}
