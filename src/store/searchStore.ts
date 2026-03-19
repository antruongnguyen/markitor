import { create } from 'zustand'

type SearchState = {
  isOpen: boolean
  showReplace: boolean
  setOpen: (open: boolean) => void
  setShowReplace: (show: boolean) => void
  toggleReplace: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  showReplace: false,
  setOpen: (open) => set({ isOpen: open }),
  setShowReplace: (show) => set({ showReplace: show }),
  toggleReplace: () => set((s) => ({ showReplace: !s.showReplace })),
}))
