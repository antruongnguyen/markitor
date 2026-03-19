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
  toggleTaskList,
  insertBlockquote,
  indentLines,
  outdentLines,
  formatDocument,
} from '../utils/editorCommands'
import { SHORTCUTS, toCMKey, getEffectiveKeys } from '../utils/shortcuts'
import { useShortcutsStore } from '../store/shortcutsStore'
import { useToastStore } from '../store/toastStore'
import { useEditorStore } from '../store/editorStore'
import { useEmojiPickerStore } from '../store/emojiPickerStore'
import { useFocusModeStore } from '../store/focusModeStore'
import { useFrontmatterStore } from '../store/frontmatterStore'

type ShortcutHandlers = {
  onSave?: () => void | Promise<void>
  onSaveDisk?: () => void | Promise<void>
  onOpen?: () => void | Promise<void>
}

/** Look up the effective CM key for a shortcut ID */
function key(id: string, customBindings: Record<string, string>): string {
  const shortcut = SHORTCUTS.find((s) => s.id === id)
  if (!shortcut) return ''
  return toCMKey(getEffectiveKeys(shortcut, customBindings))
}

function makeShortcutBindings(
  handlers: ShortcutHandlers,
  customBindings: Record<string, string>,
): KeyBinding[] {
  return [
    { key: key('format.bold', customBindings), run: toggleBold },
    { key: key('format.italic', customBindings), run: toggleItalic },
    { key: key('format.strikethrough', customBindings), run: toggleStrikethrough },
    { key: key('format.inline-code', customBindings), run: toggleInlineCode },
    { key: key('format.link', customBindings), run: toggleLink },
    { key: key('format.code-block', customBindings), run: toggleCodeBlock },
    { key: key('format.h1', customBindings), run: (view) => toggleHeading(view, 1) },
    { key: key('format.h2', customBindings), run: (view) => toggleHeading(view, 2) },
    { key: key('format.h3', customBindings), run: (view) => toggleHeading(view, 3) },
    { key: key('format.h4', customBindings), run: (view) => toggleHeading(view, 4) },
    { key: key('format.h5', customBindings), run: (view) => toggleHeading(view, 5) },
    { key: key('format.h6', customBindings), run: (view) => toggleHeading(view, 6) },
    { key: key('format.ul', customBindings), run: toggleUnorderedList },
    { key: key('format.ol', customBindings), run: toggleOrderedList },
    { key: key('format.task-list', customBindings), run: toggleTaskList },
    { key: key('format.blockquote', customBindings), run: insertBlockquote },
    { key: key('format.indent', customBindings), run: indentLines },
    { key: key('format.outdent', customBindings), run: outdentLines },
    {
      key: key('format.document', customBindings),
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
      key: key('file.save', customBindings),
      run: () => {
        handlers.onSave?.()
        return true
      },
    },
    {
      key: key('file.save-disk', customBindings),
      run: () => {
        handlers.onSaveDisk?.()
        return true
      },
    },
    {
      key: key('file.open', customBindings),
      run: () => {
        handlers.onOpen?.()
        return true
      },
    },
    {
      key: key('format.emoji', customBindings),
      run: () => {
        useEmojiPickerStore.getState().toggle()
        return true
      },
    },
    {
      key: key('view.typewriter', customBindings),
      run: () => {
        useFocusModeStore.getState().toggleTypewriter()
        return true
      },
    },
    {
      key: key('view.frontmatter', customBindings),
      run: () => {
        useFrontmatterStore.getState().toggle()
        return true
      },
    },
  ]
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}): Extension {
  const customBindings = useShortcutsStore((s) => s.customBindings)
  const bindingsVersion = useShortcutsStore((s) => s.bindingsVersion)

  return useMemo(
    () => keymap.of(makeShortcutBindings(handlers, customBindings)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handlers, bindingsVersion],
  )
}
