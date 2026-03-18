import { create } from 'zustand'

const STORAGE_KEY = 'markitor-focus-mode'

type FocusModeStore = {
  enabled: boolean
  typewriterMode: boolean
  toggle: () => void
  exit: () => void
  toggleTypewriter: () => void
}

const stored = localStorage.getItem(STORAGE_KEY)
const initialEnabled = stored === 'true'

export const useFocusModeStore = create<FocusModeStore>((set) => ({
  enabled: initialEnabled,
  typewriterMode: localStorage.getItem('markitor-typewriter') === 'true',
  toggle: () =>
    set((state) => {
      const next = !state.enabled
      localStorage.setItem(STORAGE_KEY, String(next))
      return { enabled: next }
    }),
  exit: () => {
    localStorage.setItem(STORAGE_KEY, 'false')
    set({ enabled: false })
  },
  toggleTypewriter: () =>
    set((state) => {
      const next = !state.typewriterMode
      localStorage.setItem('markitor-typewriter', String(next))
      return { typewriterMode: next }
    }),
}))
