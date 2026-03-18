import { create } from 'zustand'

const STORAGE_KEY = 'markitor-scroll-sync'

type ScrollSyncStore = {
  enabled: boolean
  toggle: () => void
}

export const useScrollSyncStore = create<ScrollSyncStore>((set) => ({
  enabled: localStorage.getItem(STORAGE_KEY) !== 'false',
  toggle: () =>
    set((state) => {
      const next = !state.enabled
      localStorage.setItem(STORAGE_KEY, String(next))
      return { enabled: next }
    }),
}))
