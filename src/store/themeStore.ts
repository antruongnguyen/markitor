import { create } from 'zustand'
import type { EditorThemeId } from '../utils/editorThemes'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

type ThemeStore = {
  mode: ThemeMode
  resolved: ResolvedTheme
  editorTheme: EditorThemeId
  setMode: (mode: ThemeMode) => void
  setEditorTheme: (theme: EditorThemeId) => void
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

const storedEditorTheme = localStorage.getItem('markitor-editor-theme') as EditorThemeId | null
const validEditorThemes: EditorThemeId[] = ['github-light', 'one-dark', 'solarized-light', 'solarized-dark', 'dracula', 'nord']
const initialEditorTheme: EditorThemeId =
  storedEditorTheme && validEditorThemes.includes(storedEditorTheme)
    ? storedEditorTheme
    : (initialResolved === 'dark' ? 'one-dark' : 'github-light')

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: initialMode,
  resolved: initialResolved,
  editorTheme: initialEditorTheme,
  setMode: (mode) => {
    localStorage.setItem('markitor-theme', mode)
    const resolved = resolveTheme(mode)
    applyThemeClass(resolved)
    set({ mode, resolved })
  },
  setEditorTheme: (editorTheme) => {
    localStorage.setItem('markitor-editor-theme', editorTheme)
    set({ editorTheme })
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
