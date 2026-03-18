import { useRef, useEffect, useMemo, useCallback } from 'react'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { markdownAutocomplete } from '../utils/autocomplete'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useEditorStore } from '../store/editorStore'
import { useThemeStore } from '../store/themeStore'
import { editorViewRef } from '../utils/editorViewRef'
import { Toolbar } from './Toolbar'

const lightTheme = EditorView.theme({
  '&': { backgroundColor: '#ffffff', color: '#24292e' },
  '.cm-gutters': { backgroundColor: '#fafbfc', color: '#959da5', borderRight: '1px solid #e1e4e8' },
  '.cm-activeLineGutter': { backgroundColor: '#f1f8ff' },
  '.cm-activeLine': { backgroundColor: '#f6f8fa' },
  '.cm-cursor': { borderLeftColor: '#24292e' },
  '.cm-selectionBackground': { backgroundColor: '#0366d625' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: '#0366d640' },
})

type EditorProps = {
  onOpen: () => void
  onSave: () => void
}

export function Editor({ onOpen, onSave }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const themeCompRef = useRef(new Compartment())
  const content = useEditorStore((s) => s.content)
  const setContent = useEditorStore((s) => s.setContent)
  const setCursorPosition = useEditorStore((s) => s.setCursorPosition)
  const resolved = useThemeStore((s) => s.resolved)
  const shortcuts = useKeyboardShortcuts({ onOpen, onSave })

  const onUpdate = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          setContent(update.state.doc.toString())
        }
        if (update.selectionSet || update.docChanged) {
          const pos = update.state.selection.main.head
          const line = update.state.doc.lineAt(pos)
          setCursorPosition(line.number, pos - line.from + 1)
        }
      }),
    [setContent, setCursorPosition],
  )

  useEffect(() => {
    if (!containerRef.current) return

    const initialResolved = useThemeStore.getState().resolved
    const themeExt = initialResolved === 'dark' ? oneDark : lightTheme

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        bracketMatching(),
        indentOnInput(),
        markdown(),
        search({ top: true }),
        highlightSelectionMatches(),
        keymap.of(searchKeymap),
        markdownAutocomplete(),
        themeCompRef.current.of(themeExt),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        shortcuts,
        onUpdate,
        EditorView.lineWrapping,
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view
    editorViewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
      editorViewRef.current = null
    }
    // Only run on mount; content updates sync through the separate effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Dynamically switch CodeMirror theme when resolved theme changes
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const themeExt = resolved === 'dark' ? oneDark : lightTheme
    view.dispatch({
      effects: themeCompRef.current.reconfigure(themeExt),
    })
  }, [resolved])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentDoc = view.state.doc.toString()
    if (currentDoc === content) return

    const nextCursor = Math.min(view.state.selection.main.head, content.length)

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: content,
      },
      selection: { anchor: nextCursor, head: nextCursor },
    })
  }, [content])

  const getView = useCallback(() => viewRef.current, [])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Toolbar getView={getView} />
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden" />
    </div>
  )
}
