import { useMemo } from 'react'
import { EditorSelection, type Extension } from '@codemirror/state'
import {
  EditorView,
  type KeyBinding,
  keymap,
} from '@codemirror/view'

type ShortcutHandlers = {
  onSave?: () => void | Promise<void>
  onOpen?: () => void | Promise<void>
}

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

function toggleInlineWrap(
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

function transformLinePrefix(
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

function toggleHeading(level: 1 | 2 | 3) {
  const prefix = `${'#'.repeat(level)} `

  return (view: EditorView): boolean => {
    return transformLinePrefix(view, (lineText) => {
      if (lineText.startsWith(prefix)) {
        return lineText.slice(prefix.length)
      }

      return `${prefix}${stripHeading(lineText)}`
    })
  }
}

function toggleUnorderedList(view: EditorView): boolean {
  return transformLinePrefix(view, (lineText) => {
    if (lineText.startsWith('- ')) {
      return lineText.slice(2)
    }

    return `- ${lineText.replace(/^\d+\.\s+/, '')}`
  })
}

function toggleOrderedList(view: EditorView): boolean {
  return transformLinePrefix(view, (lineText) => {
    if (/^\d+\.\s+/.test(lineText)) {
      return lineText.replace(/^\d+\.\s+/, '')
    }

    return `1. ${lineText.replace(/^-\s+/, '')}`
  })
}

function toggleLink(view: EditorView): boolean {
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

function toggleCodeBlock(view: EditorView): boolean {
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

function makeShortcutBindings(handlers: ShortcutHandlers): KeyBinding[] {
  return [
    {
      key: 'Mod-b',
      run: (view: EditorView) =>
        toggleInlineWrap(view, {
          prefix: '**',
          suffix: '**',
          placeholder: 'bold',
        }),
    },
    {
      key: 'Mod-i',
      run: (view: EditorView) =>
        toggleInlineWrap(view, {
          prefix: '*',
          suffix: '*',
          placeholder: 'italic',
        }),
    },
    { key: 'Mod-k', run: toggleLink },
    { key: 'Mod-Shift-k', run: toggleCodeBlock },
    { key: 'Mod-1', run: toggleHeading(1) },
    { key: 'Mod-2', run: toggleHeading(2) },
    { key: 'Mod-3', run: toggleHeading(3) },
    { key: 'Mod-l', run: toggleUnorderedList },
    { key: 'Mod-Shift-l', run: toggleOrderedList },
    {
      key: 'Mod-s',
      run: () => {
        handlers.onSave?.()
        return true
      },
    },
    {
      key: 'Mod-o',
      run: () => {
        handlers.onOpen?.()
        return true
      },
    },
  ]
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}): Extension {
  return useMemo(() => keymap.of(makeShortcutBindings(handlers)), [handlers])
}
