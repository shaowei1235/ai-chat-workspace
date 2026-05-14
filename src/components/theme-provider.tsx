'use client'

import type { ComponentProps } from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'

export type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>

// Use the recommended next-themes provider so theme state, system theme, and
// DOM class updates stay aligned with the library's default behavior.
export function ThemeProvider(props: ThemeProviderProps) {
  return <NextThemesProvider {...props} />
}

export { useTheme }
