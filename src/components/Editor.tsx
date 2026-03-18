import { useRef, useEffect, useMemo } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useEditorStore } from '../store/editorStore'

type EditorProps = {
  onOpen: () => void
  onSave: () => void
}

export function Editor({ onOpen, onSave }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const content = useEditorStore((s) => s.content)
  const setContent = useEditorStore((s) => s.setContent)
  const shortcuts = useKeyboardShortcuts({ onOpen, onSave })

  const onUpdate = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          setContent(update.state.doc.toString())
        }
      }),
    [setContent],
  )

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        bracketMatching(),
        indentOnInput(),
        markdown(),
        oneDark,
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

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Only run on mount — content is managed internally by CodeMirror after init
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="h-full w-full overflow-hidden" />
}
