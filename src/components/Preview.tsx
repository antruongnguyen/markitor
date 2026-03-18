import { useMemo, useRef } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useScrollSync } from '../hooks/useScrollSync'
import { md } from '../utils/markdown'

export function Preview() {
  const content = useEditorStore((s) => s.content)
  const html = useMemo(() => md.render(content), [content])
  const containerRef = useRef<HTMLDivElement>(null)

  useScrollSync(containerRef)

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-auto bg-white p-8 transition-colors dark:bg-gray-900"
    >
      <article
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
