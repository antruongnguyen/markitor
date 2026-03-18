import { Suspense, lazy, useCallback, useEffect, useMemo } from 'react'
import { SplitPane } from './components/SplitPane'
import { StatusBar } from './components/StatusBar'
import { TableOfContents } from './components/TableOfContents'
import { useEditorStore } from './store/editorStore'
import { useThemeStore, type ThemeMode } from './store/themeStore'
import { useTocStore } from './store/tocStore'
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

function App() {
  const fileName = useEditorStore((s) => s.fileName)
  const isDirty = useEditorStore((s) => s.isDirty)
  const setContentFromFile = useEditorStore((s) => s.setContentFromFile)
  const setFileMeta = useEditorStore((s) => s.setFileMeta)
  const markSaved = useEditorStore((s) => s.markSaved)
  const tocOpen = useTocStore((s) => s.open)

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
      </div>

      <StatusBar />
    </div>
  )
}

export default App
