import { create } from 'zustand'
import { getCustomBindings, saveCustomBindings } from '../utils/shortcuts'

type ShortcutsStore = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void

  /** Custom bindings from localStorage, kept in sync */
  customBindings: Record<string, string>
  /** Incremented when bindings change so extensions recompute */
  bindingsVersion: number
  setCustomBinding: (id: string, keys: string) => void
  resetBinding: (id: string) => void
  resetAll: () => void
}

export const useShortcutsStore = create<ShortcutsStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),

  customBindings: getCustomBindings(),
  bindingsVersion: 0,

  setCustomBinding: (id, keys) =>
    set((s) => {
      const next = { ...s.customBindings, [id]: keys }
      saveCustomBindings(next)
      return { customBindings: next, bindingsVersion: s.bindingsVersion + 1 }
    }),

  resetBinding: (id) =>
    set((s) => {
      const next = { ...s.customBindings }
      delete next[id]
      saveCustomBindings(next)
      return { customBindings: next, bindingsVersion: s.bindingsVersion + 1 }
    }),

  resetAll: () =>
    set((s) => {
      saveCustomBindings({})
      return { customBindings: {}, bindingsVersion: s.bindingsVersion + 1 }
    }),
}))
