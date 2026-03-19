import { create } from 'zustand'

type LintStore = {
  enabled: boolean
  toggle: () => void
  setEnabled: (v: boolean) => void
}

const STORAGE_KEY = 'markitor-lint-enabled'

function readPersisted(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === null ? true : v === 'true'
  } catch {
    return true
  }
}

export const useLintStore = create<LintStore>((set) => ({
  enabled: readPersisted(),
  toggle: () =>
    set((s) => {
      const next = !s.enabled
      localStorage.setItem(STORAGE_KEY, String(next))
      return { enabled: next }
    }),
  setEnabled: (v) => {
    localStorage.setItem(STORAGE_KEY, String(v))
    set({ enabled: v })
  },
}))
