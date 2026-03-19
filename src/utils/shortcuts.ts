/**
 * Central keyboard shortcuts registry.
 *
 * Every shortcut in the app is defined here once. The registry is consumed by:
 *  - useKeyboardShortcuts (CodeMirror keybindings)
 *  - Toolbar (tooltip labels)
 *  - CommandPalette (shortcut hints)
 *  - KeyboardShortcutsDialog (viewer + rebinding UI)
 *
 * Keys use a display-friendly format: 'Mod+B', 'Mod+Shift+X', 'Alt+Shift+F'.
 * 'Mod' is resolved to Cmd (Mac) or Ctrl (other) at display/binding time.
 */

export type ShortcutCategory = 'File' | 'Format' | 'Search' | 'View' | 'Layout'

export type ShortcutDef = {
  id: string
  name: string
  category: ShortcutCategory
  keys: string
  description: string
}

export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  'File',
  'Format',
  'Search',
  'View',
  'Layout',
]

export const SHORTCUTS: ShortcutDef[] = [
  // ── File ──────────────────────────────────────────────
  { id: 'file.save', name: 'Save to Browser', category: 'File', keys: 'Mod+S', description: 'Save to browser storage (IndexedDB)' },
  { id: 'file.save-disk', name: 'Save to Disk', category: 'File', keys: 'Mod+Shift+S', description: 'Save the current file to disk' },
  { id: 'file.open', name: 'Open File', category: 'File', keys: 'Mod+O', description: 'Open a file from disk' },
  { id: 'file.close-tab', name: 'Close Tab', category: 'File', keys: 'Mod+W', description: 'Close the active tab' },

  // ── Format ────────────────────────────────────────────
  { id: 'format.paste-plain', name: 'Paste as Plain Text', category: 'Format', keys: 'Mod+Shift+V', description: 'Paste as plain text (bypass smart paste)' },
  { id: 'format.bold', name: 'Bold', category: 'Format', keys: 'Mod+B', description: 'Toggle bold formatting' },
  { id: 'format.italic', name: 'Italic', category: 'Format', keys: 'Mod+I', description: 'Toggle italic formatting' },
  { id: 'format.strikethrough', name: 'Strikethrough', category: 'Format', keys: 'Mod+Shift+X', description: 'Toggle strikethrough formatting' },
  { id: 'format.inline-code', name: 'Inline Code', category: 'Format', keys: 'Mod+E', description: 'Toggle inline code formatting' },
  { id: 'format.link', name: 'Insert Link', category: 'Format', keys: 'Mod+K', description: 'Insert or toggle a link' },
  { id: 'format.code-block', name: 'Code Block', category: 'Format', keys: 'Mod+Shift+K', description: 'Insert a fenced code block' },
  { id: 'format.h1', name: 'Heading 1', category: 'Format', keys: 'Mod+1', description: 'Toggle heading level 1' },
  { id: 'format.h2', name: 'Heading 2', category: 'Format', keys: 'Mod+2', description: 'Toggle heading level 2' },
  { id: 'format.h3', name: 'Heading 3', category: 'Format', keys: 'Mod+3', description: 'Toggle heading level 3' },
  { id: 'format.h4', name: 'Heading 4', category: 'Format', keys: 'Mod+4', description: 'Toggle heading level 4' },
  { id: 'format.h5', name: 'Heading 5', category: 'Format', keys: 'Mod+5', description: 'Toggle heading level 5' },
  { id: 'format.h6', name: 'Heading 6', category: 'Format', keys: 'Mod+6', description: 'Toggle heading level 6' },
  { id: 'format.ul', name: 'Unordered List', category: 'Format', keys: 'Mod+L', description: 'Toggle unordered (bullet) list' },
  { id: 'format.ol', name: 'Ordered List', category: 'Format', keys: 'Mod+Shift+L', description: 'Toggle ordered (numbered) list' },
  { id: 'format.task-list', name: 'Task List', category: 'Format', keys: 'Mod+Shift+T', description: 'Toggle task/checkbox list' },
  { id: 'format.blockquote', name: 'Blockquote', category: 'Format', keys: 'Mod+Shift+Q', description: 'Insert a blockquote' },
  { id: 'format.indent', name: 'Indent', category: 'Format', keys: 'Tab', description: 'Indent the current line(s)' },
  { id: 'format.outdent', name: 'Outdent', category: 'Format', keys: 'Shift+Tab', description: 'Outdent the current line(s)' },
  { id: 'format.emoji', name: 'Insert Emoji', category: 'Format', keys: 'Mod+.', description: 'Open the emoji picker' },
  { id: 'format.document', name: 'Format Document', category: 'Format', keys: 'Alt+Shift+F', description: 'Auto-format the entire document' },
  { id: 'format.undo', name: 'Undo', category: 'Format', keys: 'Mod+Z', description: 'Undo the last edit' },
  { id: 'format.redo', name: 'Redo', category: 'Format', keys: 'Mod+Shift+Z', description: 'Redo the last undone edit' },

  // ── Search ────────────────────────────────────────────
  { id: 'search.find', name: 'Find', category: 'Search', keys: 'Mod+F', description: 'Open the find panel' },
  { id: 'search.find-replace', name: 'Find & Replace', category: 'Search', keys: 'Mod+H', description: 'Open find and replace' },

  // ── View / Panels ────────────────────────────────────
  { id: 'view.command-palette', name: 'Command Palette', category: 'View', keys: 'Mod+P', description: 'Open the command palette' },
  { id: 'view.focus-mode', name: 'Focus Mode', category: 'View', keys: 'Mod+Shift+F', description: 'Toggle distraction-free focus mode' },
  { id: 'view.stats', name: 'Writing Statistics', category: 'View', keys: 'Mod+Alt+S', description: 'Toggle the writing statistics panel' },
  { id: 'view.export', name: 'Export Menu', category: 'View', keys: 'Mod+Shift+E', description: 'Toggle the export menu' },
  { id: 'view.typewriter', name: 'Typewriter Mode', category: 'View', keys: 'Mod+Alt+T', description: 'Toggle typewriter mode (cursor stays centered)' },
  { id: 'view.shortcuts', name: 'Keyboard Shortcuts', category: 'View', keys: 'Mod+/', description: 'Show all keyboard shortcuts' },

  // ── Layout ────────────────────────────────────────────
  { id: 'layout.editor', name: 'Editor Only', category: 'Layout', keys: 'Mod+Shift+1', description: 'Switch to editor-only layout' },
  { id: 'layout.split', name: 'Split View', category: 'Layout', keys: 'Mod+Shift+2', description: 'Switch to split editor+preview layout' },
  { id: 'layout.preview', name: 'Preview Only', category: 'Layout', keys: 'Mod+Shift+3', description: 'Switch to preview-only layout' },
]

// ── Platform helpers ────────────────────────────────────

export function isMac(): boolean {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

/** Convert display format to CodeMirror key format: 'Mod+Shift+B' → 'Mod-Shift-b' */
export function toCMKey(keys: string): string {
  return keys
    .split('+')
    .map((part, i, arr) => {
      if (i === arr.length - 1 && part.length === 1) return part.toLowerCase()
      return part
    })
    .join('-')
}

/** Split a display-format key combo into platform-resolved parts for badge rendering */
export function toDisplayParts(keys: string): string[] {
  const mac = isMac()
  return keys.split('+').map((part) => {
    if (part === 'Mod') return mac ? '⌘' : 'Ctrl'
    if (part === 'Shift') return mac ? '⇧' : 'Shift'
    if (part === 'Alt') return mac ? '⌥' : 'Alt'
    if (part === 'Ctrl') return mac ? '⌃' : 'Ctrl'
    return part
  })
}

/** Format keys for inline text display (toolbar tooltips, command palette) */
export function formatKeysInline(keys: string): string {
  const mac = isMac()
  return keys
    .split('+')
    .map((part) => {
      if (part === 'Mod') return mac ? 'Cmd' : 'Ctrl'
      return part
    })
    .join('+')
}

// ── Custom bindings (localStorage) ──────────────────────

const STORAGE_KEY = 'markitor-custom-shortcuts'

export function getCustomBindings(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function saveCustomBindings(bindings: Record<string, string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings))
}

export function getEffectiveKeys(shortcut: ShortcutDef, customBindings?: Record<string, string>): string {
  const bindings = customBindings ?? getCustomBindings()
  return bindings[shortcut.id] || shortcut.keys
}

// ── Lookup helpers ──────────────────────────────────────

export function getShortcutById(id: string): ShortcutDef | undefined {
  return SHORTCUTS.find((s) => s.id === id)
}

export function getShortcutsByCategory(category: ShortcutCategory): ShortcutDef[] {
  return SHORTCUTS.filter((s) => s.category === category)
}

/** Build a display-ready tooltip string: "Bold (Ctrl+B)" */
export function tooltipWithShortcut(label: string, shortcutId: string): string {
  const shortcut = getShortcutById(shortcutId)
  if (!shortcut) return label
  const keys = getEffectiveKeys(shortcut)
  return `${label} (${formatKeysInline(keys)})`
}

/** Convert a keyboard event to our display key format */
export function keyEventToKeys(e: KeyboardEvent): string | null {
  const parts: string[] = []
  if (e.metaKey || e.ctrlKey) parts.push('Mod')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')

  const key = e.key
  // Ignore standalone modifier keys
  if (['Control', 'Meta', 'Shift', 'Alt'].includes(key)) return null

  // Normalize key
  if (key === ' ') parts.push('Space')
  else if (key === '/') parts.push('/')
  else if (key === '.') parts.push('.')
  else if (key === ',') parts.push(',')
  else if (key === 'Tab') parts.push('Tab')
  else if (key === 'Escape') return null // Don't allow Escape as a shortcut
  else if (key === 'Enter') parts.push('Enter')
  else if (key.length === 1) parts.push(key.toUpperCase())
  else parts.push(key)

  // Need at least one modifier for most shortcuts (except Tab, etc.)
  if (parts.length === 1 && !['Tab', 'Enter', 'Space'].includes(parts[0])) return null

  return parts.join('+')
}

/** Find shortcuts that conflict with a given key combo */
export function findConflicts(
  keys: string,
  excludeId: string,
  customBindings?: Record<string, string>,
): ShortcutDef[] {
  const bindings = customBindings ?? getCustomBindings()
  return SHORTCUTS.filter((s) => {
    if (s.id === excludeId) return false
    const effective = bindings[s.id] || s.keys
    return effective === keys
  })
}
