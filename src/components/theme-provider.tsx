'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

export function ThemeProvider(props: ThemeProviderProps) {
  // Centralizes theme wiring so `layout.tsx` stays clean and the implementation stays swappable.
  return <NextThemesProvider {...props} />
}

