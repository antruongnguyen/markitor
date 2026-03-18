import mermaid from 'mermaid'
import type { ResolvedTheme } from '../store/themeStore'

let initialized = false
let currentTheme: ResolvedTheme = 'light'
let renderCounter = 0

function getMermaidTheme(theme: ResolvedTheme): string {
  return theme === 'dark' ? 'dark' : 'default'
}

export function initMermaid(theme: ResolvedTheme) {
  currentTheme = theme
  mermaid.initialize({
    startOnLoad: false,
    theme: getMermaidTheme(theme) as 'dark' | 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
  })
  initialized = true
}

export function updateMermaidTheme(theme: ResolvedTheme) {
  if (theme === currentTheme && initialized) return
  initMermaid(theme)
}

export async function renderMermaidDiagram(
  source: string,
): Promise<{ svg: string } | { error: string }> {
  if (!initialized) {
    initMermaid(currentTheme)
  }

  const id = `mermaid-${renderCounter++}`
  try {
    const { svg } = await mermaid.render(id, source)
    return { svg }
  } catch (err) {
    // mermaid.render creates a temp element with the id; clean it up on error
    const tempEl = document.getElementById('d' + id)
    tempEl?.remove()
    const message = err instanceof Error ? err.message : String(err)
    return { error: message }
  }
}
