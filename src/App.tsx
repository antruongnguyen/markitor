import { useCallback, useEffect, useMemo } from 'react'
import { SplitPane } from './components/SplitPane'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { useEditorStore } from './store/editorStore'
import { openFile, saveFile } from './utils/fileOps'

function App() {
  const fileName = useEditorStore((s) => s.fileName)
  const isDirty = useEditorStore((s) => s.isDirty)
  const setContentFromFile = useEditorStore((s) => s.setContentFromFile)
  const setFileMeta = useEditorStore((s) => s.setFileMeta)
  const markSaved = useEditorStore((s) => s.markSaved)

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
    <div className="h-screen w-screen overflow-hidden bg-gray-900 text-gray-100">
      <header className="flex h-12 items-center justify-between border-b border-gray-700 bg-gray-800 px-4">
        <div className="truncate text-sm font-medium" title={displayFileName}>
          {displayFileName}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-100 transition-colors hover:bg-gray-600"
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

      <SplitPane
        left={<Editor onOpen={handleOpen} onSave={handleSave} />}
        right={<Preview />}
      />
    </div>
  )
}

export default App
