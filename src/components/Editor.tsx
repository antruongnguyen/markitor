import { useRef, useEffect, useMemo, useCallback } from 'react'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { markdownAutocomplete } from '../utils/autocomplete'
import { imageDropHandler } from '../utils/imageHandler'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useEditorStore } from '../store/editorStore'
import { useFocusModeStore } from '../store/focusModeStore'
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

const focusLightTheme = EditorView.theme({
  '&': { backgroundColor: '#faf9f6', color: '#24292e' },
  '.cm-gutters': { backgroundColor: 'transparent', color: '#959da5', border: 'none' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '.cm-activeLine': { backgroundColor: '#f0efe8' },
  '.cm-cursor': { borderLeftColor: '#24292e' },
  '.cm-selectionBackground': { backgroundColor: '#0366d625' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: '#0366d640' },
})

const focusDarkTheme = EditorView.theme({
  '&': { backgroundColor: '#0d1117', color: '#c9d1d9' },
  '.cm-gutters': { backgroundColor: 'transparent', color: '#484f58', border: 'none' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '.cm-activeLine': { backgroundColor: '#161b22' },
  '.cm-cursor': { borderLeftColor: '#c9d1d9' },
  '.cm-selectionBackground': { backgroundColor: '#388bfd33' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: '#388bfd55' },
})

type EditorProps = {
  onOpen: () => void
  onSave: () => void
  focusMode?: boolean
}

export function Editor({ onOpen, onSave, focusMode = false }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const themeCompRef = useRef(new Compartment())
  const focusStyleCompRef = useRef(new Compartment())
  const typewriterCompRef = useRef(new Compartment())
  const content = useEditorStore((s) => s.content)
  const setContent = useEditorStore((s) => s.setContent)
  const setCursorPosition = useEditorStore((s) => s.setCursorPosition)
  const resolved = useThemeStore((s) => s.resolved)
  const typewriterMode = useFocusModeStore((s) => s.typewriterMode)
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
    const initialFocus = useFocusModeStore.getState().enabled
    const themeExt = initialFocus
      ? (initialResolved === 'dark' ? focusDarkTheme : focusLightTheme)
      : (initialResolved === 'dark' ? oneDark : lightTheme)
    const focusStyleExt = initialFocus
      ? EditorView.theme({
          '.cm-content': { fontSize: '18px', lineHeight: '1.8', padding: '2rem 0' },
          '.cm-scroller': { overflow: 'auto' },
        })
      : EditorView.theme({})

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
        imageDropHandler(),
        themeCompRef.current.of(themeExt),
        focusStyleCompRef.current.of(focusStyleExt),
        typewriterCompRef.current.of([]),
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

  // Dynamically switch CodeMirror theme when resolved theme or focus mode changes
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const themeExt = focusMode
      ? (resolved === 'dark' ? focusDarkTheme : focusLightTheme)
      : (resolved === 'dark' ? oneDark : lightTheme)
    const focusStyleExt = focusMode
      ? EditorView.theme({
          '.cm-content': { fontSize: '18px', lineHeight: '1.8', padding: '2rem 0' },
          '.cm-scroller': { overflow: 'auto' },
        })
      : EditorView.theme({})
    view.dispatch({
      effects: [
        themeCompRef.current.reconfigure(themeExt),
        focusStyleCompRef.current.reconfigure(focusStyleExt),
      ],
    })
  }, [resolved, focusMode])

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

  // Typewriter mode: keep cursor line vertically centered
  useEffect(() => {
    const view = viewRef.current
    if (!view || !focusMode || !typewriterMode) return

    const scrollToCursor = () => {
      const pos = view.state.selection.main.head
      const coords = view.coordsAtPos(pos)
      if (!coords) return
      const editorRect = view.dom.getBoundingClientRect()
      const centerY = editorRect.top + editorRect.height / 2
      const offset = coords.top - centerY
      if (Math.abs(offset) > 10) {
        view.scrollDOM.scrollBy({ top: offset, behavior: 'smooth' })
      }
    }

    const handler = EditorView.updateListener.of((update) => {
      if (update.selectionSet || update.docChanged) {
        requestAnimationFrame(scrollToCursor)
      }
    })

    const comp = typewriterCompRef.current
    view.dispatch({ effects: comp.reconfigure(handler) })
    return () => {
      if (viewRef.current) {
        viewRef.current.dispatch({ effects: comp.reconfigure([]) })
      }
    }
  }, [focusMode, typewriterMode])

  const getView = useCallback(() => viewRef.current, [])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {!focusMode && <Toolbar getView={getView} />}
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden" />
    </div>
  )
}
