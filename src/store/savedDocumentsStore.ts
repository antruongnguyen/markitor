import { create } from 'zustand'

type SavedDocumentsStore = {
  open: boolean
  setOpen: (v: boolean) => void
  toggle: () => void
}

export const useSavedDocumentsStore = create<SavedDocumentsStore>((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
