'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ThemeMode = 'light' | 'dark'
type ThemeSetting = ThemeMode | 'system'

export type ThemeProviderProps = {
  attribute?: 'class' | `data-${string}`
  children: ReactNode
  defaultTheme?: ThemeSetting
  disableTransitionOnChange?: boolean
  enableSystem?: boolean
}

type ThemeContextValue = {
  resolvedTheme: ThemeMode
  setTheme: (nextTheme: ThemeSetting) => void
  theme: ThemeSetting
}

const THEME_STORAGE_KEY = 'theme'
const SYSTEM_MEDIA_QUERY = '(prefers-color-scheme: dark)'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function isThemeSetting(value: string | null): value is ThemeSetting {
  return value === 'light' || value === 'dark' || value === 'system'
}

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia(SYSTEM_MEDIA_QUERY).matches ? 'dark' : 'light'
}

function resolveThemeValue(
  theme: ThemeSetting,
  enableSystem: boolean,
): ThemeMode {
  if (theme === 'system' && enableSystem) {
    return getSystemTheme()
  }

  return theme === 'dark' ? 'dark' : 'light'
}

function disableTransitionsTemporarily() {
  const styleElement = document.createElement('style')
  styleElement.appendChild(
    document.createTextNode(
      '*,*::before,*::after{transition:none!important}',
    ),
  )
  document.head.appendChild(styleElement)

  return () => {
    window.getComputedStyle(document.body)
    window.setTimeout(() => {
      document.head.removeChild(styleElement)
    }, 1)
  }
}

function applyThemeAttribute(
  attribute: ThemeProviderProps['attribute'],
  resolvedTheme: ThemeMode,
) {
  const root = document.documentElement

  if (attribute === 'class') {
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
  } else {
    root.setAttribute(attribute ?? 'data-theme', resolvedTheme)
  }

  root.style.colorScheme = resolvedTheme
}

export function ThemeProvider({
  attribute = 'class',
  children,
  defaultTheme = 'system',
  disableTransitionOnChange = false,
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeSetting>(() => {
    const storedTheme =
      typeof window === 'undefined'
        ? null
        : window.localStorage.getItem(THEME_STORAGE_KEY)

    return isThemeSetting(storedTheme) ? storedTheme : defaultTheme
  })
  const [resolvedTheme, setResolvedTheme] = useState<ThemeMode>(() =>
    resolveThemeValue(
      typeof window === 'undefined'
        ? defaultTheme
        : isThemeSetting(window.localStorage.getItem(THEME_STORAGE_KEY))
          ? (window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeSetting)
          : defaultTheme,
      enableSystem,
    ),
  )

  useLayoutEffect(() => {
    applyThemeAttribute(attribute, resolvedTheme)
  }, [attribute, resolvedTheme])

  useEffect(() => {
    if (!enableSystem || theme !== 'system') {
      return
    }

    const mediaQuery = window.matchMedia(SYSTEM_MEDIA_QUERY)
    const handleChange = () => {
      const nextResolvedTheme = getSystemTheme()
      setResolvedTheme(nextResolvedTheme)
      applyThemeAttribute(attribute, nextResolvedTheme)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [attribute, enableSystem, theme])

  const setTheme = useCallback((nextTheme: ThemeSetting) => {
    const nextResolvedTheme = resolveThemeValue(nextTheme, enableSystem)
    const cleanupTransitions = disableTransitionOnChange
      ? disableTransitionsTemporarily()
      : null

    setThemeState(nextTheme)
    setResolvedTheme(nextResolvedTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    applyThemeAttribute(attribute, nextResolvedTheme)
    cleanupTransitions?.()
  }, [attribute, disableTransitionOnChange, enableSystem])

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme,
      setTheme,
      theme,
    }),
    [resolvedTheme, setTheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 内使用')
  }

  return context
}
