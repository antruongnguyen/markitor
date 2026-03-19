import { useEffect, useMemo, useRef } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useThemeStore } from '../store/themeStore'
import { useLayoutStore } from '../store/layoutStore'
import { usePreviewStyleStore } from '../store/previewStyleStore'
import { useScrollSync } from '../hooks/useScrollSync'
import { md } from '../utils/markdown'
import { injectPreviewCSS } from '../utils/previewStyles'
import { initMermaid, updateMermaidTheme, renderMermaidDiagram } from '../utils/mermaidRenderer'

// Initialize mermaid with the current theme on module load
initMermaid(useThemeStore.getState().resolved)

export function Preview() {
  const content = useEditorStore((s) => s.content)
  const resolved = useThemeStore((s) => s.resolved)
  const editorTheme = useThemeStore((s) => s.editorTheme)
  const layoutMode = useLayoutStore((s) => s.mode)
  const customCSS = usePreviewStyleStore((s) => s.customCSS)
  const html = useMemo(() => md.render(content), [content])
  const containerRef = useRef<HTMLDivElement>(null)
  const articleRef = useRef<HTMLElement>(null)

  useScrollSync(containerRef)

  // Inject custom preview CSS
  useEffect(() => {
    injectPreviewCSS(customCSS)
  }, [customCSS])

  // Update mermaid theme when resolved theme changes
  useEffect(() => {
    updateMermaidTheme(resolved)
  }, [resolved])

  // Post-process: find mermaid code blocks and render them as SVG
  useEffect(() => {
    const article = articleRef.current
    if (!article) return

    const codeBlocks = article.querySelectorAll<HTMLElement>('code.language-mermaid')
    if (codeBlocks.length === 0) return

    let cancelled = false

    async function renderAll() {
      for (const code of codeBlocks) {
        if (cancelled) return

        const pre = code.parentElement
        if (!pre || pre.tagName !== 'PRE') continue
        // Skip if already rendered
        if (pre.dataset.mermaidRendered) continue

        const source = code.textContent ?? ''
        if (!source.trim()) continue

        pre.dataset.mermaidRendered = 'true'
        const result = await renderMermaidDiagram(source)

        if (cancelled) return

        if ('svg' in result) {
          const wrapper = document.createElement('div')
          wrapper.className = 'mermaid-diagram'
          wrapper.innerHTML = result.svg
          pre.replaceWith(wrapper)
        } else {
          const errorEl = document.createElement('div')
          errorEl.className = 'mermaid-error'
          errorEl.textContent = result.error
          pre.replaceWith(errorEl)
        }
      }
    }

    renderAll()

    return () => {
      cancelled = true
    }
  }, [html, resolved])

  return (
    <div
      ref={containerRef}
      className="custom-scrollbar h-full w-full overflow-auto bg-white p-8 transition-colors duration-200 dark:bg-gray-900"
      data-hljs-theme={editorTheme}
    >
      <article
        ref={articleRef}
        className={`preview-content ${layoutMode === 'preview' ? 'px-12' : 'mx-auto'}`}
        style={layoutMode === 'preview' ? { maxWidth: 'none' } : undefined}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
