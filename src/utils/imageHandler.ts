import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'

export const IMAGE_SIZE_WARN_BYTES = 500 * 1024 // 500KB

/**
 * Read an image File as a data URL string.
 */
export function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Extract image files from a DataTransfer object.
 */
function getImageFiles(dataTransfer: DataTransfer): File[] {
  const files: File[] = []
  for (let i = 0; i < dataTransfer.files.length; i++) {
    const file = dataTransfer.files[i]
    if (file.type.startsWith('image/')) {
      files.push(file)
    }
  }
  return files
}

/**
 * Insert markdown image text at the given position in the editor.
 */
function insertImageMarkdown(view: EditorView, pos: number, alt: string, dataUrl: string): void {
  const markdown = `![${alt}](${dataUrl})`
  view.dispatch({
    changes: { from: pos, insert: markdown },
    selection: { anchor: pos + markdown.length },
  })
}

/**
 * Insert a placeholder while loading, then replace with the actual image.
 */
async function handleImageFiles(view: EditorView, files: File[], pos: number): Promise<void> {
  for (const file of files) {
    const alt = file.name.replace(/\.[^.]+$/, '')

    // Warn if file is large
    if (file.size > IMAGE_SIZE_WARN_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      const proceed = window.confirm(
        `"${file.name}" is ${sizeMB} MB. Embedding large images as data URLs will significantly increase your file size.\n\nContinue?`,
      )
      if (!proceed) continue
    }

    // Insert placeholder
    const placeholder = `![Uploading ${file.name}...]()`
    view.dispatch({
      changes: { from: pos, insert: placeholder },
    })

    try {
      const dataUrl = await readAsDataURL(file)

      // Find and replace the placeholder
      const doc = view.state.doc.toString()
      const placeholderIndex = doc.indexOf(placeholder)
      if (placeholderIndex !== -1) {
        const markdown = `![${alt}](${dataUrl})`
        view.dispatch({
          changes: {
            from: placeholderIndex,
            to: placeholderIndex + placeholder.length,
            insert: markdown,
          },
        })
        pos = placeholderIndex + markdown.length
      } else {
        // Placeholder was edited away; insert at end
        insertImageMarkdown(view, view.state.doc.length, alt, dataUrl)
      }
    } catch {
      // Remove placeholder on error
      const doc = view.state.doc.toString()
      const placeholderIndex = doc.indexOf(placeholder)
      if (placeholderIndex !== -1) {
        view.dispatch({
          changes: {
            from: placeholderIndex,
            to: placeholderIndex + placeholder.length,
            insert: '',
          },
        })
      }
    }
  }
}

/**
 * CodeMirror extension that handles drag-and-drop and paste of images.
 * Images are embedded as data URLs in markdown image syntax.
 */
export function imageDropHandler(): Extension {
  return EditorView.domEventHandlers({
    drop(event, view) {
      if (!event.dataTransfer) return false

      const files = getImageFiles(event.dataTransfer)
      if (files.length === 0) return false

      event.preventDefault()
      event.stopPropagation()

      // Get the drop position in the document
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY }) ?? view.state.selection.main.head

      handleImageFiles(view, files, pos)
      return true
    },

    paste(event, view) {
      if (!event.clipboardData) return false

      const files = getImageFiles(event.clipboardData)
      if (files.length === 0) return false

      event.preventDefault()

      const pos = view.state.selection.main.head
      handleImageFiles(view, files, pos)
      return true
    },
  })
}
