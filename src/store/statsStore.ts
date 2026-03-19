import { create } from 'zustand'

const STORAGE_KEY = 'markitor-stats-panel'

type StatsStore = {
  open: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
}

const stored = localStorage.getItem(STORAGE_KEY)
const initialOpen = stored === 'true'

export const useStatsStore = create<StatsStore>((set) => ({
  open: initialOpen,
  toggle: () =>
    set((state) => {
      const next = !state.open
      localStorage.setItem(STORAGE_KEY, String(next))
      return { open: next }
    }),
  setOpen: (open: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(open))
    set({ open })
  },
}))
