import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

type ThemeStore = {
  mode: ThemeMode
  resolved: ResolvedTheme
  setMode: (mode: ThemeMode) => void
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode
}

function applyThemeClass(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

const stored = localStorage.getItem('markitor-theme') as ThemeMode | null
const initialMode: ThemeMode = stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system'
const initialResolved = resolveTheme(initialMode)
applyThemeClass(initialResolved)

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: initialMode,
  resolved: initialResolved,
  setMode: (mode) => {
    localStorage.setItem('markitor-theme', mode)
    const resolved = resolveTheme(mode)
    applyThemeClass(resolved)
    set({ mode, resolved })
  },
}))

// React to OS preference changes when in system mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const { mode } = useThemeStore.getState()
  if (mode === 'system') {
    const resolved = getSystemTheme()
    applyThemeClass(resolved)
    useThemeStore.setState({ resolved })
  }
})
