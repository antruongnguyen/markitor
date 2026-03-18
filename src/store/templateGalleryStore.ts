import { create } from 'zustand'

type TemplateGalleryStore = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useTemplateGalleryStore = create<TemplateGalleryStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
