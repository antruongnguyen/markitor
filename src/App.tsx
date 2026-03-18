import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AIPanel } from './components/AIPanel'
import { SettingsDialog } from './components/SettingsDialog'
import { SplitPane } from './components/SplitPane'
import { StatusBar } from './components/StatusBar'
import { TableOfContents } from './components/TableOfContents'
import { useAIStore } from './store/aiStore'
import { useEditorStore } from './store/editorStore'
import { useThemeStore, type ThemeMode } from './store/themeStore'
import { useTocStore } from './store/tocStore'
import { useScrollSyncStore } from './store/scrollSyncStore'
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
      {mode === 'light' && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
      {mode === 'dark' && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.005 9.005 0 0012 21a9.005 9.005 0 008.354-5.646z" />
        </svg>
      )}
      {mode === 'system' && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )}
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
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h14" />
      </svg>
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
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
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
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
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
        Export
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={handleExportHTML}
          >
            <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Export HTML
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={handleExportPDF}
          >
            <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save as PDF
          </button>
        </div>
      )}
    </div>
  )
}

function App() {
  const fileName = useEditorStore((s) => s.fileName)
  const isDirty = useEditorStore((s) => s.isDirty)
  const setContentFromFile = useEditorStore((s) => s.setContentFromFile)
  const setFileMeta = useEditorStore((s) => s.setFileMeta)
  const markSaved = useEditorStore((s) => s.markSaved)
  const tocOpen = useTocStore((s) => s.open)
  const aiOpen = useAIStore((s) => s.open)

  const displayFileName = useMemo(() => (isDirty ? `${fileName} *` : fileName), [fileName, isDirty])

  const handleOpen = useCallback(async () => {
    const result = await openFile()
    if (!result) {
      return
    }

    setContentFromFile(result.content)
    setFileMeta({
      fileName: result.fileName,
      fileHandle: result.fileHandle,
    })
  }, [setContentFromFile, setFileMeta])

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
      if (!isDirty) {
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

      <div className="flex min-h-0 flex-1">
        {tocOpen && <TableOfContents />}
        <div className="min-h-0 flex-1">
          <SplitPane
            left={(
              <Suspense fallback={<div className="h-full w-full bg-white dark:bg-gray-900" />}>
                <Editor onOpen={handleOpen} onSave={handleSave} />
              </Suspense>
            )}
            right={(
              <Suspense fallback={<div className="h-full w-full bg-white dark:bg-gray-900" />}>
                <Preview />
              </Suspense>
            )}
          />
        </div>
        {aiOpen && <AIPanel />}
      </div>

      <StatusBar />
      <SettingsDialog />
    </div>
  )
}

export default App
