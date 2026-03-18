import { useMemo } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useLayoutStore } from '../store/layoutStore'

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

  const { words, characters, lines, readingTime } = useMemo(() => computeStats(content), [content])

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-gray-200 bg-gray-100 px-3 text-xs text-gray-500 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
      <div className="flex items-center gap-3">
        <span>{words} words</span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>{characters} chars</span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>{lines} lines</span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>{readingTime} min read</span>
      </div>
      <div className="flex items-center gap-3">
        <span>Ln {cursorLine}, Col {cursorColumn}</span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <button
          type="button"
          className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          onClick={cycleMode}
          title="Click to cycle layout mode"
        >
          {layoutModeLabels[layoutMode]}
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>Markdown</span>
      </div>
    </footer>
  )
}
