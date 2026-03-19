import { create } from 'zustand'

type PreviewStyleStore = {
  customCSS: string
  activePreset: string | null
  editorOpen: boolean
  setCustomCSS: (css: string) => void
  setActivePreset: (name: string | null) => void
  reset: () => void
  setEditorOpen: (open: boolean) => void
  toggleEditor: () => void
}

const STORAGE_KEY = 'markitor-preview-css'
const PRESET_KEY = 'markitor-preview-preset'

const storedCSS = localStorage.getItem(STORAGE_KEY) ?? ''
const storedPreset = localStorage.getItem(PRESET_KEY)

export const usePreviewStyleStore = create<PreviewStyleStore>((set) => ({
  customCSS: storedCSS,
  activePreset: storedPreset,
  editorOpen: false,
  setCustomCSS: (css) => {
    localStorage.setItem(STORAGE_KEY, css)
    set({ customCSS: css })
  },
  setActivePreset: (name) => {
    if (name) {
      localStorage.setItem(PRESET_KEY, name)
    } else {
      localStorage.removeItem(PRESET_KEY)
    }
    set({ activePreset: name })
  },
  reset: () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(PRESET_KEY)
    set({ customCSS: '', activePreset: null })
  },
  setEditorOpen: (open) => set({ editorOpen: open }),
  toggleEditor: () => set((s) => ({ editorOpen: !s.editorOpen })),
}))
