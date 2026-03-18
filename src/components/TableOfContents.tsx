import { useMemo, useCallback, useState, useEffect } from 'react'
import { EditorView } from '@codemirror/view'
import { useEditorStore } from '../store/editorStore'
import { extractHeadings } from '../utils/headings'
import { editorViewRef } from '../utils/editorViewRef'

export function TableOfContents() {
  const content = useEditorStore((s) => s.content)
  const cursorLine = useEditorStore((s) => s.cursorLine)

  // Debounce content for heading extraction (300ms)
  const [debouncedContent, setDebouncedContent] = useState(content)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedContent(content), 300)
    return () => clearTimeout(id)
  }, [content])

  const headings = useMemo(() => extractHeadings(debouncedContent), [debouncedContent])

  // Active heading = last heading at or above cursor line
  const activeLine = useMemo(() => {
    let active = -1
    for (const h of headings) {
      if (h.line <= cursorLine) active = h.line
      else break
    }
    return active
  }, [headings, cursorLine])

  const handleClick = useCallback((line: number) => {
    const view = editorViewRef.current
    if (!view) return
    const lineInfo = view.state.doc.line(line)
    view.dispatch({
      selection: { anchor: lineInfo.from },
      effects: EditorView.scrollIntoView(lineInfo.from, { y: 'start' }),
    })
    view.focus()
  }, [])

  return (
    <aside className="flex h-full w-[200px] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-800">
      <div className="shrink-0 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        Contents
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
        {headings.length === 0 ? (
          <div className="px-2 py-1 text-xs italic text-gray-400 dark:text-gray-500">
            No headings found
          </div>
        ) : (
          headings.map((h) => (
            <button
              key={`${h.line}`}
              type="button"
              className={`w-full truncate rounded px-2 py-1 text-left text-xs transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${
                h.line === activeLine
                  ? 'bg-blue-100 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
              style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
              onClick={() => handleClick(h.line)}
              title={h.text}
            >
              {h.text}
            </button>
          ))
        )}
      </nav>
    </aside>
  )
}
