type OpenFileResult = {
  content: string
  fileName: string
  fileHandle: FileSystemFileHandle | null
}

type SaveFileOptions = {
  content: string
  fileName: string
  fileHandle: FileSystemFileHandle | null
}

type SaveFileResult = {
  fileName: string
  fileHandle: FileSystemFileHandle | null
}

type WindowWithFsApi = Window & {
  showOpenFilePicker?: (options?: {
    multiple?: boolean
    types?: Array<{
      description?: string
      accept: Record<string, string[]>
    }>
  }) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker?: (options?: {
    suggestedName?: string
    types?: Array<{
      description?: string
      accept: Record<string, string[]>
    }>
  }) => Promise<FileSystemFileHandle>
}

const MARKDOWN_FILE_TYPES = [
  {
    description: 'Markdown Files',
    accept: {
      'text/markdown': ['.md', '.markdown', '.mdown', '.mkd', '.mkdn'],
      'text/plain': ['.txt'],
    },
  },
]

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function getBrowserWindow(): WindowWithFsApi | null {
  return typeof window === 'undefined' ? null : (window as WindowWithFsApi)
}

function downloadFallback(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function openFileWithInputFallback(): Promise<OpenFileResult | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,.mdown,.mkd,.mkdn,.txt,text/markdown,text/plain'
    input.style.display = 'none'

    let settled = false

    const cleanup = () => {
      input.removeEventListener('change', onChange)
      window.removeEventListener('focus', onWindowFocus)
      input.remove()
    }

    const finalize = (result: OpenFileResult | null) => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      resolve(result)
    }

    const onChange = async () => {
      const file = input.files?.[0]
      if (!file) {
        finalize(null)
        return
      }

      const content = await file.text()
      finalize({
        content,
        fileName: file.name,
        fileHandle: null,
      })
    }

    const onWindowFocus = () => {
      setTimeout(() => {
        if (!input.files?.length) {
          finalize(null)
        }
      }, 0)
    }

    input.addEventListener('change', onChange)
    window.addEventListener('focus', onWindowFocus, { once: true })
    document.body.append(input)
    input.click()
  })
}

export async function openFile(): Promise<OpenFileResult | null> {
  const browserWindow = getBrowserWindow()
  if (!browserWindow) {
    return null
  }

  if (browserWindow.showOpenFilePicker) {
    try {
      const [fileHandle] = await browserWindow.showOpenFilePicker({
        multiple: false,
        types: MARKDOWN_FILE_TYPES,
      })
      const file = await fileHandle.getFile()
      const content = await file.text()

      return {
        content,
        fileName: file.name,
        fileHandle,
      }
    } catch (error) {
      if (isAbortError(error)) {
        return null
      }
      throw error
    }
  }

  return openFileWithInputFallback()
}

export async function saveFile(options: SaveFileOptions): Promise<SaveFileResult | null> {
  const { content, fileName, fileHandle } = options
  const browserWindow = getBrowserWindow()
  if (!browserWindow) {
    return null
  }

  if (fileHandle) {
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()

    return {
      fileName,
      fileHandle,
    }
  }

  if (browserWindow.showSaveFilePicker) {
    try {
      const newFileHandle = await browserWindow.showSaveFilePicker({
        suggestedName: fileName,
        types: MARKDOWN_FILE_TYPES,
      })

      const writable = await newFileHandle.createWritable()
      await writable.write(content)
      await writable.close()

      return {
        fileName,
        fileHandle: newFileHandle,
      }
    } catch (error) {
      if (isAbortError(error)) {
        return null
      }
      throw error
    }
  }

  downloadFallback(content, fileName)

  return {
    fileName,
    fileHandle: null,
  }
}
