import { AppShell } from '@/components/app-shell'
import { defaultLocale } from '@/i18n/messages'

export default function Home() {
  // The Home route now renders the static App Shell to establish the product-like frame early.
  return <AppShell locale={defaultLocale} />
}
