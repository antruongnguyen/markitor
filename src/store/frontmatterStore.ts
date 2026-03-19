import { create } from 'zustand'

type FrontmatterStore = {
  /** Whether the frontmatter editor panel is expanded */
  expanded: boolean
  /** Whether the current document contains frontmatter (kept in sync by FrontmatterEditor) */
  hasFrontmatter: boolean
  toggle: () => void
  setExpanded: (v: boolean) => void
  setHasFrontmatter: (v: boolean) => void
}

export const useFrontmatterStore = create<FrontmatterStore>((set) => ({
  expanded: localStorage.getItem('markitor-frontmatter-expanded') !== 'false',
  hasFrontmatter: false,
  toggle: () =>
    set((s) => {
      const next = !s.expanded
      localStorage.setItem('markitor-frontmatter-expanded', String(next))
      return { expanded: next }
    }),
  setExpanded: (v) => {
    localStorage.setItem('markitor-frontmatter-expanded', String(v))
    set({ expanded: v })
  },
  setHasFrontmatter: (v) => set({ hasFrontmatter: v }),
}))
