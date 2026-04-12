import { cookies } from 'next/headers'
import { defaultLocale, isLocale, type Locale } from '@/i18n/messages'

export const localeCookieName = 'acw-locale'

export async function getLocale(): Promise<Locale> {
  // Simple locale source for early steps: an explicit cookie set by the app later.
  const cookieStore = await cookies()
  const value = cookieStore.get(localeCookieName)?.value

  return isLocale(value) ? value : defaultLocale
}
