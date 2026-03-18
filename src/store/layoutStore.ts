import { create } from 'zustand'

export type LayoutMode = 'split' | 'editor' | 'preview'

const STORAGE_KEY = 'markitor-layout-mode'

type LayoutStore = {
  mode: LayoutMode
  setMode: (mode: LayoutMode) => void
  cycleMode: () => void
}

function loadMode(): LayoutMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'editor' || stored === 'preview' || stored === 'split') {
    return stored
  }
  return 'split'
}

const modeOrder: LayoutMode[] = ['editor', 'split', 'preview']

export const useLayoutStore = create<LayoutStore>((set) => ({
  mode: loadMode(),
  setMode: (mode) => {
    localStorage.setItem(STORAGE_KEY, mode)
    set({ mode })
  },
  cycleMode: () =>
    set((state) => {
      const idx = modeOrder.indexOf(state.mode)
      const next = modeOrder[(idx + 1) % modeOrder.length]
      localStorage.setItem(STORAGE_KEY, next)
      return { mode: next }
    }),
}))
