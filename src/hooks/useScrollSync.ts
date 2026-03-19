import { useEffect, useRef, type RefObject } from 'react'
import { editorViewRef } from '../utils/editorViewRef'
import { useScrollSyncStore } from '../store/scrollSyncStore'
import { syncPreviewToEditor, syncEditorToPreview } from '../utils/scrollSync'

/**
 * Hook that synchronizes scrolling between the CodeMirror editor and the
 * preview container. Attaches scroll listeners to both and uses
 * data-source-line attributes for accurate mapping.
 */
export function useScrollSync(previewRef: RefObject<HTMLElement | null>): void {
  const enabled = useScrollSyncStore((s) => s.enabled)
  const rafRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const previewEl = previewRef.current
    const view = editorViewRef.current
    if (!previewEl || !view) return

    const editorScroller = view.scrollDOM

    const onEditorScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const v = editorViewRef.current
        if (v && previewRef.current) {
          syncPreviewToEditor(v, previewRef.current)
        }
      })
    }

    const onPreviewScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const v = editorViewRef.current
        if (v && previewRef.current) {
          syncEditorToPreview(v, previewRef.current)
        }
      })
    }

    editorScroller.addEventListener('scroll', onEditorScroll, { passive: true })
    previewEl.addEventListener('scroll', onPreviewScroll, { passive: true })

    return () => {
      cancelAnimationFrame(rafRef.current)
      editorScroller.removeEventListener('scroll', onEditorScroll)
      previewEl.removeEventListener('scroll', onPreviewScroll)
    }
  }, [enabled, previewRef])
}
