import { create } from 'zustand'

type AboutDialogStore = {
  open: boolean
  setOpen: (v: boolean) => void
  toggle: () => void
}

export const useAboutDialogStore = create<AboutDialogStore>((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
