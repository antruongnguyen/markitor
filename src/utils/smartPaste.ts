import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import TurndownService from 'turndown'
import { getImageFiles, handleImageFiles } from './imageHandler'

const URL_RE = /^https?:\/\/\S+$/

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
})

/**
 * Check if HTML contains actual formatting (not just plain text wrapped in
 * trivial container tags like `<span>`, `<p>`, `<div>`, `<meta>`, etc.).
 */
function isSubstantiveHtml(html: string): boolean {
  return /<(?:h[1-6]|b|strong|i|em|a\s|ul|ol|li|table|tr|td|th|pre|code|blockquote|img\s|hr)\b/i.test(html)
}

/**
 * Track whether Shift is held during paste so we can detect Ctrl+Shift+V
 * (paste as plain text). ClipboardEvent doesn't expose modifier keys, so
 * we track keydown/keyup at the DOM level.
 */
let shiftHeld = false

/**
 * CodeMirror extension that intercepts paste events and converts clipboard
 * content based on type:
 *
 * Priority: image > HTML > URL > plain text
 *
 * - **Image paste**: embeds as base64 data URL (same as drag-drop)
 * - **HTML paste**: converts to markdown via turndown
 * - **URL paste**: wraps as `[url](url)` or `[selected text](url)`
 * - **Ctrl+Shift+V**: bypasses smart paste, inserts plain text
 */
export function smartPasteHandler(): Extension {
  return EditorView.domEventHandlers({
    keydown(event) {
      if (event.key === 'Shift') shiftHeld = true
      return false
    },
    keyup(event) {
      if (event.key === 'Shift') shiftHeld = false
      return false
    },

    paste(event, view) {
      const clipboard = event.clipboardData
      if (!clipboard) return false

      // Ctrl+Shift+V → paste as plain text, bypass smart paste
      if (shiftHeld) return false

      // Priority 1: Images
      const imageFiles = getImageFiles(clipboard)
      if (imageFiles.length > 0) {
        event.preventDefault()
        const pos = view.state.selection.main.head
        handleImageFiles(view, imageFiles, pos)
        return true
      }

      const html = clipboard.getData('text/html')
      const plainText = clipboard.getData('text/plain')

      // Priority 2: Substantive HTML → markdown
      if (html && isSubstantiveHtml(html)) {
        event.preventDefault()
        const md = turndown.turndown(html)
        const { from, to } = view.state.selection.main
        view.dispatch({
          changes: { from, to, insert: md },
          selection: { anchor: from + md.length },
        })
        return true
      }

      // Priority 3: Plain-text URL → markdown link
      if (plainText && URL_RE.test(plainText.trim())) {
        event.preventDefault()
        const url = plainText.trim()
        const { from, to } = view.state.selection.main
        const selectedText = view.state.sliceDoc(from, to)
        const md = selectedText ? `[${selectedText}](${url})` : `[${url}](${url})`
        view.dispatch({
          changes: { from, to, insert: md },
          selection: { anchor: from + md.length },
        })
        return true
      }

      // Default: let CodeMirror handle plain text paste
      return false
    },
  })
}
