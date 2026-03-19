import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X, Search, RotateCcw } from 'lucide-react'
import { useShortcutsStore } from '../store/shortcutsStore'
import {
  SHORTCUTS,
  SHORTCUT_CATEGORIES,
  toDisplayParts,
  getEffectiveKeys,
  keyEventToKeys,
  findConflicts,
  type ShortcutDef,
  type ShortcutCategory,
} from '../utils/shortcuts'

// ── Key badge components ─────────────────────────────────

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-sm border border-gray-300 bg-linear-to-b from-gray-50 to-gray-100 px-1.5 text-[11px] font-medium leading-none text-gray-600 shadow-[0_1px_0_1px_rgba(0,0,0,0.04)] dark:border-gray-600 dark:from-gray-700 dark:to-gray-750 dark:text-gray-300 dark:shadow-[0_1px_0_1px_rgba(0,0,0,0.2)]">
      {children}
    </kbd>
  )
}

export function KeyCombo({ keys }: { keys: string }) {
  const parts = toDisplayParts(keys)
  return (
    <span className="inline-flex items-center gap-0.75">
      {parts.map((part, i) => (
        <KeyBadge key={`${part}-${i}`}>{part}</KeyBadge>
      ))}
    </span>
  )
}

// ── Shortcut row ─────────────────────────────────────────

function ShortcutRow({
  shortcut,
  effectiveKeys,
  isCustom,
  isRecording,
  recordingKeys,
  conflictWarning,
  onStartRecord,
  onReset,
}: {
  shortcut: ShortcutDef
  effectiveKeys: string
  isCustom: boolean
  isRecording: boolean
  recordingKeys: string | null
  conflictWarning: string | null
  onStartRecord: () => void
  onReset: () => void
}) {
  return (
    <div
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        isRecording
          ? 'bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:ring-blue-500/30'
          : 'hover:bg-gray-50 dark:hover:bg-white/3'
      }`}
    >
      {/* Name & description */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{shortcut.name}</span>
          {isCustom && (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              Custom
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{shortcut.description}</div>
        {conflictWarning && (
          <div className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">{conflictWarning}</div>
        )}
      </div>

      {/* Key combo / recording state */}
      <div className="flex shrink-0 items-center gap-2">
        {isRecording ? (
          <div className="flex items-center gap-2">
            {recordingKeys ? (
              <KeyCombo keys={recordingKeys} />
            ) : (
              <span className="animate-pulse text-xs font-medium text-blue-600 dark:text-blue-400">
                Press keys...
              </span>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="cursor-pointer rounded-md p-1 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
            onClick={onStartRecord}
            title="Click to rebind"
          >
            <KeyCombo keys={effectiveKeys} />
          </button>
        )}

        {/* Reset button (visible for custom bindings) */}
        {isCustom && !isRecording && (
          <button
            type="button"
            className="rounded-md p-1 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-white/5 dark:hover:text-gray-300"
            onClick={onReset}
            title="Reset to default"
          >
            <RotateCcw size={13} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Category section ─────────────────────────────────────

function CategorySection({
  category,
  shortcuts,
  customBindings,
  recordingId,
  recordingKeys,
  onStartRecord,
  onReset,
}: {
  category: ShortcutCategory
  shortcuts: ShortcutDef[]
  customBindings: Record<string, string>
  recordingId: string | null
  recordingKeys: string | null
  onStartRecord: (id: string) => void
  onReset: (id: string) => void
}) {
  if (shortcuts.length === 0) return null

  return (
    <div>
      <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {category}
      </div>
      <div className="flex flex-col">
        {shortcuts.map((s) => {
          const effectiveKeys = getEffectiveKeys(s, customBindings)
          const isCustom = s.id in customBindings
          const isRecording = recordingId === s.id
          const conflicts =
            isRecording && recordingKeys
              ? findConflicts(recordingKeys, s.id, customBindings)
              : []
          const conflictWarning =
            conflicts.length > 0
              ? `Conflicts with: ${conflicts.map((c) => c.name).join(', ')}`
              : null

          return (
            <ShortcutRow
              key={s.id}
              shortcut={s}
              effectiveKeys={effectiveKeys}
              isCustom={isCustom}
              isRecording={isRecording}
              recordingKeys={recordingKeys}
              conflictWarning={conflictWarning}
              onStartRecord={() => onStartRecord(s.id)}
              onReset={() => onReset(s.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Main dialog ──────────────────────────────────────────

function KeyboardShortcutsDialogInner({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [recordingKeys, setRecordingKeys] = useState<string | null>(null)

  const customBindings = useShortcutsStore((s) => s.customBindings)
  const setCustomBinding = useShortcutsStore((s) => s.setCustomBinding)
  const resetBinding = useShortcutsStore((s) => s.resetBinding)
  const resetAll = useShortcutsStore((s) => s.resetAll)

  const hasCustomBindings = Object.keys(customBindings).length > 0

  useEffect(() => {
    dialogRef.current?.showModal()
    searchRef.current?.focus()
  }, [])

  // Filter shortcuts by search query
  const filtered = useMemo(() => {
    if (!query.trim()) return SHORTCUTS
    const q = query.toLowerCase()
    return SHORTCUTS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        getEffectiveKeys(s, customBindings).toLowerCase().includes(q),
    )
  }, [query, customBindings])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<ShortcutCategory, ShortcutDef[]>()
    for (const cat of SHORTCUT_CATEGORIES) {
      const items = filtered.filter((s) => s.category === cat)
      if (items.length > 0) map.set(cat, items)
    }
    return map
  }, [filtered])

  // ── Recording logic ───────────────────────────────────

  const startRecording = useCallback((id: string) => {
    setRecordingId(id)
    setRecordingKeys(null)
  }, [])

  const cancelRecording = useCallback(() => {
    setRecordingId(null)
    setRecordingKeys(null)
  }, [])

  const confirmRecording = useCallback(() => {
    if (recordingId && recordingKeys) {
      setCustomBinding(recordingId, recordingKeys)
    }
    setRecordingId(null)
    setRecordingKeys(null)
  }, [recordingId, recordingKeys, setCustomBinding])

  // Capture key events during recording
  useEffect(() => {
    if (!recordingId) return

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.key === 'Escape') {
        cancelRecording()
        return
      }

      if (e.key === 'Enter' && recordingKeys) {
        confirmRecording()
        return
      }

      const keys = keyEventToKeys(e)
      if (keys) setRecordingKeys(keys)
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [recordingId, recordingKeys, cancelRecording, confirmRecording])

  // Close on Escape (when not recording)
  const handleDialogKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !recordingId) {
        e.preventDefault()
        onClose()
      }
    },
    [onClose, recordingId],
  )

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-140 max-h-[80vh] rounded-xl border border-gray-200/80 bg-white p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800"
      onClose={onClose}
      onKeyDown={handleDialogKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200/80 px-5 py-3 dark:border-gray-700/60">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h2>
        <div className="flex items-center gap-2">
          {hasCustomBindings && (
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              onClick={resetAll}
              title="Reset all shortcuts to defaults"
            >
              Reset All
            </button>
          )}
          <button
            type="button"
            aria-label="Close"
            className="rounded-md p-1 text-gray-400 transition-all duration-150 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
            onClick={onClose}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2.5 border-b border-gray-200/80 px-5 py-2 dark:border-gray-700/60">
        <Search size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shortcuts..."
          aria-label="Search shortcuts"
          className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Recording hint */}
      {recordingId && (
        <div className="border-b border-blue-100 bg-blue-50/50 px-5 py-2 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-300">
          Press a key combination to rebind, <kbd className="rounded border border-blue-200 px-1 dark:border-blue-500/30">Enter</kbd> to confirm, <kbd className="rounded border border-blue-200 px-1 dark:border-blue-500/30">Esc</kbd> to cancel
        </div>
      )}

      {/* Shortcuts list */}
      <div className="custom-scrollbar max-h-[55vh] overflow-y-auto px-2 py-3">
        {grouped.size === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No shortcuts found
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Array.from(grouped.entries()).map(([category, shortcuts]) => (
              <CategorySection
                key={category}
                category={category}
                shortcuts={shortcuts}
                customBindings={customBindings}
                recordingId={recordingId}
                recordingKeys={recordingKeys}
                onStartRecord={startRecording}
                onReset={resetBinding}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 border-t border-gray-200/80 px-5 py-2 text-[10px] text-gray-400 dark:border-gray-700/60 dark:text-gray-500">
        <span>Click a shortcut to rebind</span>
        <span className="mx-1">·</span>
        <span>Custom bindings are saved in your browser</span>
      </div>
    </dialog>
  )
}

export function KeyboardShortcutsDialog() {
  const open = useShortcutsStore((s) => s.open)
  const setOpen = useShortcutsStore((s) => s.setOpen)
  const handleClose = useCallback(() => setOpen(false), [setOpen])

  if (!open) return null
  return <KeyboardShortcutsDialogInner onClose={handleClose} />
}
