import type { EditorView } from '@codemirror/view'

/** Which pane initiated the current programmatic scroll */
let scrollSource: 'editor' | 'preview' | null = null
let scrollTimer: ReturnType<typeof setTimeout> | null = null

function lockScroll(source: 'editor' | 'preview') {
  scrollSource = source
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    scrollSource = null
  }, 80)
}

/**
 * Get the top visible editor line number from a CodeMirror view.
 */
function getEditorTopLine(view: EditorView): number {
  const scrollerEl = view.scrollDOM
  const topPos = view.lineBlockAtHeight(scrollerEl.scrollTop)
  return view.state.doc.lineAt(topPos.from).number
}

/**
 * Get all elements in the preview container that have data-source-line,
 * sorted by line number.
 */
function getSourceLineElements(container: HTMLElement): { line: number; el: HTMLElement }[] {
  const els = container.querySelectorAll<HTMLElement>('[data-source-line]')
  const result: { line: number; el: HTMLElement }[] = []
  for (const el of els) {
    const line = parseInt(el.dataset.sourceLine!, 10)
    if (!isNaN(line)) result.push({ line, el })
  }
  return result.sort((a, b) => a.line - b.line)
}

/**
 * Scroll the preview to match the editor's current top visible line.
 * Uses data-source-line attributes for element-level mapping with
 * linear interpolation between elements.
 */
export function syncPreviewToEditor(
  view: EditorView,
  previewContainer: HTMLElement,
) {
  if (scrollSource === 'preview') return
  lockScroll('editor')

  const topLine = getEditorTopLine(view)
  const elements = getSourceLineElements(previewContainer)
  if (elements.length === 0) {
    // Fallback: percentage-based sync
    const scroller = view.scrollDOM
    const pct = scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight || 1)
    previewContainer.scrollTop = pct * (previewContainer.scrollHeight - previewContainer.clientHeight)
    return
  }

  // Find the two bounding elements
  let before = elements[0]
  let after = elements[elements.length - 1]

  for (let i = 0; i < elements.length; i++) {
    // markdown-it lines are 0-indexed, editor lines are 1-indexed
    if (elements[i].line + 1 <= topLine) {
      before = elements[i]
    }
    if (elements[i].line + 1 >= topLine) {
      after = elements[i]
      break
    }
  }

  if (before === after) {
    previewContainer.scrollTop = before.el.offsetTop - previewContainer.offsetTop
    return
  }

  // Interpolate between the two elements
  const lineRange = (after.line + 1) - (before.line + 1)
  const fraction = lineRange > 0 ? (topLine - (before.line + 1)) / lineRange : 0
  const topBefore = before.el.offsetTop - previewContainer.offsetTop
  const topAfter = after.el.offsetTop - previewContainer.offsetTop
  previewContainer.scrollTop = topBefore + fraction * (topAfter - topBefore)
}

/**
 * Scroll the editor to match the preview's current scroll position.
 * Uses data-source-line attributes to find the visible preview element,
 * then scrolls the editor to the corresponding line.
 */
export function syncEditorToPreview(
  view: EditorView,
  previewContainer: HTMLElement,
) {
  if (scrollSource === 'editor') return
  lockScroll('preview')

  const elements = getSourceLineElements(previewContainer)
  if (elements.length === 0) {
    // Fallback: percentage-based sync
    const pct = previewContainer.scrollTop / (previewContainer.scrollHeight - previewContainer.clientHeight || 1)
    const scroller = view.scrollDOM
    scroller.scrollTop = pct * (scroller.scrollHeight - scroller.clientHeight)
    return
  }

  const scrollTop = previewContainer.scrollTop + previewContainer.offsetTop

  // Find the element just above and at/below scroll position
  let before = elements[0]
  let after = elements[elements.length - 1]

  for (let i = 0; i < elements.length; i++) {
    if (elements[i].el.offsetTop <= scrollTop) {
      before = elements[i]
    }
    if (elements[i].el.offsetTop >= scrollTop) {
      after = elements[i]
      break
    }
  }

  // Interpolate to find the target line
  let targetLine: number
  if (before === after) {
    targetLine = before.line + 1
  } else {
    const topBefore = before.el.offsetTop
    const topAfter = after.el.offsetTop
    const fraction = topAfter > topBefore ? (scrollTop - topBefore) / (topAfter - topBefore) : 0
    targetLine = Math.round((before.line + 1) + fraction * ((after.line + 1) - (before.line + 1)))
  }

  // Clamp to doc range
  targetLine = Math.max(1, Math.min(targetLine, view.state.doc.lines))
  const lineInfo = view.state.doc.line(targetLine)
  const blockInfo = view.lineBlockAt(lineInfo.from)
  view.scrollDOM.scrollTop = blockInfo.top
}
