import type { Diagnostic } from '@codemirror/lint'
import type { Text } from '@codemirror/state'

const MAX_LINES = 10_000

type LintRule = (doc: Text) => Diagnostic[]

/** Warn if heading levels are skipped (e.g. H1 → H3 without H2) */
const headingConsistency: LintRule = (doc) => {
  const diagnostics: Diagnostic[] = []
  let lastLevel = 0
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    const m = line.text.match(/^(#{1,6})\s/)
    if (m) {
      const level = m[1].length
      if (lastLevel > 0 && level > lastLevel + 1) {
        diagnostics.push({
          from: line.from,
          to: line.from + m[0].length,
          severity: 'warning',
          message: `Heading level skipped: H${lastLevel} → H${level} (expected H${lastLevel + 1})`,
        })
      }
      lastLevel = level
    }
  }
  return diagnostics
}

/** Warn if the same heading text appears multiple times */
const duplicateHeadings: LintRule = (doc) => {
  const diagnostics: Diagnostic[] = []
  const seen = new Map<string, number>()
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    const m = line.text.match(/^#{1,6}\s+(.+)$/)
    if (m) {
      const text = m[1].trim().toLowerCase()
      const prev = seen.get(text)
      if (prev !== undefined) {
        diagnostics.push({
          from: line.from,
          to: line.to,
          severity: 'warning',
          message: `Duplicate heading "${m[1].trim()}" (first on line ${prev})`,
        })
      } else {
        seen.set(text, i)
      }
    }
  }
  return diagnostics
}

/** Warn for images without alt text: ![](url) */
const missingImageAlt: LintRule = (doc) => {
  const diagnostics: Diagnostic[] = []
  const re = /!\[\]\([^)]*\)/g
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    let m: RegExpExecArray | null
    re.lastIndex = 0
    while ((m = re.exec(line.text)) !== null) {
      diagnostics.push({
        from: line.from + m.index,
        to: line.from + m.index + m[0].length,
        severity: 'warning',
        message: 'Image missing alt text',
      })
    }
  }
  return diagnostics
}

/** Warn for trailing whitespace (except two-space line breaks) */
const trailingWhitespace: LintRule = (doc) => {
  const diagnostics: Diagnostic[] = []
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    const m = line.text.match(/( +)$/)
    if (m && m[1].length !== 2) {
      const start = line.from + line.text.length - m[1].length
      diagnostics.push({
        from: start,
        to: line.to,
        severity: 'warning',
        message: 'Trailing whitespace',
      })
    }
  }
  return diagnostics
}

/** Warn for 3+ consecutive blank lines */
const multipleBlankLines: LintRule = (doc) => {
  const diagnostics: Diagnostic[] = []
  let blankCount = 0
  let blankStart = 0
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    if (line.text.trim() === '') {
      if (blankCount === 0) blankStart = line.from
      blankCount++
    } else {
      if (blankCount >= 3) {
        diagnostics.push({
          from: blankStart,
          to: doc.line(i - 1).to,
          severity: 'warning',
          message: `${blankCount} consecutive blank lines (expected at most 2)`,
        })
      }
      blankCount = 0
    }
  }
  if (blankCount >= 3) {
    diagnostics.push({
      from: blankStart,
      to: doc.line(doc.lines).to,
      severity: 'warning',
      message: `${blankCount} consecutive blank lines (expected at most 2)`,
    })
  }
  return diagnostics
}

/** Warn for links with empty URL: [text]() */
const missingLinkUrl: LintRule = (doc) => {
  const diagnostics: Diagnostic[] = []
  const re = /\[([^\]]+)\]\(\s*\)/g
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    let m: RegExpExecArray | null
    re.lastIndex = 0
    while ((m = re.exec(line.text)) !== null) {
      diagnostics.push({
        from: line.from + m.index,
        to: line.from + m.index + m[0].length,
        severity: 'warning',
        message: 'Link has empty URL',
      })
    }
  }
  return diagnostics
}

/** Warn for lines exceeding 120 characters (skip code blocks) */
const lineLength: LintRule = (doc) => {
  const diagnostics: Diagnostic[] = []
  let inCodeBlock = false
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    if (line.text.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue
    if (line.text.length > 120) {
      diagnostics.push({
        from: line.from + 120,
        to: line.to,
        severity: 'warning',
        message: `Line exceeds 120 characters (${line.text.length})`,
      })
    }
  }
  return diagnostics
}

/** Warn if document has content but no headings */
const noHeading: LintRule = (doc) => {
  let hasContent = false
  let hasHeading = false
  for (let i = 1; i <= doc.lines; i++) {
    const text = doc.line(i).text
    if (text.trim()) hasContent = true
    if (/^#{1,6}\s/.test(text)) {
      hasHeading = true
      break
    }
  }
  if (hasContent && !hasHeading) {
    return [{
      from: 0,
      to: Math.min(doc.line(1).to, doc.length),
      severity: 'warning',
      message: 'Document has no headings',
    }]
  }
  return []
}

/** Warn if mixing * and - for unordered lists */
const inconsistentListMarkers: LintRule = (doc) => {
  const diagnostics: Diagnostic[] = []
  let firstMarker: string | null = null
  let firstMarkerLine = 0
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    const m = line.text.match(/^(\s*)([-*+])\s/)
    if (m) {
      const marker = m[2]
      if (firstMarker === null) {
        firstMarker = marker
        firstMarkerLine = i
      } else if (marker !== firstMarker) {
        diagnostics.push({
          from: line.from + m[1].length,
          to: line.from + m[1].length + 1,
          severity: 'warning',
          message: `Inconsistent list marker "${marker}" (first used "${firstMarker}" on line ${firstMarkerLine})`,
        })
      }
    }
  }
  return diagnostics
}

/** Warn for unmatched bold/italic/code markers */
const unclosedFormatting: LintRule = (doc) => {
  const diagnostics: Diagnostic[] = []
  let inCodeBlock = false
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    const text = line.text
    if (text.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    // Check inline code backticks
    const backtickCount = (text.match(/`/g) || []).length
    if (backtickCount % 2 !== 0) {
      diagnostics.push({
        from: line.from,
        to: line.to,
        severity: 'warning',
        message: 'Unmatched backtick (`) on this line',
      })
      continue
    }

    // Strip inline code to avoid false positives
    const stripped = text.replace(/`[^`]+`/g, '')

    // Check ** (bold)
    const boldCount = (stripped.match(/\*\*/g) || []).length
    if (boldCount % 2 !== 0) {
      diagnostics.push({
        from: line.from,
        to: line.to,
        severity: 'warning',
        message: 'Unmatched bold marker (**) on this line',
      })
      continue
    }

    // Check remaining single * (italic) after stripping bold
    const afterBold = stripped.replace(/\*\*/g, '')
    // Ignore * at start of line (list markers)
    const forItalicCheck = afterBold.replace(/^\s*\*\s/, '')
    const starCount = (forItalicCheck.match(/\*/g) || []).length
    if (starCount % 2 !== 0) {
      diagnostics.push({
        from: line.from,
        to: line.to,
        severity: 'warning',
        message: 'Unmatched italic marker (*) on this line',
      })
    }
  }
  return diagnostics
}

const ALL_RULES: LintRule[] = [
  headingConsistency,
  duplicateHeadings,
  missingImageAlt,
  trailingWhitespace,
  multipleBlankLines,
  missingLinkUrl,
  lineLength,
  noHeading,
  inconsistentListMarkers,
  unclosedFormatting,
]

/**
 * Run all markdown lint rules against a document.
 * Returns an empty array for large documents (>MAX_LINES) to avoid performance issues.
 */
export function lintMarkdown(doc: Text): Diagnostic[] {
  if (doc.lines > MAX_LINES) return []
  const diagnostics: Diagnostic[] = []
  for (const rule of ALL_RULES) {
    diagnostics.push(...rule(doc))
  }
  return diagnostics
}
