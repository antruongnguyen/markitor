import katex from 'katex'

/**
 * Render a LaTeX math expression to HTML using KaTeX.
 *
 * KaTeX output inherits `color` from its container, so theme switching
 * (light/dark) works automatically — no re-render needed.
 */
export function renderMath(
  source: string,
  displayMode: boolean,
): { html: string } | { error: string } {
  try {
    const html = katex.renderToString(source, {
      displayMode,
      throwOnError: true,
      // Trust HTML — we control the input
      trust: false,
      // Strict mode: warn but don't throw for unsupported commands
      strict: 'warn',
    })
    return { html }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { error: message }
  }
}
