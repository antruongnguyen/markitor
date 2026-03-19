import { create } from 'zustand'
import { useTabStore } from './tabStore'
import { useEditorStore } from './editorStore'
import { editorViewRef } from '../utils/editorViewRef'
import {
  saveDrafts,
  loadAllDrafts,
  deleteDraft,
  clearAllDrafts,
  expireOldDrafts,
  type Draft,
} from '../utils/autosave'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'disabled'

type AutosaveStore = {
  enabled: boolean
  intervalSec: number
  status: AutosaveStatus
  lastSavedAt: number | null
  pendingDrafts: Draft[] | null
  showRecovery: boolean

  setEnabled: (v: boolean) => void
  setInterval: (sec: number) => void

  saveNow: () => Promise<void>
  checkForDrafts: () => Promise<void>
  recoverDrafts: (tabIds: string[]) => void
  discardDrafts: () => Promise<void>
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

export const useAutosaveStore = create<AutosaveStore>((set, get) => ({
  enabled: true,
  intervalSec: 30,
  status: 'idle',
  lastSavedAt: null,
  pendingDrafts: null,
  showRecovery: false,

  setEnabled: (v) => set({ enabled: v, status: v ? 'idle' : 'disabled' }),
  setInterval: (sec) => set({ intervalSec: Math.max(5, sec) }),

  saveNow: async () => {
    if (!get().enabled) return
    set({ status: 'saving' })
    try {
      const drafts = snapshotAllTabs()
      await saveDrafts(drafts)
      set({ status: 'saved', lastSavedAt: Date.now() })
    } catch {
      set({ status: 'idle' })
    }
  },

  checkForDrafts: async () => {
    try {
      await expireOldDrafts()
      const drafts = await loadAllDrafts()
      if (drafts.length > 0) {
        set({ pendingDrafts: drafts, showRecovery: true })
      }
    } catch {
      // IndexedDB unavailable — skip
    }
  },

  recoverDrafts: (tabIds) => {
    const { pendingDrafts } = get()
    if (!pendingDrafts) return
    const toRecover = pendingDrafts.filter((d) => tabIds.includes(d.tabId))
    const tabStore = useTabStore.getState()
    for (const draft of toRecover) {
      tabStore.addTab({
        fileName: draft.fileName,
        content: draft.content,
      })
    }
    set({ pendingDrafts: null, showRecovery: false })
    clearAllDrafts().catch(() => {})
  },

  discardDrafts: async () => {
    set({ pendingDrafts: null, showRecovery: false })
    await clearAllDrafts().catch(() => {})
  },

  clearDraftForTab: async (tabId) => {
    await deleteDraft(tabId).catch(() => {})
  },

  _init: () => {
    const state = get()

    // Check for pending drafts on startup
    state.checkForDrafts()

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
      // Use synchronous-ish approach: navigator.sendBeacon isn't available for IndexedDB
      // so we do a best-effort save
      saveDrafts(drafts).catch(() => {})
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
