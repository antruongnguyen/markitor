import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useCommandPaletteStore } from '../store/commandPaletteStore'
import { useThemeStore } from '../store/themeStore'
import { useTocStore } from '../store/tocStore'
import { useAIStore } from '../store/aiStore'
import { useScrollSyncStore } from '../store/scrollSyncStore'
import { useFocusModeStore } from '../store/focusModeStore'
import { useEditorStore } from '../store/editorStore'
import { useTabStore } from '../store/tabStore'
import { useLayoutStore } from '../store/layoutStore'
import { usePWAStore } from '../store/pwaStore'
import { useTemplateGalleryStore } from '../store/templateGalleryStore'
import { useEmojiPickerStore } from '../store/emojiPickerStore'
import { useAutosaveStore } from '../store/autosaveStore'
import { useStatsStore } from '../store/statsStore'
import { useSearchStore } from '../store/searchStore'
import { usePreviewStyleStore } from '../store/previewStyleStore'
import { useShortcutsStore } from '../store/shortcutsStore'
import { useLintStore } from '../store/lintStore'
import { useFrontmatterStore } from '../store/frontmatterStore'
import { useSavedDocumentsStore } from './SavedDocumentsDialog'
import { editorViewRef } from '../utils/editorViewRef'
import { formatKeysInline, getShortcutById, getEffectiveKeys } from '../utils/shortcuts'
import { openSearchPanel, closeSearchPanel } from '@codemirror/search'
import { exportHTML, exportPDF } from '../utils/exportDocument'
import {
  toggleBold,
  toggleItalic,
  toggleStrikethrough,
  toggleInlineCode,
  toggleLink,
  toggleImage,
  toggleCodeBlock,
  toggleHeading,
  toggleUnorderedList,
  toggleOrderedList,
  toggleTaskList,
  toggleSuperscript,
  toggleSubscript,
  insertBlockquote,
  insertHorizontalRule,
  insertFootnote,
  indentLines,
  outdentLines,
  formatDocument,
} from '../utils/editorCommands'
import { useToastStore } from '../store/toastStore'


type Command = {
  id: string
  label: string
  category: string
  shortcut?: string
  execute: () => void
}

/** Look up the effective display shortcut for a registry ID */
function shortcutFor(id: string): string | undefined {
  const s = getShortcutById(id)
  if (!s) return undefined
  return formatKeysInline(getEffectiveKeys(s))
}

function buildCommands(handlers: {
  onOpen: () => void
  onSave: () => void
  onSaveDisk: () => void
}): Command[] {
  const editorCmd = (fn: (view: NonNullable<typeof editorViewRef.current>) => boolean) => () => {
    const view = editorViewRef.current
    if (view) {
      fn(view)
      view.focus()
    }
  }

  return [
    // File commands
    {
      id: 'file.new',
      label: 'New Tab',
      category: 'File',
      execute: () => {
        useTabStore.getState().addTab()
      },
    },
    {
      id: 'file.new-from-template',
      label: 'New from Template',
      category: 'File',
      execute: () => {
        useTemplateGalleryStore.getState().setOpen(true)
      },
    },
    {
      id: 'file.close-tab',
      label: 'Close Tab',
      category: 'File',
      shortcut: shortcutFor('file.close-tab'),
      execute: () => {
        const { activeTabId, closeTab } = useTabStore.getState()
        closeTab(activeTabId)
      },
    },
    {
      id: 'file.open',
      label: 'Open File',
      category: 'File',
      shortcut: shortcutFor('file.open'),
      execute: handlers.onOpen,
    },
    {
      id: 'file.browse-saved',
      label: 'Browse Saved Documents',
      category: 'File',
      execute: () => useSavedDocumentsStore.getState().setOpen(true),
    },
    {
      id: 'file.save',
      label: 'Save to Browser',
      category: 'File',
      shortcut: shortcutFor('file.save'),
      execute: handlers.onSave,
    },
    {
      id: 'file.save-disk',
      label: 'Save to Disk',
      category: 'File',
      shortcut: shortcutFor('file.save-disk'),
      execute: handlers.onSaveDisk,
    },
    {
      id: 'file.export-html',
      label: 'Export as HTML',
      category: 'File',
      execute: () => {
        const { content, fileName } = useEditorStore.getState()
        exportHTML(content, fileName)
      },
    },
    {
      id: 'file.export-pdf',
      label: 'Print / Save as PDF',
      category: 'File',
      execute: () => {
        const { content, fileName } = useEditorStore.getState()
        exportPDF(content, fileName)
      },
    },

    // Formatting commands
    {
      id: 'format.bold',
      label: 'Bold',
      category: 'Format',
      shortcut: shortcutFor('format.bold'),
      execute: editorCmd(toggleBold),
    },
    {
      id: 'format.italic',
      label: 'Italic',
      category: 'Format',
      shortcut: shortcutFor('format.italic'),
      execute: editorCmd(toggleItalic),
    },
    {
      id: 'format.strikethrough',
      label: 'Strikethrough',
      category: 'Format',
      shortcut: shortcutFor('format.strikethrough'),
      execute: editorCmd(toggleStrikethrough),
    },
    {
      id: 'format.inline-code',
      label: 'Inline Code',
      category: 'Format',
      shortcut: shortcutFor('format.inline-code'),
      execute: editorCmd(toggleInlineCode),
    },
    {
      id: 'format.code-block',
      label: 'Code Block',
      category: 'Format',
      shortcut: shortcutFor('format.code-block'),
      execute: editorCmd(toggleCodeBlock),
    },
    {
      id: 'format.link',
      label: 'Insert Link',
      category: 'Format',
      shortcut: shortcutFor('format.link'),
      execute: editorCmd(toggleLink),
    },
    {
      id: 'format.image',
      label: 'Insert Image',
      category: 'Format',
      execute: editorCmd(toggleImage),
    },
    {
      id: 'format.blockquote',
      label: 'Blockquote',
      category: 'Format',
      shortcut: shortcutFor('format.blockquote'),
      execute: editorCmd(insertBlockquote),
    },
    {
      id: 'format.h1',
      label: 'Heading 1',
      category: 'Format',
      shortcut: shortcutFor('format.h1'),
      execute: editorCmd((v) => toggleHeading(v, 1)),
    },
    {
      id: 'format.h2',
      label: 'Heading 2',
      category: 'Format',
      shortcut: shortcutFor('format.h2'),
      execute: editorCmd((v) => toggleHeading(v, 2)),
    },
    {
      id: 'format.h3',
      label: 'Heading 3',
      category: 'Format',
      shortcut: shortcutFor('format.h3'),
      execute: editorCmd((v) => toggleHeading(v, 3)),
    },
    {
      id: 'format.h4',
      label: 'Heading 4',
      category: 'Format',
      shortcut: shortcutFor('format.h4'),
      execute: editorCmd((v) => toggleHeading(v, 4)),
    },
    {
      id: 'format.h5',
      label: 'Heading 5',
      category: 'Format',
      shortcut: shortcutFor('format.h5'),
      execute: editorCmd((v) => toggleHeading(v, 5)),
    },
    {
      id: 'format.h6',
      label: 'Heading 6',
      category: 'Format',
      shortcut: shortcutFor('format.h6'),
      execute: editorCmd((v) => toggleHeading(v, 6)),
    },
    {
      id: 'format.ul',
      label: 'Unordered List',
      category: 'Format',
      shortcut: shortcutFor('format.ul'),
      execute: editorCmd(toggleUnorderedList),
    },
    {
      id: 'format.ol',
      label: 'Ordered List',
      category: 'Format',
      shortcut: shortcutFor('format.ol'),
      execute: editorCmd(toggleOrderedList),
    },
    {
      id: 'format.task-list',
      label: 'Task List',
      category: 'Format',
      shortcut: shortcutFor('format.task-list'),
      execute: editorCmd(toggleTaskList),
    },
    {
      id: 'format.superscript',
      label: 'Superscript',
      category: 'Format',
      execute: editorCmd(toggleSuperscript),
    },
    {
      id: 'format.subscript',
      label: 'Subscript',
      category: 'Format',
      execute: editorCmd(toggleSubscript),
    },
    {
      id: 'format.indent',
      label: 'Indent',
      category: 'Format',
      execute: editorCmd(indentLines),
    },
    {
      id: 'format.outdent',
      label: 'Outdent',
      category: 'Format',
      execute: editorCmd(outdentLines),
    },
    {
      id: 'format.hr',
      label: 'Horizontal Rule',
      category: 'Format',
      execute: editorCmd(insertHorizontalRule),
    },
    {
      id: 'insert.footnote',
      label: 'Insert Footnote',
      category: 'Insert',
      execute: editorCmd(insertFootnote),
    },
    {
      id: 'insert.emoji',
      label: 'Insert Emoji',
      category: 'Insert',
      shortcut: shortcutFor('format.emoji'),
      execute: () => useEmojiPickerStore.getState().toggle(),
    },
    {
      id: 'format.document',
      label: 'Format Document',
      category: 'Format',
      shortcut: shortcutFor('format.document'),
      execute: () => {
        const view = editorViewRef.current
        if (view) {
          formatDocument(view)
          useEditorStore.getState().setDirty(true)
          useToastStore.getState().show('Document formatted')
          view.focus()
        }
      },
    },

    // Search commands
    {
      id: 'search.find',
      label: 'Find',
      category: 'Search',
      shortcut: shortcutFor('search.find'),
      execute: () => {
        const view = editorViewRef.current
        if (view) openSearchPanel(view)
      },
    },
    {
      id: 'search.find-replace',
      label: 'Find and Replace',
      category: 'Search',
      shortcut: shortcutFor('search.find-replace'),
      execute: () => {
        const view = editorViewRef.current
        if (view) {
          useSearchStore.getState().setShowReplace(true)
          openSearchPanel(view)
        }
      },
    },
    {
      id: 'search.close',
      label: 'Close Search',
      category: 'Search',
      execute: () => {
        const view = editorViewRef.current
        if (view) {
          closeSearchPanel(view)
          view.focus()
        }
      },
    },

    // View commands
    {
      id: 'view.theme-light',
      label: 'Switch to Light Theme',
      category: 'View',
      execute: () => useThemeStore.getState().setMode('light'),
    },
    {
      id: 'view.theme-dark',
      label: 'Switch to Dark Theme',
      category: 'View',
      execute: () => useThemeStore.getState().setMode('dark'),
    },
    {
      id: 'view.theme-system',
      label: 'Switch to System Theme',
      category: 'View',
      execute: () => useThemeStore.getState().setMode('system'),
    },
    {
      id: 'view.toggle-toc',
      label: 'Toggle Table of Contents',
      category: 'View',
      execute: () => useTocStore.getState().toggle(),
    },
    {
      id: 'view.toggle-ai',
      label: 'Toggle AI Assistant',
      category: 'View',
      execute: () => useAIStore.getState().toggle(),
    },
    {
      id: 'view.toggle-scroll-sync',
      label: 'Toggle Scroll Sync',
      category: 'View',
      execute: () => useScrollSyncStore.getState().toggle(),
    },
    {
      id: 'view.toggle-focus',
      label: 'Toggle Focus Mode',
      category: 'View',
      shortcut: shortcutFor('view.focus-mode'),
      execute: () => useFocusModeStore.getState().toggle(),
    },
    {
      id: 'view.toggle-typewriter',
      label: 'Toggle Typewriter Mode',
      category: 'View',
      shortcut: shortcutFor('view.typewriter'),
      execute: () => useFocusModeStore.getState().toggleTypewriter(),
    },
    {
      id: 'view.ai-settings',
      label: 'AI Settings',
      category: 'View',
      execute: () => useAIStore.getState().setSettingsOpen(true),
    },
    {
      id: 'view.toggle-stats',
      label: 'Toggle Writing Statistics',
      category: 'View',
      shortcut: shortcutFor('view.stats'),
      execute: () => useStatsStore.getState().toggle(),
    },

    // Layout commands
    {
      id: 'view.layout-editor',
      label: 'Editor Only',
      category: 'Layout',
      shortcut: shortcutFor('layout.editor'),
      execute: () => useLayoutStore.getState().setMode('editor'),
    },
    {
      id: 'view.layout-split',
      label: 'Split View',
      category: 'Layout',
      shortcut: shortcutFor('layout.split'),
      execute: () => useLayoutStore.getState().setMode('split'),
    },
    {
      id: 'view.layout-preview',
      label: 'Preview Only',
      category: 'Layout',
      shortcut: shortcutFor('layout.preview'),
      execute: () => useLayoutStore.getState().setMode('preview'),
    },

    // App commands
    ...(usePWAStore.getState().installable
      ? [
          {
            id: 'app.install',
            label: 'Install App',
            category: 'App',
            execute: () => usePWAStore.getState().promptInstall(),
          },
        ]
      : []),

    // Auto-save commands
    {
      id: 'autosave.toggle',
      label: useAutosaveStore.getState().enabled ? 'Disable Auto-Save' : 'Enable Auto-Save',
      category: 'File',
      execute: () => {
        const store = useAutosaveStore.getState()
        store.setEnabled(!store.enabled)
      },
    },
    {
      id: 'autosave.save-now',
      label: 'Save Draft Now',
      category: 'File',
      execute: () => useAutosaveStore.getState().saveNow(),
    },

    // Preview style commands
    {
      id: 'view.preview-css',
      label: 'Edit Preview CSS',
      category: 'View',
      execute: () => usePreviewStyleStore.getState().setEditorOpen(true),
    },
    {
      id: 'view.reset-preview-css',
      label: 'Reset Preview CSS',
      category: 'View',
      execute: () => usePreviewStyleStore.getState().reset(),
    },

    // Keyboard shortcuts
    {
      id: 'view.keyboard-shortcuts',
      label: 'Show Keyboard Shortcuts',
      category: 'View',
      shortcut: shortcutFor('view.shortcuts'),
      execute: () => useShortcutsStore.getState().setOpen(true),
    },

    // Lint commands
    {
      id: 'lint.toggle',
      label: useLintStore.getState().enabled ? 'Disable Markdown Linting' : 'Enable Markdown Linting',
      category: 'View',
      execute: () => useLintStore.getState().toggle(),
    },

    // Frontmatter commands
    {
      id: 'view.toggle-frontmatter',
      label: 'Toggle Frontmatter Editor',
      category: 'View',
      execute: () => useFrontmatterStore.getState().toggle(),
    },
    {
      id: 'insert.frontmatter',
      label: 'Insert Frontmatter',
      category: 'Insert',
      execute: () => {
        const { content, setContent } = useEditorStore.getState()
        if (/^---\r?\n/.test(content)) return // already has frontmatter
        const fm = `---\ntitle: ""\ndate: ${new Date().toISOString().slice(0, 10)}\n---\n\n`
        setContent(fm + content)
        useFrontmatterStore.getState().setExpanded(true)
      },
    },
  ]
}

function fuzzyMatch(query: string, text: string): { match: boolean; score: number } {
  const q = query.toLowerCase()
  const t = text.toLowerCase()

  // Exact substring match gets high score
  if (t.includes(q)) {
    const idx = t.indexOf(q)
    return { match: true, score: 100 - idx }
  }

  // Fuzzy: all query chars appear in order
  let qi = 0
  let score = 0
  let lastIdx = -1
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Bonus for consecutive matches
      score += lastIdx === ti - 1 ? 10 : 1
      // Bonus for word-start matches
      if (ti === 0 || t[ti - 1] === ' ') score += 5
      lastIdx = ti
      qi++
    }
  }

  if (qi === q.length) {
    return { match: true, score }
  }

  return { match: false, score: 0 }
}

type CommandPaletteInnerProps = {
  onOpen: () => void
  onSave: () => void
  onSaveDisk: () => void
}

function CommandPaletteInner({ onOpen, onSave, onSaveDisk }: CommandPaletteInnerProps) {
  const setOpen = useCommandPaletteStore((s) => s.setOpen)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands = useMemo(() => buildCommands({ onOpen, onSave, onSaveDisk }), [onOpen, onSave, onSaveDisk])

  const filtered = useMemo(() => {
    if (!query.trim()) return commands

    return commands
      .map((cmd) => {
        const labelMatch = fuzzyMatch(query, cmd.label)
        const catMatch = fuzzyMatch(query, cmd.category)
        const bestScore = Math.max(labelMatch.score, catMatch.score)
        const isMatch = labelMatch.match || catMatch.match
        return { cmd, score: bestScore, isMatch }
      })
      .filter((r) => r.isMatch)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.cmd)
  }, [commands, query])

  // Auto focus
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const close = useCallback(() => setOpen(false), [setOpen])

  const execute = useCallback(
    (cmd: Command) => {
      close()
      // Delay execution slightly so the palette closes cleanly
      requestAnimationFrame(() => cmd.execute())
    },
    [close],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          execute(filtered[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    },
    [filtered, selectedIndex, execute, close],
  )

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const selected = list.children[selectedIndex] as HTMLElement | undefined
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={close}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.15s ease-out' }} />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-2xl dark:border-gray-700/60 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.15s ease-out' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-2.5 border-b border-gray-200/80 px-4 dark:border-gray-700/60">
          <Search size={16} strokeWidth={1.5} className="shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={onKeyDown}
            placeholder="Type a command..."
            className="h-12 w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>

        {/* Command list */}
        <div ref={listRef} className="custom-scrollbar max-h-[320px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No commands found
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                type="button"
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors duration-100 ${
                  i === selectedIndex
                    ? 'bg-blue-50 text-blue-900 dark:bg-blue-500/10 dark:text-blue-100'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]'
                }`}
                onClick={() => execute(cmd)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-14 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {cmd.category}
                  </span>
                  <span>{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <kbd className="ml-4 shrink-0 rounded border border-gray-200/80 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t border-gray-200/80 px-4 py-2 text-[10px] text-gray-400 dark:border-gray-700/60 dark:text-gray-500">
          <span><kbd className="rounded border border-gray-200/80 px-1 dark:border-gray-600">↑↓</kbd> Navigate</span>
          <span><kbd className="rounded border border-gray-200/80 px-1 dark:border-gray-600">↵</kbd> Execute</span>
          <span><kbd className="rounded border border-gray-200/80 px-1 dark:border-gray-600">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}

export function CommandPalette({ onOpen, onSave, onSaveDisk }: CommandPaletteInnerProps) {
  const open = useCommandPaletteStore((s) => s.open)
  if (!open) return null
  return <CommandPaletteInner onOpen={onOpen} onSave={onSave} onSaveDisk={onSaveDisk} />
}
