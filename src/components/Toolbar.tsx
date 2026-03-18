import { useCallback } from 'react'
import type { EditorView } from '@codemirror/view'
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
} from '../utils/editorCommands'

type ToolbarButton = {
  label: string
  title: string
  action: (view: EditorView) => boolean
}

const buttons: (ToolbarButton | 'separator')[] = [
  { label: 'B', title: 'Bold (Ctrl+B)', action: toggleBold },
  { label: 'I', title: 'Italic (Ctrl+I)', action: toggleItalic },
  { label: 'S', title: 'Strikethrough', action: toggleStrikethrough },
  { label: '</>', title: 'Inline code', action: toggleInlineCode },
  'separator',
  { label: 'H1', title: 'Heading 1 (Ctrl+1)', action: (v) => toggleHeading(v, 1) },
  { label: 'H2', title: 'Heading 2 (Ctrl+2)', action: (v) => toggleHeading(v, 2) },
  { label: 'H3', title: 'Heading 3 (Ctrl+3)', action: (v) => toggleHeading(v, 3) },
  'separator',
  { label: '•', title: 'Unordered list (Ctrl+L)', action: toggleUnorderedList },
  { label: '1.', title: 'Ordered list (Ctrl+Shift+L)', action: toggleOrderedList },
  { label: '❝', title: 'Blockquote', action: insertBlockquote },
  'separator',
  { label: '🔗', title: 'Link (Ctrl+K)', action: toggleLink },
  { label: '🖼', title: 'Image', action: toggleImage },
  { label: '{ }', title: 'Code block (Ctrl+Shift+K)', action: toggleCodeBlock },
  { label: '—', title: 'Horizontal rule', action: insertHorizontalRule },
]

type ToolbarProps = {
  getView: () => EditorView | null
}

export function Toolbar({ getView }: ToolbarProps) {
  const handleClick = useCallback(
    (action: (view: EditorView) => boolean) => {
      const view = getView()
      if (!view) return
      action(view)
      view.focus()
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
    </div>
  )
}
