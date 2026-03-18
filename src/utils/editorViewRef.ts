import type { EditorView } from '@codemirror/view'

/** Shared reference so non-Editor components can imperatively access the view. */
export const editorViewRef: { current: EditorView | null } = { current: null }
