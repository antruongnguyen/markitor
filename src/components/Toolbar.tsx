import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorView } from '@codemirror/view'
import { undo, redo } from '@codemirror/commands'
import { openSearchPanel, closeSearchPanel } from '@codemirror/search'
import type { LucideIcon } from 'lucide-react'
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Link,
  Image,
  FileCode,
  Minus,
  Search,
  Table,
  AlignLeft,
  Smile,
  BarChart3,
  Superscript,
  Subscript,
  IndentIncrease,
  IndentDecrease,
  ChevronDown,
  MoveVertical,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import {
  toggleBold,
  toggleItalic,
  toggleStrikethrough,
  toggleHeading,
  toggleUnorderedList,
  toggleOrderedList,
  toggleTaskList,
  toggleLink,
  toggleInlineCode,
  toggleCodeBlock,
  toggleSuperscript,
  toggleSubscript,
  insertBlockquote,
  insertHorizontalRule,
  insertTable,
  indentLines,
  outdentLines,
  formatDocument,
} from '../utils/editorCommands'
import { useToastStore } from '../store/toastStore'
import { useEditorStore } from '../store/editorStore'
import { useEmojiPickerStore } from '../store/emojiPickerStore'
import { useStatsStore } from '../store/statsStore'
import { useSearchStore } from '../store/searchStore'
import { useFocusModeStore } from '../store/focusModeStore'
import { useLintStore } from '../store/lintStore'
import { useFrontmatterStore } from '../store/frontmatterStore'
import { tooltipWithShortcut, formatKeysInline, getShortcutById, getEffectiveKeys } from '../utils/shortcuts'
import { TableGridPicker } from './TableGridPicker'
import { EmojiPicker } from './EmojiPicker'
import { ImageInsertDialog } from './ImageInsertDialog'

type ToolbarButton = {
  icon: LucideIcon
  label: string
  shortcutId?: string
  action: (view: EditorView) => boolean
}

const btnClass =
  'flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 active:scale-95 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'

const separatorClass = 'mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700'

const buttons: (ToolbarButton | 'separator')[] = [
  { icon: Undo2, label: 'Undo', shortcutId: 'format.undo', action: (v) => undo(v) },
  { icon: Redo2, label: 'Redo', shortcutId: 'format.redo', action: (v) => redo(v) },
  'separator',
  { icon: Bold, label: 'Bold', shortcutId: 'format.bold', action: toggleBold },
  { icon: Italic, label: 'Italic', shortcutId: 'format.italic', action: toggleItalic },
  { icon: Strikethrough, label: 'Strikethrough', shortcutId: 'format.strikethrough', action: toggleStrikethrough },
  { icon: Code, label: 'Inline code', shortcutId: 'format.inline-code', action: toggleInlineCode },
  { icon: Superscript, label: 'Superscript', action: toggleSuperscript },
  { icon: Subscript, label: 'Subscript', action: toggleSubscript },
  'separator',
]

const headingItems: { level: 1 | 2 | 3 | 4 | 5 | 6; icon: LucideIcon; label: string; shortcutId: string }[] = [
  { level: 1, icon: Heading1, label: 'Heading 1', shortcutId: 'format.h1' },
  { level: 2, icon: Heading2, label: 'Heading 2', shortcutId: 'format.h2' },
  { level: 3, icon: Heading3, label: 'Heading 3', shortcutId: 'format.h3' },
  { level: 4, icon: Heading4, label: 'Heading 4', shortcutId: 'format.h4' },
  { level: 5, icon: Heading5, label: 'Heading 5', shortcutId: 'format.h5' },
  { level: 6, icon: Heading6, label: 'Heading 6', shortcutId: 'format.h6' },
]

const listButtons: (ToolbarButton | 'separator')[] = [
  { icon: List, label: 'Unordered list', shortcutId: 'format.ul', action: toggleUnorderedList },
  { icon: ListOrdered, label: 'Ordered list', shortcutId: 'format.ol', action: toggleOrderedList },
  { icon: ListChecks, label: 'Task list', shortcutId: 'format.task-list', action: toggleTaskList },
  { icon: Quote, label: 'Blockquote', shortcutId: 'format.blockquote', action: insertBlockquote },
  { icon: IndentIncrease, label: 'Indent', action: indentLines },
  { icon: IndentDecrease, label: 'Outdent', action: outdentLines },
  'separator',
  { icon: Link, label: 'Link', shortcutId: 'format.link', action: toggleLink },
  { icon: FileCode, label: 'Code block', shortcutId: 'format.code-block', action: toggleCodeBlock },
  { icon: Minus, label: 'Horizontal rule', action: insertHorizontalRule },
  'separator',
  { icon: AlignLeft, label: 'Format Document', shortcutId: 'format.document', action: formatDocument },
]

type ToolbarProps = {
  getView: () => EditorView | null
}

function HeadingDropdown({ getView }: { getView: () => EditorView | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Headings"
        aria-label="Headings"
        aria-expanded={open}
        className={btnClass + ' gap-0.5'}
        onMouseDown={(e) => {
          e.preventDefault()
          setOpen((prev) => !prev)
        }}
      >
        <Heading size={17} strokeWidth={1.5} />
        <ChevronDown size={12} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-gray-200/80 bg-white py-1 shadow-lg dark:border-gray-700/60 dark:bg-gray-800">
          {headingItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.level}
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                onMouseDown={(e) => {
                  e.preventDefault()
                  const view = getView()
                  if (view) {
                    toggleHeading(view, item.level)
                    view.focus()
                  }
                  setOpen(false)
                }}
              >
                <Icon size={16} strokeWidth={1.5} />
                <span className="flex-1">{item.label}</span>
                <kbd className="text-[10px] text-gray-400 dark:text-gray-500">
                  {(() => {
                    const s = getShortcutById(item.shortcutId)
                    return s ? formatKeysInline(getEffectiveKeys(s)) : ''
                  })()}
                </kbd>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Toolbar({ getView }: ToolbarProps) {
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const showEmojiPicker = useEmojiPickerStore((s) => s.open)
  const toggleEmojiPicker = useEmojiPickerStore((s) => s.toggle)
  const closeEmojiPicker = useEmojiPickerStore((s) => s.setOpen)
  const statsOpen = useStatsStore((s) => s.open)
  const toggleStats = useStatsStore((s) => s.toggle)
  const typewriterMode = useFocusModeStore((s) => s.typewriterMode)
  const toggleTypewriter = useFocusModeStore((s) => s.toggleTypewriter)
  const lintEnabled = useLintStore((s) => s.enabled)
  const toggleLint = useLintStore((s) => s.toggle)
  const frontmatterExpanded = useFrontmatterStore((s) => s.expanded)
  const frontmatterExists = useFrontmatterStore((s) => s.hasFrontmatter)
  const toggleFrontmatter = useFrontmatterStore((s) => s.toggle)
  const searchOpen = useSearchStore((s) => s.isOpen)
  const tableButtonRef = useRef<HTMLButtonElement>(null)
  const imageButtonRef = useRef<HTMLButtonElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
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

  const handleEmojiInsert = useCallback(
    (emoji: string) => {
      const view = getView()
      if (!view) return
      const { state } = view
      const range = state.selection.main
      view.dispatch({
        changes: { from: range.from, to: range.to, insert: emoji },
        selection: { anchor: range.from + emoji.length },
        scrollIntoView: true,
      })
      view.focus()
      closeEmojiPicker(false)
    },
    [getView, closeEmojiPicker],
  )

  const renderButton = (item: ToolbarButton | 'separator', i: number) => {
    if (item === 'separator') {
      return <div key={`sep-${i}`} className={separatorClass} />
    }
    const Icon = item.icon
    const title = item.shortcutId
      ? tooltipWithShortcut(item.label, item.shortcutId)
      : item.label
    return (
      <button
        key={title}
        type="button"
        title={title}
        aria-label={item.label}
        className={btnClass}
        onMouseDown={(e) => {
          e.preventDefault()
          handleClick(item.action)
        }}
      >
        <Icon size={17} strokeWidth={1.5} />
      </button>
    )
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-gray-200/80 bg-gray-50/50 px-2 py-0.5 transition-colors duration-200 dark:border-gray-700/60 dark:bg-gray-800/50">
      {buttons.map(renderButton)}

      {/* Heading dropdown */}
      <HeadingDropdown getView={getView} />

      <div className={separatorClass} />

      {listButtons.map(renderButton)}

      {/* Image insert button with dialog */}
      <button
        ref={imageButtonRef}
        type="button"
        title="Insert image"
        aria-label="Insert image"
        className={btnClass}
        onMouseDown={(e) => {
          e.preventDefault()
          setShowImageDialog((prev) => !prev)
        }}
      >
        <Image size={17} strokeWidth={1.5} />
      </button>
      {showImageDialog && (
        <ImageInsertDialog
          anchorRef={imageButtonRef}
          getView={getView}
          onClose={() => setShowImageDialog(false)}
        />
      )}

      {/* Table insert button with grid picker */}
      <button
        ref={tableButtonRef}
        type="button"
        title="Insert table"
        aria-label="Insert table"
        className={btnClass}
        onMouseDown={(e) => {
          e.preventDefault()
          setShowTablePicker((prev) => !prev)
        }}
      >
        <Table size={17} strokeWidth={1.5} />
      </button>
      {showTablePicker && (
        <TableGridPicker
          anchorRef={tableButtonRef}
          onSelect={handleTableInsert}
          onClose={() => setShowTablePicker(false)}
        />
      )}

      {/* Emoji picker button */}
      <button
        ref={emojiButtonRef}
        type="button"
        title={tooltipWithShortcut('Insert emoji', 'format.emoji')}
        aria-label="Insert emoji"
        className={btnClass}
        onMouseDown={(e) => {
          e.preventDefault()
          toggleEmojiPicker()
        }}
      >
        <Smile size={17} strokeWidth={1.5} />
      </button>
      {showEmojiPicker && (
        <EmojiPicker
          anchorRef={emojiButtonRef}
          onSelect={handleEmojiInsert}
          onClose={() => closeEmojiPicker(false)}
        />
      )}

      <div className={separatorClass} />

      {/* Search toggle */}
      <button
        type="button"
        title={tooltipWithShortcut('Find & Replace', 'search.find')}
        aria-label="Find & Replace"
        aria-pressed={searchOpen}
        className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 transition-all duration-150 active:scale-95 ${
          searchOpen
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
        }`}
        onMouseDown={(e) => {
          e.preventDefault()
          const view = getView()
          if (!view) return
          if (searchOpen) {
            closeSearchPanel(view)
          } else {
            openSearchPanel(view)
          }
        }}
      >
        <Search size={17} strokeWidth={1.5} />
      </button>

      {/* Writing statistics toggle */}
      <button
        type="button"
        title={tooltipWithShortcut('Writing statistics', 'view.stats')}
        aria-label="Writing statistics"
        aria-pressed={statsOpen}
        className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 transition-all duration-150 active:scale-95 ${
          statsOpen
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
        }`}
        onMouseDown={(e) => {
          e.preventDefault()
          toggleStats()
        }}
      >
        <BarChart3 size={17} strokeWidth={1.5} />
      </button>

      {/* Typewriter mode toggle */}
      <button
        type="button"
        title={tooltipWithShortcut('Typewriter mode', 'view.typewriter')}
        aria-label="Typewriter mode"
        aria-pressed={typewriterMode}
        className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 transition-all duration-150 active:scale-95 ${
          typewriterMode
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
        }`}
        onMouseDown={(e) => {
          e.preventDefault()
          toggleTypewriter()
        }}
      >
        <MoveVertical size={17} strokeWidth={1.5} />
      </button>

      {/* Lint toggle */}
      <button
        type="button"
        title="Toggle markdown linting"
        aria-label="Toggle markdown linting"
        aria-pressed={lintEnabled}
        className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 transition-all duration-150 active:scale-95 ${
          lintEnabled
            ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
        }`}
        onMouseDown={(e) => {
          e.preventDefault()
          toggleLint()
        }}
      >
        <AlertTriangle size={17} strokeWidth={1.5} />
      </button>

      {/* Frontmatter toggle */}
      <button
        type="button"
        title={tooltipWithShortcut('Toggle Frontmatter', 'view.frontmatter')}
        aria-label="Toggle Frontmatter"
        aria-pressed={frontmatterExpanded}
        className={`relative flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 transition-all duration-150 active:scale-95 ${
          frontmatterExpanded
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
        }`}
        onMouseDown={(e) => {
          e.preventDefault()
          toggleFrontmatter()
        }}
      >
        <FileText size={17} strokeWidth={1.5} />
        {!frontmatterExpanded && frontmatterExists && (
          <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
        )}
      </button>

    </div>
  )
}
