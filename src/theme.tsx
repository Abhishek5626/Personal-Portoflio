import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type ThemeName = 'light' | 'dark'

export const themeStorageKey = 'project-view-theme'

/** Manual default when nothing is stored — independent of OS color scheme. */
const defaultTheme: ThemeName = 'light'

function storedTheme(): ThemeName | null {
  try {
    const stored = localStorage.getItem(themeStorageKey)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    /* Storage can be blocked. Fall back to the manual default. */
  }
  return null
}

export function readTheme(): ThemeName {
  const current = document.documentElement.dataset.theme
  if (current === 'dark' || current === 'light') return current
  return storedTheme() ?? defaultTheme
}

function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

type ThemeContextValue = {
  theme: ThemeName
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const initial = readTheme()
    applyTheme(initial)
    return initial
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      /* Apply before paint so CSS transitions start from the committed theme. */
      applyTheme(next)
      try {
        localStorage.setItem(themeStorageKey, next)
      } catch {
        /* The choice still applies for this visit. */
      }
      return next
    })
  }, [])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider.')
  }
  return value
}
