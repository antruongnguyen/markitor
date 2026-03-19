import { create } from 'zustand'
import { useTabStore } from './tabStore'
import { useEditorStore } from './editorStore'
import { editorViewRef } from '../utils/editorViewRef'
import {
  saveDrafts,
  loadAllDrafts,
  deleteDraft,
  expireOldDrafts,
  saveActiveTabId,
  loadActiveTabId,
  type Draft,
} from '../utils/autosave'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'disabled'

type AutosaveStore = {
  enabled: boolean
  intervalSec: number
  status: AutosaveStatus
  lastSavedAt: number | null

  setEnabled: (v: boolean) => void
  setInterval: (sec: number) => void

  saveNow: () => Promise<void>
  clearDraftForTab: (tabId: string) => Promise<void>

  _init: () => (() => void)
}

function snapshotAllTabs(): Draft[] {
  const { tabs, activeTabId } = useTabStore.getState()
  const es = useEditorStore.getState()
  const view = editorViewRef.current

  return tabs
    .filter((t) => t.content.trim().length > 0)
    .map((t) => {
      const isActive = t.id === activeTabId
      return {
        tabId: t.id,
        content: isActive ? es.content : t.content,
        fileName: isActive ? es.fileName : t.fileName,
        cursorPos: isActive ? (view?.state.selection.main.head ?? t.cursorPos) : t.cursorPos,
        scrollTop: isActive ? (view?.scrollDOM.scrollTop ?? t.scrollTop) : t.scrollTop,
        savedAt: Date.now(),
      }
    })
}

let _restored = false

async function restoreTabs(): Promise<void> {
  // Guard against double invocation (React StrictMode calls _init twice)
  if (_restored) return
  _restored = true

  try {
    await expireOldDrafts()
    const [drafts, savedActiveTabId] = await Promise.all([
      loadAllDrafts(),
      loadActiveTabId(),
    ])
    if (drafts.length === 0) return

    const tabStore = useTabStore.getState()

    // Replace the default empty tab with restored tabs
    // First tab replaces the initial empty tab via editor store
    const firstDraft = drafts[0]
    const initialTab = tabStore.tabs[0]

    // Load first draft into the existing tab
    const es = useEditorStore.getState()
    es.setContentFromFile(firstDraft.content)
    es.setFileMeta({ fileName: firstDraft.fileName, fileHandle: null })

    // Update the initial tab's stored state
    useTabStore.setState((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === initialTab.id
          ? {
              ...t,
              content: firstDraft.content,
              fileName: firstDraft.fileName,
              cursorPos: firstDraft.cursorPos,
              scrollTop: firstDraft.scrollTop,
            }
          : t,
      ),
    }))

    // Restore cursor/scroll for first tab after CodeMirror processes content
    requestAnimationFrame(() => {
      const view = editorViewRef.current
      if (!view) return
      const pos = Math.min(firstDraft.cursorPos, view.state.doc.length)
      view.dispatch({ selection: { anchor: pos, head: pos } })
      view.scrollDOM.scrollTop = firstDraft.scrollTop
    })

    // Map old tabIds to new tabIds for active tab restoration
    const tabIdMap = new Map<string, string>()
    tabIdMap.set(firstDraft.tabId, initialTab.id)

    // Add remaining drafts as new tabs (without switching to them)
    for (let i = 1; i < drafts.length; i++) {
      const draft = drafts[i]
      const newId = tabStore.addTab({
        fileName: draft.fileName,
        content: draft.content,
      })
      tabIdMap.set(draft.tabId, newId)
    }

    // Switch to the previously active tab if it's not already active
    if (savedActiveTabId) {
      const mappedActiveId = tabIdMap.get(savedActiveTabId)
      if (mappedActiveId && mappedActiveId !== initialTab.id) {
        useTabStore.getState().switchTab(mappedActiveId)
      }
    }
  } catch {
    // IndexedDB unavailable — skip restore
  }
}

export const useAutosaveStore = create<AutosaveStore>((set, get) => ({
  enabled: true,
  intervalSec: 30,
  status: 'idle',
  lastSavedAt: null,

  setEnabled: (v) => set({ enabled: v, status: v ? 'idle' : 'disabled' }),
  setInterval: (sec) => set({ intervalSec: Math.max(5, sec) }),

  saveNow: async () => {
    if (!get().enabled) return
    set({ status: 'saving' })
    try {
      const drafts = snapshotAllTabs()
      const activeTabId = useTabStore.getState().activeTabId
      await Promise.all([
        saveDrafts(drafts),
        saveActiveTabId(activeTabId),
      ])
      set({ status: 'saved', lastSavedAt: Date.now() })
    } catch {
      set({ status: 'idle' })
    }
  },

  clearDraftForTab: async (tabId) => {
    await deleteDraft(tabId).catch(() => {})
  },

  _init: () => {
    // Silently restore tabs from IndexedDB on startup
    restoreTabs()

    // Periodic auto-save timer
    let timerId: ReturnType<typeof setInterval> | null = null

    const startTimer = () => {
      stopTimer()
      const { enabled, intervalSec } = get()
      if (!enabled) return
      timerId = setInterval(() => {
        get().saveNow()
      }, intervalSec * 1000)
    }

    const stopTimer = () => {
      if (timerId !== null) {
        clearInterval(timerId)
        timerId = null
      }
    }

    startTimer()

    // Re-start timer when settings change
    const unsubSettings = useAutosaveStore.subscribe((s, prev) => {
      if (s.enabled !== prev.enabled || s.intervalSec !== prev.intervalSec) {
        startTimer()
      }
    })

    // Debounced save on content change (2s after last keystroke)
    let debounceId: ReturnType<typeof setTimeout> | null = null
    const unsubEditor = useEditorStore.subscribe((s, prev) => {
      if (s.content !== prev.content && s.isDirty && get().enabled) {
        if (debounceId) clearTimeout(debounceId)
        debounceId = setTimeout(() => {
          get().saveNow()
        }, 2000)
      }
    })

    // Save on beforeunload
    const onBeforeUnload = () => {
      if (!get().enabled) return
      const drafts = snapshotAllTabs()
      const activeTabId = useTabStore.getState().activeTabId
      saveDrafts(drafts).catch(() => {})
      saveActiveTabId(activeTabId).catch(() => {})
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      stopTimer()
      unsubSettings()
      unsubEditor()
      if (debounceId) clearTimeout(debounceId)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  },
}))
