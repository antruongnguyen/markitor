import { md } from './markdown'
import { escapeHtml } from './html'

/**
 * Inline CSS for standalone HTML export.
 * Includes preview prose typography and highlight.js GitHub theme essentials.
 */
const EXPORT_CSS = `
  /* Reset & base */
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    background: #ffffff;
    color: #1f2937;
    line-height: 1.75;
  }
  .preview-content {
    max-width: 65ch;
    margin: 0 auto;
    color: #1f2937;
    line-height: 1.75;
  }
  .preview-content h1, .preview-content h2, .preview-content h3,
  .preview-content h4, .preview-content h5, .preview-content h6 {
    color: #111827; font-weight: 700; line-height: 1.3;
    margin-top: 1.5em; margin-bottom: 0.5em;
  }
  .preview-content h1 { font-size: 2em; padding-bottom: 0.3em; border-bottom: 1px solid #e5e7eb; }
  .preview-content h2 { font-size: 1.5em; padding-bottom: 0.25em; border-bottom: 1px solid #e5e7eb; }
  .preview-content h3 { font-size: 1.25em; }
  .preview-content p { margin-top: 0; margin-bottom: 1em; }
  .preview-content a { color: #2563eb; text-decoration: underline; }
  .preview-content strong { font-weight: 700; color: #111827; }
  .preview-content em { font-style: italic; }
  .preview-content blockquote {
    border-left: 4px solid #d1d5db; padding: 0.5em 1em; margin: 1em 0;
    color: #6b7280; background: #f9fafb; border-radius: 0 4px 4px 0;
  }
  .preview-content blockquote p { margin-bottom: 0; }
  .preview-content ul, .preview-content ol { padding-left: 1.5em; margin-top: 0; margin-bottom: 1em; }
  .preview-content ul { list-style-type: disc; }
  .preview-content ol { list-style-type: decimal; }
  .preview-content li { margin-bottom: 0.25em; }
  .preview-content code {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 0.875em; background: #f3f4f6; padding: 0.2em 0.4em; border-radius: 3px;
  }
  .preview-content pre {
    background: #f6f8fa; border: 1px solid #e5e7eb; border-radius: 6px;
    padding: 1em; overflow-x: auto; margin: 1em 0;
  }
  .preview-content pre code { background: none; padding: 0; font-size: 0.85em; line-height: 1.6; }
  .preview-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 2em 0; }
  .preview-content img { max-width: 100%; border-radius: 4px; }
  .preview-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  .preview-content th, .preview-content td { border: 1px solid #d1d5db; padding: 0.5em 0.75em; text-align: left; }
  .preview-content th { background: #f3f4f6; font-weight: 600; }
  .preview-content .task-list-item { list-style-type: none; position: relative; margin-left: -1.5em; padding-left: 1.5em; }
  .preview-content .task-list-item input[type="checkbox"] { position: absolute; left: 0; top: 0.3em; margin: 0; }

  /* highlight.js GitHub theme essentials */
  .hljs { color: #24292e; }
  .hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-section { color: #d73a49; }
  .hljs-string, .hljs-title, .hljs-name, .hljs-type, .hljs-attribute,
  .hljs-symbol, .hljs-bullet, .hljs-addition, .hljs-variable,
  .hljs-template-tag, .hljs-template-variable { color: #032f62; }
  .hljs-comment, .hljs-quote, .hljs-deletion, .hljs-meta { color: #6a737d; font-style: italic; }
  .hljs-number { color: #005cc5; }
  .hljs-built_in { color: #e36209; }
  .hljs-attr { color: #6f42c1; }
  .hljs-link { color: #032f62; }
  .hljs-params { color: #24292e; }

  /* Print-specific */
  @media print {
    body { padding: 0; }
    .preview-content { max-width: none; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
  }
`

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '')
}

/**
 * Render markdown content to a complete standalone HTML document string.
 */
function buildHTMLDocument(markdownContent: string, title: string): string {
  const renderedBody = md.render(markdownContent)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${EXPORT_CSS}</style>
</head>
<body>
  <article class="preview-content">
    ${renderedBody}
  </article>
</body>
</html>`
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/**
 * Export the current markdown content as a standalone HTML file.
 * Triggers a download with inlined CSS for syntax highlighting and prose styles.
 */
export function exportHTML(markdownContent: string, fileName: string): void {
  const title = stripExtension(fileName)
  const html = buildHTMLDocument(markdownContent, title)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  downloadBlob(blob, `${title}.html`)
}

/**
 * Export as PDF using browser print dialog.
 * Renders the preview into a hidden iframe and triggers print.
 */
export function exportPDF(markdownContent: string, fileName: string): void {
  const title = stripExtension(fileName)
  const html = buildHTMLDocument(markdownContent, title)

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-9999px'
  iframe.style.top = '-9999px'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  document.body.append(iframe)

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
  if (!iframeDoc) {
    iframe.remove()
    return
  }

  iframeDoc.open()
  iframeDoc.write(html)
  iframeDoc.close()

  // Wait for content to render before printing
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print()
      // Clean up after print dialog closes
      setTimeout(() => {
        iframe.remove()
      }, 1000)
    }, 250)
  }

  // Fallback if onload already fired (for about:blank writes)
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      iframe.contentWindow?.print()
      setTimeout(() => {
        iframe.remove()
      }, 1000)
    }
  }, 500)
}
