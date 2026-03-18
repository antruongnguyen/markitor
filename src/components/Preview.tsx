import { useMemo } from 'react'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import { useEditorStore } from '../store/editorStore'

const md = MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(str, { language: lang }).value
    }
    return ''
  },
})

export function Preview() {
  const content = useEditorStore((s) => s.content)
  const html = useMemo(() => md.render(content), [content])

  return (
    <div className="h-full w-full overflow-auto bg-white p-8">
      <article
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
