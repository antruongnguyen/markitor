import { create } from 'zustand'
import { useEditorStore } from './editorStore'
import { editorViewRef } from '../utils/editorViewRef'
import { useAutosaveStore } from './autosaveStore'

export type Tab = {
  id: string
  fileName: string
  content: string
  fileHandle: FileSystemFileHandle | null
  isDirty: boolean
  cursorPos: number
  scrollTop: number
}

type TabStore = {
  tabs: Tab[]
  activeTabId: string
  addTab: (opts?: {
    fileName?: string
    content?: string
    fileHandle?: FileSystemFileHandle | null
  }) => string
  closeTab: (tabId: string) => void
  switchTab: (tabId: string) => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
  getActiveTab: () => Tab | undefined
  findTabByFileHandle: (handle: FileSystemFileHandle) => Tab | undefined
}

let nextId = 1
function genId() {
  return `tab-${nextId++}`
}

// Flag to prevent sync loops during tab switching
let _switching = false

function snapshotEditor(): Pick<Tab, 'content' | 'fileName' | 'fileHandle' | 'isDirty' | 'cursorPos' | 'scrollTop'> {
  const es = useEditorStore.getState()
  const view = editorViewRef.current
  return {
    content: es.content,
    fileName: es.fileName,
    fileHandle: es.fileHandle,
    isDirty: es.isDirty,
    cursorPos: view?.state.selection.main.head ?? 0,
    scrollTop: view?.scrollDOM.scrollTop ?? 0,
  }
}

function loadTabIntoEditor(tab: Tab) {
  const es = useEditorStore.getState()
  es.setContentFromFile(tab.content)
  es.setFileMeta({ fileName: tab.fileName, fileHandle: tab.fileHandle })
  if (tab.isDirty) {
    es.setDirty(true)
  }
  // Cursor and scroll are restored after CodeMirror processes the content change
  requestAnimationFrame(() => {
    const view = editorViewRef.current
    if (!view) return
    const pos = Math.min(tab.cursorPos, view.state.doc.length)
    view.dispatch({ selection: { anchor: pos, head: pos } })
    view.scrollDOM.scrollTop = tab.scrollTop
  })
}

// Create initial tab from current editor state
const initialId = genId()
const initialEditorState = useEditorStore.getState()

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [
    {
      id: initialId,
      fileName: initialEditorState.fileName,
      content: initialEditorState.content,
      fileHandle: initialEditorState.fileHandle,
      isDirty: initialEditorState.isDirty,
      cursorPos: 0,
      scrollTop: 0,
    },
  ],
  activeTabId: initialId,

  addTab: (opts) => {
    const id = genId()
    const newTab: Tab = {
      id,
      fileName: opts?.fileName ?? 'untitled.md',
      content: opts?.content ?? '',
      fileHandle: opts?.fileHandle ?? null,
      isDirty: false,
      cursorPos: 0,
      scrollTop: 0,
    }

    // Save current editor state to active tab before switching
    const snapshot = snapshotEditor()
    const activeId = get().activeTabId

    _switching = true
    set((state) => ({
      tabs: [
        ...state.tabs.map((t) => (t.id === activeId ? { ...t, ...snapshot } : t)),
        newTab,
      ],
      activeTabId: id,
    }))
    loadTabIntoEditor(newTab)
    _switching = false

    return id
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get()
    if (tabs.length <= 1) {
      // Don't close the last tab; reset it instead
      const resetTab: Tab = {
        id: tabs[0].id,
        fileName: 'untitled.md',
        content: '',
        fileHandle: null,
        isDirty: false,
        cursorPos: 0,
        scrollTop: 0,
      }
      _switching = true
      set({ tabs: [resetTab] })
      loadTabIntoEditor(resetTab)
      _switching = false
      return
    }

    const closingIndex = tabs.findIndex((t) => t.id === tabId)
    const newTabs = tabs.filter((t) => t.id !== tabId)

    if (tabId === activeTabId) {
      // Switch to adjacent tab
      const newIndex = Math.min(closingIndex, newTabs.length - 1)
      const newActive = newTabs[newIndex]

      _switching = true
      set({ tabs: newTabs, activeTabId: newActive.id })
      loadTabIntoEditor(newActive)
      _switching = false
    } else {
      set({ tabs: newTabs })
    }
  },

  switchTab: (tabId) => {
    const { activeTabId } = get()
    if (tabId === activeTabId) return

    const snapshot = snapshotEditor()

    _switching = true
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === activeTabId ? { ...t, ...snapshot } : t)),
      activeTabId: tabId,
    }))

    const newTab = get().tabs.find((t) => t.id === tabId)
    if (newTab) {
      loadTabIntoEditor(newTab)
    }
    _switching = false

    // Trigger auto-save on tab switch
    useAutosaveStore.getState().saveNow()
  },

  reorderTabs: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    set((state) => {
      const tabs = [...state.tabs]
      const [moved] = tabs.splice(fromIndex, 1)
      tabs.splice(toIndex, 0, moved)
      return { tabs }
    })
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find((t) => t.id === activeTabId)
  },

  findTabByFileHandle: (handle) => {
    return get().tabs.find((t) => t.fileHandle === handle)
  },
}))

// Auto-sync editor state changes to the active tab
useEditorStore.subscribe((state) => {
  if (_switching) return
  const { activeTabId } = useTabStore.getState()
  useTabStore.setState((ts) => ({
    tabs: ts.tabs.map((t) =>
      t.id === activeTabId
        ? {
            ...t,
            content: state.content,
            fileName: state.fileName,
            fileHandle: state.fileHandle,
            isDirty: state.isDirty,
          }
        : t,
    ),
  }))
})
