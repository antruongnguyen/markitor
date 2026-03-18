import { useCallback, useState } from 'react'
import type { EditorView } from '@codemirror/view'
import { openSearchPanel } from '@codemirror/search'
import {
  toggleBold,
  toggleItalic,
  toggleStrikethrough,
  toggleHeading,
  toggleUnorderedList,
  toggleOrderedList,
  toggleLink,
  toggleImage,
  toggleInlineCode,
  toggleCodeBlock,
  insertBlockquote,
  insertHorizontalRule,
  insertTable,
} from '../utils/editorCommands'
import { TableGridPicker } from './TableGridPicker'
import { ThemePicker } from './ThemePicker'

type ToolbarButton = {
  label: string
  title: string
  action: (view: EditorView) => boolean
}

const buttons: (ToolbarButton | 'separator')[] = [
  { label: 'B', title: 'Bold (Ctrl+B)', action: toggleBold },
  { label: 'I', title: 'Italic (Ctrl+I)', action: toggleItalic },
  { label: 'S', title: 'Strikethrough (Ctrl+Shift+X)', action: toggleStrikethrough },
  { label: '</>', title: 'Inline code (Ctrl+E)', action: toggleInlineCode },
  'separator',
  { label: 'H1', title: 'Heading 1 (Ctrl+1)', action: (v) => toggleHeading(v, 1) },
  { label: 'H2', title: 'Heading 2 (Ctrl+2)', action: (v) => toggleHeading(v, 2) },
  { label: 'H3', title: 'Heading 3 (Ctrl+3)', action: (v) => toggleHeading(v, 3) },
  'separator',
  { label: '•', title: 'Unordered list (Ctrl+L)', action: toggleUnorderedList },
  { label: '1.', title: 'Ordered list (Ctrl+Shift+L)', action: toggleOrderedList },
  { label: '❝', title: 'Blockquote (Ctrl+Shift+Q)', action: insertBlockquote },
  'separator',
  { label: '🔗', title: 'Link (Ctrl+K)', action: toggleLink },
  { label: '🖼', title: 'Image', action: toggleImage },
  { label: '{ }', title: 'Code block (Ctrl+Shift+K)', action: toggleCodeBlock },
  { label: '—', title: 'Horizontal rule', action: insertHorizontalRule },
  'separator',
  { label: '🔍', title: 'Find & Replace (Ctrl+F)', action: openSearchPanel },
]

type ToolbarProps = {
  getView: () => EditorView | null
}

export function Toolbar({ getView }: ToolbarProps) {
  const [showTablePicker, setShowTablePicker] = useState(false)

  const handleClick = useCallback(
    (action: (view: EditorView) => boolean) => {
      const view = getView()
      if (!view) return
      action(view)
      view.focus()
    },
    [getView],
  )

  const handleTableInsert = useCallback(
    (rows: number, cols: number) => {
      const view = getView()
      if (!view) return
      insertTable(view, rows, cols)
      view.focus()
      setShowTablePicker(false)
    },
    [getView],
  )

  return (
    <div className="flex shrink-0 items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1 transition-colors dark:border-gray-700 dark:bg-gray-800">
      {buttons.map((item, i) => {
        if (item === 'separator') {
          return (
            <div
              key={`sep-${i}`}
              className="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600"
            />
          )
        }

        const isStyled =
          item.label === 'B' ||
          item.label === 'I' ||
          item.label === 'S'

        return (
          <button
            key={item.title}
            type="button"
            title={item.title}
            className={`flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-xs transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${
              isStyled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'
            }`}
            onMouseDown={(e) => {
              e.preventDefault()
              handleClick(item.action)
            }}
          >
            <span
              className={
                item.label === 'B'
                  ? 'font-bold'
                  : item.label === 'I'
                    ? 'italic font-serif'
                    : item.label === 'S'
                      ? 'line-through'
                      : ''
              }
            >
              {item.label}
            </span>
          </button>
        )
      })}

      {/* Table insert button with grid picker */}
      <div className="relative">
        <button
          type="button"
          title="Insert table"
          className="flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          onMouseDown={(e) => {
            e.preventDefault()
            setShowTablePicker((prev) => !prev)
          }}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm1 1v4h6V3H1zm7 0v4h7V3H8zM1 8v4h6V8H1zm7 0v4h7V8H8zM1 13v1a1 1 0 0 0 1 1h5v-2H1zm7 0v2h6a1 1 0 0 0 1-1v-1H8zM1 2a1 1 0 0 1 1-1h5v1H1zm7-1h6a1 1 0 0 1 1 1H8V1z" />
          </svg>
        </button>
        {showTablePicker && (
          <TableGridPicker
            onSelect={handleTableInsert}
            onClose={() => setShowTablePicker(false)}
          />
        )}
      </div>

      {/* Spacer pushes theme picker to the right */}
      <div className="flex-1" />

      <ThemePicker />
    </div>
  )
}
