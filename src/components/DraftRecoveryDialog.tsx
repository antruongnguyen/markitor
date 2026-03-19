import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, RotateCcw, Trash2, CheckSquare, Square } from 'lucide-react'
import { useAutosaveStore } from '../store/autosaveStore'
import type { Draft } from '../utils/autosave'

function formatTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function snippet(content: string, maxLen = 80) {
  const line = content.split('\n').find((l) => l.trim().length > 0) ?? ''
  return line.length > maxLen ? line.slice(0, maxLen) + '...' : line
}

function DraftRecoveryDialogInner({ drafts }: { drafts: Draft[] }) {
  const recoverDrafts = useAutosaveStore((s) => s.recoverDrafts)
  const discardDrafts = useAutosaveStore((s) => s.discardDrafts)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState<Set<string>>(() => new Set(drafts.map((d) => d.tabId)))

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const toggleItem = useCallback((tabId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tabId)) next.delete(tabId)
      else next.add(tabId)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === drafts.length) return new Set()
      return new Set(drafts.map((d) => d.tabId))
    })
  }, [drafts])

  const handleRecover = useCallback(() => {
    recoverDrafts(Array.from(selected))
  }, [selected, recoverDrafts])

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-[440px] rounded-xl border border-gray-200/80 bg-white p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800"
      onClose={() => discardDrafts()}
    >
      <div className="flex items-center gap-2.5 border-b border-gray-200/80 px-5 py-3 dark:border-gray-700/60">
        <RotateCcw size={16} strokeWidth={1.5} className="text-blue-600 dark:text-blue-400" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recover Unsaved Drafts</h2>
      </div>

      <div className="px-5 py-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {drafts.length} unsaved {drafts.length === 1 ? 'draft was' : 'drafts were'} found from a previous session. Select which to recover.
        </p>
      </div>

      <div className="max-h-[260px] overflow-y-auto px-5">
        {/* Select all toggle */}
        <button
          type="button"
          className="mb-1.5 flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5"
          onClick={toggleAll}
        >
          {selected.size === drafts.length ? (
            <CheckSquare size={14} strokeWidth={1.5} className="text-blue-600 dark:text-blue-400" />
          ) : (
            <Square size={14} strokeWidth={1.5} />
          )}
          {selected.size === drafts.length ? 'Deselect all' : 'Select all'}
        </button>

        {drafts.map((draft) => (
          <button
            key={draft.tabId}
            type="button"
            className={`mb-1.5 flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all duration-150 ${
              selected.has(draft.tabId)
                ? 'border-blue-300 bg-blue-50/60 dark:border-blue-500/40 dark:bg-blue-500/10'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'
            }`}
            onClick={() => toggleItem(draft.tabId)}
          >
            {selected.has(draft.tabId) ? (
              <CheckSquare size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
            ) : (
              <Square size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gray-400" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <FileText size={12} strokeWidth={1.5} className="shrink-0 text-gray-400" />
                <span className="truncate text-xs font-medium text-gray-800 dark:text-gray-200">{draft.fileName}</span>
                <span className="ml-auto shrink-0 text-[10px] text-gray-400">{formatTime(draft.savedAt)}</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">{snippet(draft.content)}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200/80 px-5 py-3 dark:border-gray-700/60">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          onClick={() => discardDrafts()}
        >
          <Trash2 size={13} strokeWidth={1.5} />
          Discard All
        </button>
        <button
          type="button"
          disabled={selected.size === 0}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-150 hover:bg-blue-500 disabled:opacity-40"
          onClick={handleRecover}
        >
          <RotateCcw size={13} strokeWidth={1.5} />
          Recover {selected.size > 0 ? `(${selected.size})` : ''}
        </button>
      </div>
    </dialog>
  )
}

export function DraftRecoveryDialog() {
  const showRecovery = useAutosaveStore((s) => s.showRecovery)
  const pendingDrafts = useAutosaveStore((s) => s.pendingDrafts)

  if (!showRecovery || !pendingDrafts || pendingDrafts.length === 0) return null
  return <DraftRecoveryDialogInner drafts={pendingDrafts} />
}
