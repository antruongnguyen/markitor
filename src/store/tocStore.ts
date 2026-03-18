import { create } from 'zustand'

const STORAGE_KEY = 'markitor-toc-open'

const stored = localStorage.getItem(STORAGE_KEY)
const initialOpen = stored === null ? true : stored === 'true'

type TocStore = {
  open: boolean
  toggle: () => void
}

export const useTocStore = create<TocStore>((set) => ({
  open: initialOpen,
  toggle: () =>
    set((state) => {
      const next = !state.open
      localStorage.setItem(STORAGE_KEY, String(next))
      return { open: next }
    }),
}))
