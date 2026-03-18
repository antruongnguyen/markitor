import { EditorSelection } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import { createEmptyTable } from './tableUtils'

type WrapSelectionOptions = {
  prefix: string
  suffix: string
  placeholder: string
}

function setSelection(
  view: EditorView,
  from: number,
  to: number,
  insert: string,
  selectionStart: number,
  selectionEnd: number,
): boolean {
  view.dispatch({
    changes: { from, to, insert },
    selection: EditorSelection.single(selectionStart, selectionEnd),
    scrollIntoView: true,
  })

  return true
}

export function toggleInlineWrap(
  view: EditorView,
  options: WrapSelectionOptions,
): boolean {
  const { state } = view
  const range = state.selection.main
  const text = state.doc.sliceString(range.from, range.to)
  const { prefix, suffix, placeholder } = options

  if (range.empty) {
    const insert = `${prefix}${placeholder}${suffix}`
    const selectionStart = range.from + prefix.length
    const selectionEnd = selectionStart + placeholder.length

    return setSelection(
      view,
      range.from,
      range.to,
      insert,
      selectionStart,
      selectionEnd,
    )
  }

  const wrapped = text.startsWith(prefix) && text.endsWith(suffix)
  if (wrapped) {
    const unwrapped = text.slice(prefix.length, text.length - suffix.length)
    return setSelection(view, range.from, range.to, unwrapped, range.from, range.from + unwrapped.length)
  }

  const insert = `${prefix}${text}${suffix}`
  const selectionStart = range.from + prefix.length
  const selectionEnd = selectionStart + text.length
  return setSelection(view, range.from, range.to, insert, selectionStart, selectionEnd)
}

export function transformLinePrefix(
  view: EditorView,
  transformer: (lineText: string) => string,
): boolean {
  const { state } = view
  const range = state.selection.main
  const line = state.doc.lineAt(range.from)
  const transformed = transformer(line.text)

  if (transformed === line.text) {
    return true
  }

  const delta = transformed.length - line.text.length
  const selectionStart = Math.max(line.from, range.from + delta)
  const selectionEnd = Math.max(selectionStart, range.to + delta)

  view.dispatch({
    changes: { from: line.from, to: line.to, insert: transformed },
    selection: EditorSelection.single(selectionStart, selectionEnd),
    scrollIntoView: true,
  })

  return true
}

function stripHeading(text: string): string {
  return text.replace(/^#{1,6}\s+/, '')
}

export function toggleHeading(view: EditorView, level: 1 | 2 | 3): boolean {
  const prefix = `${'#'.repeat(level)} `

  return transformLinePrefix(view, (lineText) => {
    if (lineText.startsWith(prefix)) {
      return lineText.slice(prefix.length)
    }

    return `${prefix}${stripHeading(lineText)}`
  })
}

export function toggleBold(view: EditorView): boolean {
  return toggleInlineWrap(view, { prefix: '**', suffix: '**', placeholder: 'bold' })
}

export function toggleItalic(view: EditorView): boolean {
  return toggleInlineWrap(view, { prefix: '*', suffix: '*', placeholder: 'italic' })
}

export function toggleStrikethrough(view: EditorView): boolean {
  return toggleInlineWrap(view, { prefix: '~~', suffix: '~~', placeholder: 'strikethrough' })
}

export function toggleInlineCode(view: EditorView): boolean {
  return toggleInlineWrap(view, { prefix: '`', suffix: '`', placeholder: 'code' })
}

export function toggleUnorderedList(view: EditorView): boolean {
  return transformLinePrefix(view, (lineText) => {
    if (lineText.startsWith('- ')) {
      return lineText.slice(2)
    }

    return `- ${lineText.replace(/^\d+\.\s+/, '')}`
  })
}

export function toggleOrderedList(view: EditorView): boolean {
  return transformLinePrefix(view, (lineText) => {
    if (/^\d+\.\s+/.test(lineText)) {
      return lineText.replace(/^\d+\.\s+/, '')
    }

    return `1. ${lineText.replace(/^-\s+/, '')}`
  })
}

export function toggleLink(view: EditorView): boolean {
  const { state } = view
  const range = state.selection.main
  const text = state.doc.sliceString(range.from, range.to)

  if (range.empty) {
    const insert = '[text](url)'
    return setSelection(view, range.from, range.to, insert, range.from + 1, range.from + 5)
  }

  const linkMatch = text.match(/^\[(.*)]\((.*)\)$/s)
  if (linkMatch) {
    const unwrapped = linkMatch[1]
    return setSelection(view, range.from, range.to, unwrapped, range.from, range.from + unwrapped.length)
  }

  const insert = `[${text}](url)`
  const selectionStart = range.from + text.length + 3
  const selectionEnd = selectionStart + 3
  return setSelection(view, range.from, range.to, insert, selectionStart, selectionEnd)
}

export function toggleImage(view: EditorView): boolean {
  const { state } = view
  const range = state.selection.main
  const text = state.doc.sliceString(range.from, range.to)

  if (range.empty) {
    const insert = '![alt](url)'
    return setSelection(view, range.from, range.to, insert, range.from + 2, range.from + 5)
  }

  const insert = `![${text}](url)`
  const selectionStart = range.from + text.length + 4
  const selectionEnd = selectionStart + 3
  return setSelection(view, range.from, range.to, insert, selectionStart, selectionEnd)
}

export function toggleCodeBlock(view: EditorView): boolean {
  const { state } = view
  const range = state.selection.main
  const text = state.doc.sliceString(range.from, range.to)

  if (range.empty) {
    const insert = '```\ncode\n```'
    return setSelection(view, range.from, range.to, insert, range.from + 4, range.from + 8)
  }

  const codeBlockMatch = text.match(/^```\n?([\s\S]*?)\n?```$/)
  if (codeBlockMatch) {
    const unwrapped = codeBlockMatch[1]
    return setSelection(view, range.from, range.to, unwrapped, range.from, range.from + unwrapped.length)
  }

  const wrapped = `\`\`\`\n${text}\n\`\`\``
  const selectionStart = range.from + 4
  const selectionEnd = selectionStart + text.length
  return setSelection(view, range.from, range.to, wrapped, selectionStart, selectionEnd)
}

export function insertBlockquote(view: EditorView): boolean {
  return transformLinePrefix(view, (lineText) => {
    if (lineText.startsWith('> ')) {
      return lineText.slice(2)
    }
    return `> ${lineText}`
  })
}

export function insertTable(view: EditorView, rows: number, cols: number): boolean {
  const { state } = view
  const range = state.selection.main
  const line = state.doc.lineAt(range.from)
  const table = createEmptyTable(rows, cols)
  const prefix = line.text.length > 0 ? '\n\n' : ''
  const insert = `${prefix}${table}\n`
  const cursorPos = line.to + prefix.length + table.indexOf('Header 1') + 'Header 1'.length

  view.dispatch({
    changes: { from: line.to, to: line.to, insert },
    selection: EditorSelection.single(
      line.to + prefix.length + table.indexOf('Header 1'),
      cursorPos,
    ),
    scrollIntoView: true,
  })

  return true
}

export function insertHorizontalRule(view: EditorView): boolean {
  const { state } = view
  const range = state.selection.main
  const line = state.doc.lineAt(range.from)
  const insert = line.text.length > 0 ? '\n\n---\n\n' : '---\n\n'
  const cursorPos = line.to + insert.length

  view.dispatch({
    changes: { from: line.to, to: line.to, insert },
    selection: EditorSelection.single(cursorPos, cursorPos),
    scrollIntoView: true,
  })

  return true
}
