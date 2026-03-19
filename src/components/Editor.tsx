import { useRef, useEffect, useMemo, useCallback } from 'react'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, scrollPastEnd } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { search, searchKeymap, highlightSelectionMatches, openSearchPanel } from '@codemirror/search'
import { history, historyKeymap } from '@codemirror/commands'
import { linter, lintGutter } from '@codemirror/lint'
import { lintMarkdown } from '../utils/markdownLinter'
import { useLintStore } from '../store/lintStore'
import { markdownAutocomplete } from '../utils/autocomplete'
import { imageDropHandler } from '../utils/imageHandler'
import { smartPasteHandler } from '../utils/smartPaste'
import { tableTabNavigation } from '../utils/tableTabNavigation'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useEditorStore } from '../store/editorStore'
import { useFocusModeStore } from '../store/focusModeStore'
import { useThemeStore } from '../store/themeStore'
import { useSearchStore } from '../store/searchStore'
import { editorViewRef } from '../utils/editorViewRef'
import { getThemeExtension } from '../utils/editorThemes'
import { createSearchPanel } from '../utils/createSearchPanel'
import { Toolbar } from './Toolbar'
import { TableToolbar } from './TableToolbar'
import { FrontmatterEditor } from './FrontmatterEditor'

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
  '&': { backgroundColor: '#282c34', color: '#abb2bf' },
  '.cm-gutters': { backgroundColor: 'transparent', color: '#5c6370', border: 'none' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent' },
  '.cm-activeLine': { backgroundColor: '#2c313a' },
  '.cm-cursor': { borderLeftColor: '#abb2bf' },
  '.cm-selectionBackground': { backgroundColor: '#3e4451' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: '#3e4451' },
})

type EditorProps = {
  onOpen: () => void
  onSave: () => void
  onSaveDisk: () => void
  focusMode?: boolean
}

export function Editor({ onOpen, onSave, onSaveDisk, focusMode = false }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const themeCompRef = useRef(new Compartment())
  const focusStyleCompRef = useRef(new Compartment())
  const typewriterCompRef = useRef(new Compartment())
  const lintCompRef = useRef(new Compartment())
  const content = useEditorStore((s) => s.content)
  const setContent = useEditorStore((s) => s.setContent)
  const setCursorPosition = useEditorStore((s) => s.setCursorPosition)
  const resolved = useThemeStore((s) => s.resolved)
  const typewriterMode = useFocusModeStore((s) => s.typewriterMode)
  const lintEnabled = useLintStore((s) => s.enabled)
  const shortcuts = useKeyboardShortcuts({ onOpen, onSave, onSaveDisk })

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
    const initialLint = useLintStore.getState().enabled
    const themeExt = initialFocus
      ? (initialResolved === 'dark' ? focusDarkTheme : focusLightTheme)
      : getThemeExtension(initialResolved)
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
        history(),
        bracketMatching(),
        indentOnInput(),
        markdown(),
        search({ top: true, createPanel: createSearchPanel }),
        highlightSelectionMatches(),
        keymap.of([
          {
            key: 'Mod-h',
            run: (v) => {
              useSearchStore.getState().setShowReplace(true)
              openSearchPanel(v)
              return true
            },
          },
          ...historyKeymap,
          ...searchKeymap,
        ]),
        tableTabNavigation(),
        markdownAutocomplete(),
        imageDropHandler(),
        smartPasteHandler(),
        themeCompRef.current.of(themeExt),
        focusStyleCompRef.current.of(focusStyleExt),
        typewriterCompRef.current.of([]),
        lintCompRef.current.of(
          initialLint
            ? [linter((view) => lintMarkdown(view.state.doc), { delay: 400 }), lintGutter()]
            : [],
        ),
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

  // Dynamically switch CodeMirror theme when dark/light mode or focus mode changes
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const themeExt = focusMode
      ? (resolved === 'dark' ? focusDarkTheme : focusLightTheme)
      : getThemeExtension(resolved)
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

  // Toggle lint extension when lintEnabled changes
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: lintCompRef.current.reconfigure(
        lintEnabled
          ? [linter((v) => lintMarkdown(v.state.doc), { delay: 400 }), lintGutter()]
          : [],
      ),
    })
  }, [lintEnabled])

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
    if (!view || !typewriterMode) return

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
    view.dispatch({ effects: comp.reconfigure([handler, scrollPastEnd()]) })
    return () => {
      if (viewRef.current) {
        viewRef.current.dispatch({ effects: comp.reconfigure([]) })
      }
    }
  }, [typewriterMode])

  const getView = useCallback(() => viewRef.current, [])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {!focusMode && <Toolbar getView={getView} />}
      {!focusMode && <FrontmatterEditor />}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />
        {typewriterMode && (
          <div
            className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-violet-400/15 dark:bg-violet-400/10"
            aria-hidden="true"
          />
        )}
        {!focusMode && <TableToolbar getView={getView} />}
      </div>
    </div>
  )
}
