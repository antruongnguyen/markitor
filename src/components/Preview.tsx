import { useMemo } from 'react'
import { useEditorStore } from '../store/editorStore'
import { md } from '../utils/markdown'

export function Preview() {
  const content = useEditorStore((s) => s.content)
  const html = useMemo(() => md.render(content), [content])

  return (
    <div className="h-full w-full overflow-auto bg-white p-8 transition-colors dark:bg-gray-900">
      <article
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
