import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorSelection } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import {
  parseTableAtCursor,
  generateTable,
  addRow,
  deleteRow,
  addColumn,
  deleteColumn,
  setColumnAlignment,
  type ParsedTable,
  type TableAlignment,
} from '../utils/tableUtils'

type TableToolbarProps = {
  getView: () => EditorView | null
}

export function TableToolbar({ getView }: TableToolbarProps) {
  const [table, setTable] = useState<ParsedTable | null>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  // Poll for table context on selection/doc changes
  useEffect(() => {
    const check = () => {
      const view = getView()
      if (!view) {
        setTable(null)
        setPosition(null)
        return
      }

      const parsed = parseTableAtCursor(view)
      setTable(parsed)

      if (parsed) {
        const pos = view.state.selection.main.head
        const coords = view.coordsAtPos(pos)
        if (coords) {
          const editorRect = view.dom.getBoundingClientRect()
          setPosition({
            top: coords.top - editorRect.top - 36,
            left: Math.max(0, coords.left - editorRect.left),
          })
        }
      } else {
        setPosition(null)
      }
    }

    // Check on an interval synchronized with animation frames
    const poll = () => {
      check()
      rafRef.current = requestAnimationFrame(poll)
    }

    // Use a less aggressive polling — check every 200ms
    const intervalId = setInterval(check, 200)

    return () => {
      clearInterval(intervalId)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [getView])

  const applyTableChange = useCallback(
    (result: { headers: string[]; alignments: TableAlignment[]; rows: string[][] } | null) => {
      if (!result || !table) return
      const view = getView()
      if (!view) return

      const newText = generateTable(result.headers, result.alignments, result.rows)
      const cursorOffset = Math.min(
        view.state.selection.main.head - table.from,
        newText.length,
      )

      view.dispatch({
        changes: { from: table.from, to: table.to, insert: newText },
        selection: EditorSelection.single(table.from + Math.max(0, cursorOffset)),
        scrollIntoView: true,
      })
      view.focus()
    },
    [table, getView],
  )

  const handleAddRowAbove = useCallback(() => {
    if (!table) return
    const idx = table.cursorRow >= 0 ? table.cursorRow : 0
    applyTableChange(addRow(table, idx))
  }, [table, applyTableChange])

  const handleAddRowBelow = useCallback(() => {
    if (!table) return
    const idx = table.cursorRow >= 0 ? table.cursorRow + 1 : table.rows.length
    applyTableChange(addRow(table, idx))
  }, [table, applyTableChange])

  const handleDeleteRow = useCallback(() => {
    if (!table || table.cursorRow < 0) return
    applyTableChange(deleteRow(table, table.cursorRow))
  }, [table, applyTableChange])

  const handleAddColLeft = useCallback(() => {
    if (!table) return
    applyTableChange(addColumn(table, table.cursorCol))
  }, [table, applyTableChange])

  const handleAddColRight = useCallback(() => {
    if (!table) return
    applyTableChange(addColumn(table, table.cursorCol + 1))
  }, [table, applyTableChange])

  const handleDeleteCol = useCallback(() => {
    if (!table) return
    applyTableChange(deleteColumn(table, table.cursorCol))
  }, [table, applyTableChange])

  const handleAlign = useCallback(
    (alignment: TableAlignment) => {
      if (!table) return
      applyTableChange(setColumnAlignment(table, table.cursorCol, alignment))
    },
    [table, applyTableChange],
  )

  if (!table || !position) return null

  return (
    <div
      ref={toolbarRef}
      className="pointer-events-auto absolute z-40 flex items-center gap-0.5 rounded-md border border-gray-200 bg-white px-1 py-0.5 shadow-md dark:border-gray-600 dark:bg-gray-800"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Row operations */}
      <button
        type="button"
        title="Add row above"
        className="flex h-6 items-center rounded px-1.5 text-[10px] text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        onClick={handleAddRowAbove}
      >
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
        </svg>
        <span className="ml-0.5">↑Row</span>
      </button>
      <button
        type="button"
        title="Add row below"
        className="flex h-6 items-center rounded px-1.5 text-[10px] text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        onClick={handleAddRowBelow}
      >
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
        </svg>
        <span className="ml-0.5">↓Row</span>
      </button>
      <button
        type="button"
        title="Delete row"
        className="flex h-6 items-center rounded px-1.5 text-[10px] text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        onClick={handleDeleteRow}
        disabled={table.cursorRow < 0 || table.rows.length <= 1}
      >
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
        </svg>
        <span className="ml-0.5">Row</span>
      </button>

      <div className="mx-0.5 h-4 w-px bg-gray-300 dark:bg-gray-600" />

      {/* Column operations */}
      <button
        type="button"
        title="Add column left"
        className="flex h-6 items-center rounded px-1.5 text-[10px] text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        onClick={handleAddColLeft}
      >
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
        </svg>
        <span className="ml-0.5">←Col</span>
      </button>
      <button
        type="button"
        title="Add column right"
        className="flex h-6 items-center rounded px-1.5 text-[10px] text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        onClick={handleAddColRight}
      >
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
        </svg>
        <span className="ml-0.5">→Col</span>
      </button>
      <button
        type="button"
        title="Delete column"
        className="flex h-6 items-center rounded px-1.5 text-[10px] text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        onClick={handleDeleteCol}
        disabled={table.headers.length <= 1}
      >
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
        </svg>
        <span className="ml-0.5">Col</span>
      </button>

      <div className="mx-0.5 h-4 w-px bg-gray-300 dark:bg-gray-600" />

      {/* Alignment */}
      <button
        type="button"
        title="Align left"
        className={`flex h-6 w-6 items-center justify-center rounded text-[10px] hover:bg-gray-100 dark:hover:bg-gray-700 ${
          table.alignments[table.cursorCol] === 'left'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}
        onClick={() => handleAlign('left')}
      >
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
        </svg>
      </button>
      <button
        type="button"
        title="Align center"
        className={`flex h-6 w-6 items-center justify-center rounded text-[10px] hover:bg-gray-100 dark:hover:bg-gray-700 ${
          table.alignments[table.cursorCol] === 'center'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}
        onClick={() => handleAlign('center')}
      >
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
        </svg>
      </button>
      <button
        type="button"
        title="Align right"
        className={`flex h-6 w-6 items-center justify-center rounded text-[10px] hover:bg-gray-100 dark:hover:bg-gray-700 ${
          table.alignments[table.cursorCol] === 'right'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}
        onClick={() => handleAlign('right')}
      >
        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
        </svg>
      </button>
    </div>
  )
}
