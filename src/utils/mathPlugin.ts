import type MarkdownIt from 'markdown-it'
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'
import type Token from 'markdown-it/lib/token.mjs'
import { renderMath } from './katexRenderer'

/**
 * markdown-it plugin that parses `$...$` (inline) and `$$...$$` (block)
 * math expressions and renders them via KaTeX.
 */
export function mathPlugin(md: MarkdownIt): void {
  // ── Inline math: $...$ ──────────────────────────────────────────
  md.inline.ruler.after('escape', 'math_inline', mathInlineRule)
  md.renderer.rules['math_inline'] = mathInlineRenderer

  // ── Block math: $$...$$ ─────────────────────────────────────────
  md.block.ruler.before('fence', 'math_block', mathBlockRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
  md.renderer.rules['math_block'] = mathBlockRenderer
}

// ── Inline rule ────────────────────────────────────────────────────

function mathInlineRule(state: StateInline, silent: boolean): boolean {
  const src = state.src
  const start = state.pos

  // Must start with $, but not $$
  if (src.charCodeAt(start) !== 0x24 /* $ */) return false
  if (src.charCodeAt(start + 1) === 0x24 /* $ */) return false

  // Check preceding char — don't match if preceded by $ (avoids $$)
  if (start > 0 && src.charCodeAt(start - 1) === 0x24) return false

  // Find closing $ — scan forward
  let end = start + 1
  while (end < state.posMax) {
    const ch = src.charCodeAt(end)

    // Skip escaped characters
    if (ch === 0x5c /* \\ */ && end + 1 < state.posMax) {
      end += 2
      continue
    }

    if (ch === 0x24 /* $ */) {
      // Don't match empty $$ or if next char is also $
      if (end === start + 1) return false
      break
    }

    end++
  }

  // No closing $ found
  if (end >= state.posMax) return false

  const content = src.slice(start + 1, end)

  // Require non-whitespace after opening $ and before closing $
  if (!content.trim()) return false

  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.content = content
    token.markup = '$'
  }

  state.pos = end + 1
  return true
}

function mathInlineRenderer(tokens: Token[], idx: number): string {
  const result = renderMath(tokens[idx].content, false)
  if ('html' in result) {
    return result.html
  }
  return `<code class="math-error" title="${escapeHtml(result.error)}">${escapeHtml(tokens[idx].content)}</code>`
}

// ── Block rule ─────────────────────────────────────────────────────

function mathBlockRule(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const startPos = state.bMarks[startLine] + state.tShift[startLine]
  const maxPos = state.eMarks[startLine]

  // Must start with $$
  if (startPos + 1 >= maxPos) return false
  if (state.src.charCodeAt(startPos) !== 0x24) return false
  if (state.src.charCodeAt(startPos + 1) !== 0x24) return false

  // Check rest of opening line after $$
  const afterOpening = state.src.slice(startPos + 2, maxPos).trim()

  // If the closing $$ is on the same line: $$ content $$
  if (afterOpening.endsWith('$$') && afterOpening.length > 2) {
    if (silent) return true
    const content = afterOpening.slice(0, -2).trim()
    const token = state.push('math_block', 'math', 0)
    token.content = content
    token.markup = '$$'
    token.map = [startLine, startLine + 1]
    state.line = startLine + 1
    return true
  }

  // Multi-line: find closing $$
  let nextLine = startLine + 1
  let found = false

  while (nextLine < endLine) {
    const lineStart = state.bMarks[nextLine] + state.tShift[nextLine]
    const lineEnd = state.eMarks[nextLine]
    const lineText = state.src.slice(lineStart, lineEnd).trim()

    if (lineText === '$$') {
      found = true
      break
    }

    nextLine++
  }

  if (!found) return false
  if (silent) return true

  // Gather content between opening and closing $$
  const lines: string[] = []
  // If there's content on the opening line after $$
  if (afterOpening) {
    lines.push(afterOpening)
  }
  for (let i = startLine + 1; i < nextLine; i++) {
    const lineStart = state.bMarks[i] + state.tShift[i]
    const lineEnd = state.eMarks[i]
    lines.push(state.src.slice(lineStart, lineEnd))
  }

  const token = state.push('math_block', 'math', 0)
  token.content = lines.join('\n')
  token.markup = '$$'
  token.map = [startLine, nextLine + 1]
  state.line = nextLine + 1

  return true
}

function mathBlockRenderer(tokens: Token[], idx: number): string {
  const result = renderMath(tokens[idx].content, true)
  if ('html' in result) {
    return `<div class="math-block">${result.html}</div>\n`
  }
  return `<div class="math-block math-error"><pre>${escapeHtml(result.error)}</pre></div>\n`
}

// ── Helpers ────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
