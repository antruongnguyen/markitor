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
  BarChart3,
  FolderOpen,
  Save,
  HardDrive,
} from 'lucide-react'
import { AIPanel } from './components/AIPanel'
import { CommandPalette } from './components/CommandPalette'
import { FocusModeOverlay } from './components/FocusModeOverlay'
import { InstallBanner } from './components/InstallBanner'
import { PreviewCSSEditorDialog } from './components/PreviewCSSEditor'
import { KeyboardShortcutsDialog } from './components/KeyboardShortcutsDialog'
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
import { usePWAStore } from './store/pwaStore'
import { useAutosaveStore } from './store/autosaveStore'
import { useStatsStore } from './store/statsStore'
import { useShortcutsStore } from './store/shortcutsStore'
import { useToastStore } from './store/toastStore'
import { StatsPanel } from './components/StatsPanel'
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
      className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
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
      className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-150 ${
        tocOpen
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
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
      className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-150 ${
        aiOpen
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
      }`}
      onClick={toggle}
      title={aiOpen ? 'Hide AI assistant' : 'Show AI assistant'}
    >
      <Sparkles size={16} strokeWidth={1.5} />
    </button>
  )
}

function StatsToggle() {
  const statsOpen = useStatsStore((s) => s.open)
  const toggle = useStatsStore((s) => s.toggle)

  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-150 ${
        statsOpen
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
      }`}
      onClick={toggle}
      title={statsOpen ? 'Hide writing statistics (Ctrl+Alt+S)' : 'Show writing statistics (Ctrl+Alt+S)'}
    >
      <BarChart3 size={16} strokeWidth={1.5} />
    </button>
  )
}

function ScrollSyncToggle() {
  const syncEnabled = useScrollSyncStore((s) => s.enabled)
  const toggle = useScrollSyncStore((s) => s.toggle)

  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-150 ${
        syncEnabled
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
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
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
        onClick={() => setOpen((prev) => !prev)}
        title="Export document (Ctrl+Shift+E)"
      >
        <Download size={16} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-600 dark:bg-gray-800" style={{ animation: 'scaleIn 0.15s ease-out' }}>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={handleExportHTML}
          >
            <FileCode size={16} strokeWidth={1.5} className="shrink-0 text-gray-400" />
            Export HTML
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
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
    <div className="flex items-center overflow-hidden rounded-md border border-gray-200 dark:border-gray-600" title={`Layout: ${layoutModeLabel[mode]}`}>
      {/* Editor Only */}
      <button
        type="button"
        className={`flex h-7 w-7 items-center justify-center text-xs transition-all duration-150 ${
          mode === 'editor'
            ? 'bg-blue-600 text-white dark:bg-blue-500'
            : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
        }`}
        onClick={() => setMode('editor')}
        title="Editor only (Ctrl+Shift+1)"
      >
        <SquarePen size={14} strokeWidth={1.5} />
      </button>
      {/* Split View */}
      <button
        type="button"
        className={`flex h-7 w-7 items-center justify-center border-x border-gray-200 text-xs transition-all duration-150 dark:border-gray-600 ${
          mode === 'split'
            ? 'bg-blue-600 text-white dark:bg-blue-500'
            : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
        }`}
        onClick={() => setMode('split')}
        title="Split view (Ctrl+Shift+2)"
      >
        <Columns2 size={14} strokeWidth={1.5} />
      </button>
      {/* Preview Only */}
      <button
        type="button"
        className={`flex h-7 w-7 items-center justify-center text-xs transition-all duration-150 ${
          mode === 'preview'
            ? 'bg-blue-600 text-white dark:bg-blue-500'
            : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
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
      className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-all duration-150 ${
        focusEnabled
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
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
  const statsOpen = useStatsStore((s) => s.open)
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

    // Clear auto-save draft for the current tab after explicit save
    const tabId = useTabStore.getState().activeTabId
    useAutosaveStore.getState().clearDraftForTab(tabId)
    useToastStore.getState().show('Saved to disk')
  }, [markSaved, setFileMeta])

  const handleSaveBrowser = useCallback(async () => {
    await useAutosaveStore.getState().saveNow()
    markSaved()
    useToastStore.getState().show('Saved to browser storage')
  }, [markSaved])

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

  // Writing statistics shortcut: Ctrl/Cmd+Alt+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        useStatsStore.getState().toggle()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Save to disk shortcut: Ctrl/Cmd+Shift+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  // Keyboard shortcuts panel: Ctrl/Cmd+/
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === '/') {
        e.preventDefault()
        useShortcutsStore.getState().toggle()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Initialize PWA store (online/offline + install prompt listeners)
  useEffect(() => usePWAStore.getState()._init(), [])

  // Initialize auto-save (timer, debounced save, beforeunload)
  useEffect(() => useAutosaveStore.getState()._init(), [])

  if (focusMode) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#faf9f6] transition-colors duration-300 dark:bg-[#282c34]">
        <div className="flex min-h-0 flex-1 items-stretch justify-center">
          <div className="flex w-full flex-col">
            <Suspense fallback={<div className="h-full w-full" />}>
              <Editor onOpen={handleOpen} onSave={handleSaveBrowser} onSaveDisk={handleSave} focusMode />
            </Suspense>
          </div>
        </div>
        <FocusModeOverlay />
        <CommandPalette onOpen={handleOpen} onSave={handleSaveBrowser} onSaveDisk={handleSave} />
        <SettingsDialog />
        <KeyboardShortcutsDialog />
        <PreviewCSSEditorDialog />
        <ToastContainer />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-gray-900 transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-gray-200/80 bg-gray-50/80 px-3 backdrop-blur-sm transition-colors duration-200 dark:border-gray-700/60 dark:bg-gray-800/80">
        <div className="flex items-center gap-1.5">
          <TocToggle />
          <div className="truncate text-sm font-medium text-gray-700 dark:text-gray-200" title={displayFileName}>
            {displayFileName}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
            onClick={toggleCommandPalette}
            title="Command palette (Ctrl+P)"
          >
            <Terminal size={16} strokeWidth={1.5} />
          </button>
          <div className="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-700" />
          <LayoutToggle />
          <div className="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-700" />
          <FocusModeToggle />
          <AIToggle />
          <StatsToggle />
          <ScrollSyncToggle />
          <ThemeToggle />
          <div className="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-700" />
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
            onClick={handleOpen}
            title="Open file (Ctrl+O)"
          >
            <FolderOpen size={16} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
            onClick={handleSaveBrowser}
            title="Save to browser (Ctrl+S)"
          >
            <HardDrive size={16} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
            onClick={handleSave}
            title="Save to disk (Ctrl+Shift+S)"
          >
            <Save size={16} strokeWidth={1.5} />
          </button>
          <ExportMenu />
        </div>
      </header>

      <InstallBanner />
      <TabBar />

      <div className="flex min-h-0 flex-1">
        {tocOpen && <TableOfContents />}
        <div className="min-h-0 flex-1">
          <SplitPane
            left={layoutMode !== 'preview' ? (
              <Suspense fallback={<div className="h-full w-full bg-white dark:bg-gray-900" />}>
                <Editor onOpen={handleOpen} onSave={handleSaveBrowser} onSaveDisk={handleSave} />
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
        {statsOpen && <StatsPanel />}
      </div>

      <StatusBar />
      <CommandPalette onOpen={handleOpen} onSave={handleSaveBrowser} onSaveDisk={handleSave} />
      <SettingsDialog />
      <KeyboardShortcutsDialog />
      <PreviewCSSEditorDialog />
      <ToastContainer />
    </div>
  )
}

export default App
