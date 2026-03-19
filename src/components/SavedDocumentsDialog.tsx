import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, Trash2, X, Clock, FolderOpen } from 'lucide-react'
import { loadAllDrafts, deleteDraft, type Draft } from '../utils/autosave'
import { useTabStore } from '../store/tabStore'
import { useSavedDocumentsStore } from '../store/savedDocumentsStore'

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

function contentPreview(content: string): string {
  const trimmed = content.replace(/^---[\s\S]*?---\s*/, '').trim()
  if (trimmed.length === 0) return '(empty)'
  const firstLine = trimmed.split('\n')[0].replace(/^#+\s*/, '').trim()
  if (firstLine.length <= 60) return firstLine
  return firstLine.slice(0, 57) + '...'
}

function SavedDocumentsInner() {
  const setOpen = useSavedDocumentsStore((s) => s.setOpen)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Load drafts on mount
  useEffect(() => {
    let cancelled = false
    loadAllDrafts()
      .then((all) => {
        if (cancelled) return
        all.sort((a, b) => b.savedAt - a.savedAt)
        setDrafts(all)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setDrafts([])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const close = useCallback(() => setOpen(false), [setOpen])

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close])

  const handleOpen = useCallback(
    (draft: Draft) => {
      const tabStore = useTabStore.getState()

      // Check if this document is already open (match by content + fileName)
      const existing = tabStore.tabs.find(
        (t) => t.fileName === draft.fileName && t.content === draft.content,
      )
      if (existing) {
        tabStore.switchTab(existing.id)
        close()
        return
      }

      // Open as new tab, mark dirty since not saved to disk
      const newId = tabStore.addTab({
        fileName: draft.fileName,
        content: draft.content,
      })
      // Mark the new tab as dirty
      useTabStore.setState((s) => ({
        tabs: s.tabs.map((t) => (t.id === newId ? { ...t, isDirty: true } : t)),
      }))

      close()
    },
    [close],
  )

  const handleDelete = useCallback(
    async (tabId: string) => {
      await deleteDraft(tabId)
      setDrafts((prev) => prev.filter((d) => d.tabId !== tabId))
      setConfirmDelete(null)
    },
    [],
  )

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh]" onClick={close} role="dialog" aria-modal="true" aria-label="Saved documents">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.15s ease-out' }} />
      <div
        ref={dialogRef}
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-2xl dark:border-gray-700/60 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.15s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200/80 px-4 py-3 dark:border-gray-700/60">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} strokeWidth={1.5} className="text-gray-500 dark:text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Saved Documents</h2>
            {!loading && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {drafts.length}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            onClick={close}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="custom-scrollbar max-h-90 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Loading...
            </div>
          ) : drafts.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No saved documents
            </div>
          ) : (
            <div className="py-1">
              {drafts.map((draft) => (
                <div
                  key={draft.tabId}
                  className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/3"
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => handleOpen(draft)}
                  >
                    <FileText
                      size={24}
                      strokeWidth={1.5}
                      className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                        {draft.fileName}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                        {contentPreview(draft.content)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                      <Clock size={10} strokeWidth={1.5} />
                      {formatRelativeTime(draft.savedAt)}
                    </div>
                  </button>

                  {/* Delete */}
                  {confirmDelete === draft.tabId ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className="rounded px-2 py-0.5 text-[10px] font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        onClick={() => handleDelete(draft.tabId)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className="rounded px-2 py-0.5 text-[10px] font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="shrink-0 rounded-md p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      onClick={() => setConfirmDelete(draft.tabId)}
                      title="Delete saved document"
                      aria-label={`Delete ${draft.fileName}`}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-gray-200/80 px-4 py-2 text-[10px] text-gray-400 dark:border-gray-700/60 dark:text-gray-500">
          Click a document to open it in a new tab
        </div>
      </div>
    </div>
  )
}

export function SavedDocumentsDialog() {
  const open = useSavedDocumentsStore((s) => s.open)
  if (!open) return null
  return <SavedDocumentsInner />
}
