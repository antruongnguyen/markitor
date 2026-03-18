import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Sun,
  Moon,
  Monitor,
  List,
  Sparkles,
  ArrowUpDown,
  Maximize2,
  Terminal,
  Download,
  FileCode,
  Printer,
  SquarePen,
  Columns2,
  Eye,
} from 'lucide-react'
import { AIPanel } from './components/AIPanel'
import { CommandPalette } from './components/CommandPalette'
import { FocusModeOverlay } from './components/FocusModeOverlay'
import { SettingsDialog } from './components/SettingsDialog'
import { SplitPane } from './components/SplitPane'
import { StatusBar } from './components/StatusBar'
import { TabBar } from './components/TabBar'
import { TableOfContents } from './components/TableOfContents'
import { ToastContainer } from './components/Toast'
import { useAIStore } from './store/aiStore'
import { useCommandPaletteStore } from './store/commandPaletteStore'
import { useEditorStore } from './store/editorStore'
import { useFocusModeStore } from './store/focusModeStore'
import { useTabStore } from './store/tabStore'
import { useThemeStore, type ThemeMode } from './store/themeStore'
import { useTocStore } from './store/tocStore'
import { useScrollSyncStore } from './store/scrollSyncStore'
import { useLayoutStore, type LayoutMode } from './store/layoutStore'
import { exportHTML, exportPDF } from './utils/exportDocument'
import { openFile, saveFile } from './utils/fileOps'

const Editor = lazy(() => import('./components/Editor').then((module) => ({ default: module.Editor })))
const Preview = lazy(() => import('./components/Preview').then((module) => ({ default: module.Preview })))

const nextMode: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}

const modeLabel: Record<ThemeMode, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
}

function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)

  return (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
      onClick={() => setMode(nextMode[mode])}
      title={`Theme: ${modeLabel[mode]}`}
    >
      {mode === 'light' && <Sun size={16} strokeWidth={1.5} />}
      {mode === 'dark' && <Moon size={16} strokeWidth={1.5} />}
      {mode === 'system' && <Monitor size={16} strokeWidth={1.5} />}
    </button>
  )
}

function TocToggle() {
  const tocOpen = useTocStore((s) => s.open)
  const toggle = useTocStore((s) => s.toggle)

  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${
        tocOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
      }`}
      onClick={toggle}
      title={tocOpen ? 'Hide table of contents' : 'Show table of contents'}
    >
      <List size={16} strokeWidth={1.5} />
    </button>
  )
}

function AIToggle() {
  const aiOpen = useAIStore((s) => s.open)
  const toggle = useAIStore((s) => s.toggle)

  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${
        aiOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
      }`}
      onClick={toggle}
      title={aiOpen ? 'Hide AI assistant' : 'Show AI assistant'}
    >
      <Sparkles size={16} strokeWidth={1.5} />
    </button>
  )
}

function ScrollSyncToggle() {
  const syncEnabled = useScrollSyncStore((s) => s.enabled)
  const toggle = useScrollSyncStore((s) => s.toggle)

  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${
        syncEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
      }`}
      onClick={toggle}
      title={syncEnabled ? 'Disable scroll sync' : 'Enable scroll sync'}
    >
      <ArrowUpDown size={16} strokeWidth={1.5} />
    </button>
  )
}

function ExportMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleExportHTML = useCallback(() => {
    const { content, fileName } = useEditorStore.getState()
    exportHTML(content, fileName)
    setOpen(false)
  }, [])

  const handleExportPDF = useCallback(() => {
    const { content, fileName } = useEditorStore.getState()
    exportPDF(content, fileName)
    setOpen(false)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Global shortcut: Ctrl/Cmd+Shift+E to toggle export menu
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="relative" ref={menuRef} data-export-menu>
      <button
        type="button"
        className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        onClick={() => setOpen((prev) => !prev)}
        title="Export document (Ctrl+Shift+E)"
      >
        <Download size={16} strokeWidth={1.5} className="mr-1.5" />
        Export
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={handleExportHTML}
          >
            <FileCode size={16} strokeWidth={1.5} className="shrink-0 text-gray-400" />
            Export HTML
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={handleExportPDF}
          >
            <Printer size={16} strokeWidth={1.5} className="shrink-0 text-gray-400" />
            Print / Save as PDF
          </button>
        </div>
      )}
    </div>
  )
}

const layoutModeLabel: Record<LayoutMode, string> = {
  editor: 'Editor Only',
  split: 'Split View',
  preview: 'Preview Only',
}

function LayoutToggle() {
  const mode = useLayoutStore((s) => s.mode)
  const setMode = useLayoutStore((s) => s.setMode)

  return (
    <div className="flex items-center rounded border border-gray-200 dark:border-gray-600" title={`Layout: ${layoutModeLabel[mode]}`}>
      {/* Editor Only */}
      <button
        type="button"
        className={`flex h-7 w-7 items-center justify-center text-xs transition-colors ${
          mode === 'editor'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
        onClick={() => setMode('editor')}
        title="Editor only (Ctrl+Shift+1)"
      >
        <SquarePen size={14} strokeWidth={1.5} />
      </button>
      {/* Split View */}
      <button
        type="button"
        className={`flex h-7 w-7 items-center justify-center border-x border-gray-200 text-xs transition-colors dark:border-gray-600 ${
          mode === 'split'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
        onClick={() => setMode('split')}
        title="Split view (Ctrl+Shift+2)"
      >
        <Columns2 size={14} strokeWidth={1.5} />
      </button>
      {/* Preview Only */}
      <button
        type="button"
        className={`flex h-7 w-7 items-center justify-center text-xs transition-colors ${
          mode === 'preview'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
        }`}
        onClick={() => setMode('preview')}
        title="Preview only (Ctrl+Shift+3)"
      >
        <Eye size={14} strokeWidth={1.5} />
      </button>
    </div>
  )
}

function FocusModeToggle() {
  const focusEnabled = useFocusModeStore((s) => s.enabled)
  const toggle = useFocusModeStore((s) => s.toggle)

  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${
        focusEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
      }`}
      onClick={toggle}
      title={focusEnabled ? 'Exit focus mode (Ctrl+Shift+F)' : 'Enter focus mode (Ctrl+Shift+F)'}
    >
      <Maximize2 size={16} strokeWidth={1.5} />
    </button>
  )
}

function App() {
  const fileName = useEditorStore((s) => s.fileName)
  const isDirty = useEditorStore((s) => s.isDirty)
  const setFileMeta = useEditorStore((s) => s.setFileMeta)
  const markSaved = useEditorStore((s) => s.markSaved)
  const tocOpen = useTocStore((s) => s.open)
  const aiOpen = useAIStore((s) => s.open)
  const focusMode = useFocusModeStore((s) => s.enabled)
  const exitFocus = useFocusModeStore((s) => s.exit)
  const toggleFocus = useFocusModeStore((s) => s.toggle)
  const toggleCommandPalette = useCommandPaletteStore((s) => s.toggle)
  const closeTab = useTabStore((s) => s.closeTab)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const layoutMode = useLayoutStore((s) => s.mode)

  const displayFileName = useMemo(() => (isDirty ? `${fileName} *` : fileName), [fileName, isDirty])

  const handleOpen = useCallback(async () => {
    const result = await openFile()
    if (!result) {
      return
    }

    // If this file is already open in a tab, switch to it
    if (result.fileHandle) {
      const existing = useTabStore.getState().findTabByFileHandle(result.fileHandle)
      if (existing) {
        useTabStore.getState().switchTab(existing.id)
        return
      }
    }

    // Open in a new tab
    useTabStore.getState().addTab({
      fileName: result.fileName,
      content: result.content,
      fileHandle: result.fileHandle,
    })
  }, [])

  const handleSave = useCallback(async () => {
    const currentState = useEditorStore.getState()
    const result = await saveFile({
      content: currentState.content,
      fileName: currentState.fileName,
      fileHandle: currentState.fileHandle,
    })

    if (!result) {
      return
    }

    setFileMeta({
      fileName: result.fileName,
      fileHandle: result.fileHandle,
    })
    markSaved()
  }, [markSaved, setFileMeta])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      // Check if any tab has unsaved changes
      const hasUnsaved = useTabStore.getState().tabs.some((t) => t.isDirty) || isDirty
      if (!hasUnsaved) {
        return
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [isDirty])

  // Focus mode keyboard shortcuts: Cmd/Ctrl+Shift+F to toggle, Escape to exit
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        toggleFocus()
      } else if (e.key === 'Escape' && useFocusModeStore.getState().enabled) {
        e.preventDefault()
        exitFocus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [toggleFocus, exitFocus])

  // Command palette: Cmd/Ctrl+P to toggle
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        toggleCommandPalette()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [toggleCommandPalette])

  // Close tab: Cmd/Ctrl+W
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        closeTab(activeTabId)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeTab, activeTabId])

  // Layout mode shortcuts: Ctrl/Cmd+Shift+1/2/3
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return
      const { setMode } = useLayoutStore.getState()
      if (e.key === '1' || e.key === '!') {
        e.preventDefault()
        setMode('editor')
      } else if (e.key === '2' || e.key === '@') {
        e.preventDefault()
        setMode('split')
      } else if (e.key === '3' || e.key === '#') {
        e.preventDefault()
        setMode('preview')
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  if (focusMode) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#faf9f6] transition-colors duration-300 dark:bg-[#0d1117]">
        <div className="flex min-h-0 flex-1 items-stretch justify-center">
          <div className="flex w-full max-w-3xl flex-col">
            <Suspense fallback={<div className="h-full w-full" />}>
              <Editor onOpen={handleOpen} onSave={handleSave} focusMode />
            </Suspense>
          </div>
        </div>
        <FocusModeOverlay />
        <CommandPalette onOpen={handleOpen} onSave={handleSave} />
        <SettingsDialog />
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-gray-900 transition-colors dark:bg-gray-900 dark:text-gray-100">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 transition-colors dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <TocToggle />
          <div className="truncate text-sm font-medium" title={displayFileName}>
            {displayFileName}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            onClick={toggleCommandPalette}
            title="Command palette (Ctrl+P)"
          >
            <Terminal size={16} strokeWidth={1.5} />
          </button>
          <LayoutToggle />
          <FocusModeToggle />
          <AIToggle />
          <ScrollSyncToggle />
          <ThemeToggle />
          <button
            type="button"
            className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            onClick={handleOpen}
          >
            Open
          </button>
          <button
            type="button"
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            onClick={handleSave}
          >
            Save
          </button>
          <ExportMenu />
        </div>
      </header>

      <TabBar />

      <div className="flex min-h-0 flex-1">
        {tocOpen && <TableOfContents />}
        <div className="min-h-0 flex-1">
          <SplitPane
            left={layoutMode !== 'preview' ? (
              <Suspense fallback={<div className="h-full w-full bg-white dark:bg-gray-900" />}>
                <Editor onOpen={handleOpen} onSave={handleSave} />
              </Suspense>
            ) : null}
            right={layoutMode !== 'editor' ? (
              <Suspense fallback={<div className="h-full w-full bg-white dark:bg-gray-900" />}>
                <Preview />
              </Suspense>
            ) : null}
          />
        </div>
        {aiOpen && <AIPanel />}
      </div>

      <StatusBar />
      <CommandPalette onOpen={handleOpen} onSave={handleSave} />
      <SettingsDialog />
      <ToastContainer />
    </div>
  )
}

export default App
