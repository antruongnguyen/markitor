import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import type { EditorView, Panel } from '@codemirror/view'
import { SearchPanelContent } from '../components/SearchPanel'
import { useSearchStore } from '../store/searchStore'

export function createSearchPanel(view: EditorView): Panel {
  const dom = document.createElement('div')
  dom.className = 'cm-search-custom'
  let root: ReturnType<typeof createRoot> | null = null

  return {
    dom,
    top: true,
    mount() {
      root = createRoot(dom)
      root.render(createElement(SearchPanelContent, { view }))
      useSearchStore.getState().setOpen(true)
    },
    destroy() {
      root?.unmount()
      root = null
      useSearchStore.getState().setOpen(false)
    },
  }
}
