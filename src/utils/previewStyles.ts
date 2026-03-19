export type PreviewPreset = {
  id: string
  name: string
  description: string
  css: string
}

export const PREVIEW_PRESETS: PreviewPreset[] = [
  {
    id: 'serif-academic',
    name: 'Serif Academic',
    description: 'Serif fonts, wider margins, elegant footnote styling',
    css: `.preview-content {
  font-family: 'Georgia', 'Times New Roman', serif;
  line-height: 1.8;
  max-width: 680px;
  margin: 0 auto;
  padding: 2rem 3rem;
}
.preview-content h1, .preview-content h2, .preview-content h3 {
  font-family: 'Georgia', serif;
  font-weight: 700;
  margin-top: 2em;
  margin-bottom: 0.5em;
}
.preview-content h1 { font-size: 1.8em; border-bottom: 2px solid currentColor; padding-bottom: 0.3em; }
.preview-content h2 { font-size: 1.4em; }
.preview-content blockquote {
  font-style: italic;
  border-left: 3px solid #888;
  padding-left: 1.2em;
  margin-left: 0;
  color: #555;
}
.dark .preview-content blockquote { color: #aaa; }
.preview-content p { text-indent: 1.5em; margin: 0.8em 0; }
.preview-content p:first-child { text-indent: 0; }`,
  },
  {
    id: 'newspaper',
    name: 'Newspaper',
    description: 'Multi-column layout with justified text for wider screens',
    css: `.preview-content {
  font-family: 'Georgia', serif;
  columns: 2;
  column-gap: 2.5rem;
  column-rule: 1px solid #ddd;
  text-align: justify;
  hyphens: auto;
  line-height: 1.6;
}
.dark .preview-content { column-rule-color: #444; }
.preview-content h1 {
  column-span: all;
  font-size: 2em;
  text-align: center;
  border-bottom: 3px double #333;
  padding-bottom: 0.3em;
  margin-bottom: 1em;
  font-family: 'Georgia', serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.dark .preview-content h1 { border-bottom-color: #aaa; }
.preview-content h2 {
  column-span: all;
  font-size: 1.3em;
  font-family: 'Georgia', serif;
}
.preview-content img { max-width: 100%; break-inside: avoid; }
.preview-content pre { break-inside: avoid; }`,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Monospace, green-on-black retro terminal look',
    css: `.preview-content {
  font-family: 'Courier New', 'Menlo', monospace;
  color: #33ff33;
  line-height: 1.5;
  font-size: 0.9em;
}
.preview-content h1, .preview-content h2, .preview-content h3 {
  color: #33ff33;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
}
.preview-content h1::before { content: '# '; }
.preview-content h2::before { content: '## '; }
.preview-content h3::before { content: '### '; }
.preview-content a { color: #33ccff; }
.preview-content code {
  background: rgba(51, 255, 51, 0.1);
  color: #66ff66;
  border: 1px solid rgba(51, 255, 51, 0.2);
}
.preview-content pre {
  background: rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(51, 255, 51, 0.3);
}
.preview-content pre code { color: #33ff33; border: none; background: none; }
.preview-content blockquote {
  border-left: 3px solid #33ff33;
  color: #22cc22;
  padding-left: 1em;
}
.preview-content hr { border-color: #33ff33; opacity: 0.4; }`,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Stripped-down, ultra-clean typography',
    css: `.preview-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.7;
  color: #333;
}
.dark .preview-content { color: #ddd; }
.preview-content h1, .preview-content h2, .preview-content h3 {
  font-weight: 600;
  letter-spacing: -0.02em;
}
.preview-content h1 { font-size: 1.5em; margin-top: 2em; }
.preview-content h2 { font-size: 1.2em; margin-top: 1.8em; }
.preview-content h3 { font-size: 1em; margin-top: 1.5em; }
.preview-content blockquote {
  border-left: 2px solid #ddd;
  padding-left: 1em;
  margin-left: 0;
  color: #888;
}
.dark .preview-content blockquote { border-left-color: #555; color: #999; }
.preview-content code {
  font-size: 0.85em;
  padding: 0.15em 0.3em;
  border-radius: 3px;
}
.preview-content img { border-radius: 4px; }
.preview-content hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
.dark .preview-content hr { border-top-color: #333; }`,
  },
]

const STYLE_ELEMENT_ID = 'markitor-preview-custom-css'

export function injectPreviewCSS(css: string): void {
  let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null
  if (!css.trim()) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ELEMENT_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}

export function getPresetById(id: string): PreviewPreset | undefined {
  return PREVIEW_PRESETS.find((p) => p.id === id)
}
