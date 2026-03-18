import { useMemo } from 'react'
import type { Extension } from '@codemirror/state'
import { type KeyBinding, keymap } from '@codemirror/view'
import {
  toggleBold,
  toggleItalic,
  toggleStrikethrough,
  toggleInlineCode,
  toggleLink,
  toggleCodeBlock,
  toggleHeading,
  toggleUnorderedList,
  toggleOrderedList,
  insertBlockquote,
  formatDocument,
} from '../utils/editorCommands'
import { useToastStore } from '../store/toastStore'
import { useEditorStore } from '../store/editorStore'

type ShortcutHandlers = {
  onSave?: () => void | Promise<void>
  onOpen?: () => void | Promise<void>
}

function makeShortcutBindings(handlers: ShortcutHandlers): KeyBinding[] {
  return [
    { key: 'Mod-b', run: toggleBold },
    { key: 'Mod-i', run: toggleItalic },
    { key: 'Mod-Shift-x', run: toggleStrikethrough },
    { key: 'Mod-e', run: toggleInlineCode },
    { key: 'Mod-k', run: toggleLink },
    { key: 'Mod-Shift-k', run: toggleCodeBlock },
    { key: 'Mod-1', run: (view) => toggleHeading(view, 1) },
    { key: 'Mod-2', run: (view) => toggleHeading(view, 2) },
    { key: 'Mod-3', run: (view) => toggleHeading(view, 3) },
    { key: 'Mod-l', run: toggleUnorderedList },
    { key: 'Mod-Shift-l', run: toggleOrderedList },
    { key: 'Mod-Shift-q', run: insertBlockquote },
    {
      key: 'Alt-Shift-f',
      run: (view) => {
        const result = formatDocument(view)
        if (result) {
          useEditorStore.getState().setDirty(true)
          useToastStore.getState().show('Document formatted')
        }
        return result
      },
    },
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
