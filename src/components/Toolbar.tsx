import { useCallback, useState } from 'react'
import type { EditorView } from '@codemirror/view'
import { openSearchPanel } from '@codemirror/search'
import type { LucideIcon } from 'lucide-react'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  FileCode,
  Minus,
  Search,
  Table,
  AlignLeft,
} from 'lucide-react'
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
  formatDocument,
} from '../utils/editorCommands'
import { useToastStore } from '../store/toastStore'
import { useEditorStore } from '../store/editorStore'
import { TableGridPicker } from './TableGridPicker'
import { ThemePicker } from './ThemePicker'

type ToolbarButton = {
  icon: LucideIcon
  title: string
  action: (view: EditorView) => boolean
}

const buttons: (ToolbarButton | 'separator')[] = [
  { icon: Bold, title: 'Bold (Ctrl+B)', action: toggleBold },
  { icon: Italic, title: 'Italic (Ctrl+I)', action: toggleItalic },
  { icon: Strikethrough, title: 'Strikethrough (Ctrl+Shift+X)', action: toggleStrikethrough },
  { icon: Code, title: 'Inline code (Ctrl+E)', action: toggleInlineCode },
  'separator',
  { icon: Heading1, title: 'Heading 1 (Ctrl+1)', action: (v) => toggleHeading(v, 1) },
  { icon: Heading2, title: 'Heading 2 (Ctrl+2)', action: (v) => toggleHeading(v, 2) },
  { icon: Heading3, title: 'Heading 3 (Ctrl+3)', action: (v) => toggleHeading(v, 3) },
  'separator',
  { icon: List, title: 'Unordered list (Ctrl+L)', action: toggleUnorderedList },
  { icon: ListOrdered, title: 'Ordered list (Ctrl+Shift+L)', action: toggleOrderedList },
  { icon: Quote, title: 'Blockquote (Ctrl+Shift+Q)', action: insertBlockquote },
  'separator',
  { icon: Link, title: 'Link (Ctrl+K)', action: toggleLink },
  { icon: Image, title: 'Image', action: toggleImage },
  { icon: FileCode, title: 'Code block (Ctrl+Shift+K)', action: toggleCodeBlock },
  { icon: Minus, title: 'Horizontal rule', action: insertHorizontalRule },
  'separator',
  { icon: Search, title: 'Find & Replace (Ctrl+F)', action: openSearchPanel },
  'separator',
  { icon: AlignLeft, title: 'Format Document (Alt+Shift+F)', action: formatDocument },
]

type ToolbarProps = {
  getView: () => EditorView | null
}

export function Toolbar({ getView }: ToolbarProps) {
  const [showTablePicker, setShowTablePicker] = useState(false)
  const showToast = useToastStore((s) => s.show)

  const handleClick = useCallback(
    (action: (view: EditorView) => boolean) => {
      const view = getView()
      if (!view) return
      action(view)
      view.focus()
      if (action === formatDocument) {
        useEditorStore.getState().setDirty(true)
        showToast('Document formatted')
      }
    },
    [getView, showToast],
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

        const Icon = item.icon

        return (
          <button
            key={item.title}
            type="button"
            title={item.title}
            className="flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            onMouseDown={(e) => {
              e.preventDefault()
              handleClick(item.action)
            }}
          >
            <Icon size={18} strokeWidth={1.5} />
          </button>
        )
      })}

      {/* Table insert button with grid picker */}
      <div className="relative">
        <button
          type="button"
          title="Insert table"
          className="flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          onMouseDown={(e) => {
            e.preventDefault()
            setShowTablePicker((prev) => !prev)
          }}
        >
          <Table size={18} strokeWidth={1.5} />
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
