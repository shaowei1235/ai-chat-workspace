import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    // Enables per-page titles later without changing the root layout structure.
    default: 'AI Chat Workspace',
    template: '%s · AI Chat Workspace',
  },
  description:
    'A step-by-step interview and learning project for building an AI chat workspace.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-background text-foreground font-sans">
        {/* Theme is mounted at the highest shared level so all pages/components can rely on it. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* A minimal full-height page frame; future shells/providers can wrap children here when needed. */}
          <div className="min-h-dvh flex flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}
