import { create } from 'zustand'

type EmojiPickerStore = {
  open: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
}

export const useEmojiPickerStore = create<EmojiPickerStore>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (open) => set({ open }),
}))
