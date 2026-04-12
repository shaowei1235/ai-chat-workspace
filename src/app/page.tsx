import { AppShell } from '@/components/app-shell'
import { getLocale } from '@/i18n/get-locale'

export default async function Home() {
  // The Home route now renders the static App Shell to establish the product-like frame early.
  const locale = await getLocale()

  return <AppShell locale={locale} />
}
