import { useMemo } from 'react'
import { WifiOff, CloudOff, Check, Loader2, MoveVertical, AlertTriangle } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import { useLayoutStore } from '../store/layoutStore'
import { usePWAStore } from '../store/pwaStore'
import { useAutosaveStore } from '../store/autosaveStore'
import { useFocusModeStore } from '../store/focusModeStore'
import { useLintStore } from '../store/lintStore'

const layoutModeLabels = {
  editor: 'Editor',
  split: 'Split',
  preview: 'Preview',
} as const

function computeStats(content: string) {
  const words = content.split(/\s+/).filter(Boolean).length
  const characters = content.length
  const lines = content.split('\n').length
  const readingTime = Math.max(1, Math.ceil(words / 200))
  return { words, characters, lines, readingTime }
}

export function StatusBar() {
  const content = useEditorStore((s) => s.content)
  const cursorLine = useEditorStore((s) => s.cursorLine)
  const cursorColumn = useEditorStore((s) => s.cursorColumn)
  const layoutMode = useLayoutStore((s) => s.mode)
  const cycleMode = useLayoutStore((s) => s.cycleMode)
  const online = usePWAStore((s) => s.online)
  const autosaveStatus = useAutosaveStore((s) => s.status)
  const autosaveEnabled = useAutosaveStore((s) => s.enabled)
  const typewriterMode = useFocusModeStore((s) => s.typewriterMode)
  const lintEnabled = useLintStore((s) => s.enabled)

  const { words, characters, lines, readingTime } = useMemo(() => computeStats(content), [content])

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-gray-200/80 bg-gray-50/80 px-3 text-[11px] tabular-nums text-gray-500 transition-colors duration-200 dark:border-gray-700/60 dark:bg-gray-800/80 dark:text-gray-400">
      <div className="flex items-center gap-2.5">
        <span>{words} words</span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <span>{characters} chars</span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <span>{lines} lines</span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <span>{readingTime} min read</span>
      </div>
      <div className="flex items-center gap-2.5">
        {autosaveEnabled && autosaveStatus === 'saving' && (
          <>
            <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400" title="Auto-saving...">
              <Loader2 size={11} strokeWidth={1.5} className="animate-spin" />
              Saving
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
          </>
        )}
        {autosaveEnabled && autosaveStatus === 'saved' && (
          <>
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400" title="Auto-saved">
              <Check size={11} strokeWidth={2} />
              Saved
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
          </>
        )}
        {!autosaveEnabled && (
          <>
            <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500" title="Auto-save disabled">
              <CloudOff size={11} strokeWidth={1.5} />
              No auto-save
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
          </>
        )}
        {!online && (
          <>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title="You are offline — AI features unavailable">
              <WifiOff size={12} strokeWidth={1.5} />
              Offline
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
          </>
        )}
        {typewriterMode && (
          <>
            <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400" title="Typewriter mode — cursor stays centered">
              <MoveVertical size={11} strokeWidth={1.5} />
              Typewriter
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
          </>
        )}
        {lintEnabled && (
          <>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title="Markdown linting enabled">
              <AlertTriangle size={11} strokeWidth={1.5} />
              Lint
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
          </>
        )}
        <span>Ln {cursorLine}, Col {cursorColumn}</span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <button
          type="button"
          className="transition-colors duration-150 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={cycleMode}
          title="Click to cycle layout mode"
        >
          {layoutModeLabels[layoutMode]}
        </button>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <span>Markdown</span>
      </div>
    </footer>
  )
}
