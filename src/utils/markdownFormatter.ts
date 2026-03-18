/**
 * Lightweight markdown formatter that normalizes document style.
 *
 * Rules applied:
 * 1. Normalize heading spacing (blank line before/after headings)
 * 2. Align table columns (pad cells with spaces)
 * 3. Normalize list indentation (2 spaces per level)
 * 4. Collapse multiple blank lines to a single blank line
 * 5. Trim trailing whitespace on each line
 * 6. Ensure file ends with a single newline
 * 7. Normalize emphasis to use `*` (not `_`)
 * 8. Clean up code fence formatting (consistent triple backticks)
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Detect whether a line opens or closes a fenced code block. */
function isFenceLine(line: string): boolean {
  return /^(`{3,}|~{3,})/.test(line.trimStart())
}

/** Extract the indentation depth (number of leading spaces) of a line. */
function leadingSpaces(line: string): number {
  const m = line.match(/^( *)/)
  return m ? m[1].length : 0
}

/** Is this line a markdown heading? */
function isHeading(line: string): boolean {
  return /^#{1,6}\s/.test(line)
}

/** Is this line a list item (ordered or unordered)? */
function isListItem(line: string): boolean {
  return /^\s*[-*+]\s/.test(line) || /^\s*\d+[.)]\s/.test(line)
}

/** Is this line entirely blank (empty or whitespace only)? */
function isBlank(line: string): boolean {
  return line.trim().length === 0
}

// ---------------------------------------------------------------------------
// Emphasis normalisation
// ---------------------------------------------------------------------------

/**
 * Replace `_` emphasis markers with `*` outside of code spans and fenced
 * blocks.  Handles both `_text_` (italic) and `__text__` (bold).
 */
function normalizeEmphasis(line: string): string {
  // Split on code spans to avoid touching text inside backticks.
  const parts = line.split(/(`[^`]*`)/)
  return parts
    .map((part, i) => {
      // Odd indices are inside code spans – leave them alone.
      if (i % 2 === 1) return part
      // Bold first (__text__ -> **text**)
      let result = part.replace(/__([\s\S]+?)__/g, '**$1**')
      // Italic (_text_ -> *text*) but avoid touching already-bold markers or
      // intra-word underscores like foo_bar_baz.
      result = result.replace(/(?<!\w)_([^\s_](?:[^_]*[^\s_])?)_(?!\w)/g, '*$1*')
      return result
    })
    .join('')
}

// ---------------------------------------------------------------------------
// Code fence cleanup
// ---------------------------------------------------------------------------

/**
 * Normalise a code fence opening line:
 * - always use triple backticks (convert tildes to backticks)
 * - trim extraneous backticks beyond three
 */
function normalizeCodeFenceOpen(line: string): string {
  const indent = line.match(/^(\s*)/)?.[1] ?? ''
  const body = line.trimStart()
  const m = body.match(/^(`{3,}|~{3,})(.*)$/)
  if (!m) return line
  const lang = m[2].trim()
  return `${indent}\`\`\`${lang ? `${lang}` : ''}`
}

function normalizeCodeFenceClose(line: string): string {
  const indent = line.match(/^(\s*)/)?.[1] ?? ''
  return `${indent}\`\`\``
}

// ---------------------------------------------------------------------------
// Table alignment
// ---------------------------------------------------------------------------

/** Parse a markdown table (group of consecutive `|`-delimited lines). */
function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('|') && trimmed.endsWith('|')
}

function isSeparatorRow(line: string): boolean {
  return /^\s*\|[\s:|-]+\|\s*$/.test(line)
}

function parseCells(row: string): string[] {
  // Strip leading/trailing pipe, then split on inner pipes.
  const inner = row.trim().replace(/^\|/, '').replace(/\|$/, '')
  return inner.split('|').map((c) => c.trim())
}

function buildSeparator(widths: number[], alignments: string[]): string {
  const cells = widths.map((w, i) => {
    const align = alignments[i] || 'none'
    const dashes = '-'.repeat(Math.max(w, 3))
    if (align === 'center') return `:${dashes.slice(0, -2)}:`
    if (align === 'right') return `${dashes.slice(0, -1)}:`
    if (align === 'left') return `:${dashes.slice(0, -1)}-`
    return dashes
  })
  return `| ${cells.join(' | ')} |`
}

function parseAlignment(sepCell: string): string {
  const t = sepCell.trim().replace(/\s/g, '')
  const left = t.startsWith(':')
  const right = t.endsWith(':')
  if (left && right) return 'center'
  if (right) return 'right'
  if (left) return 'left'
  return 'none'
}

function formatTable(rows: string[]): string[] {
  // Determine separator row index (usually index 1).
  const sepIdx = rows.findIndex(isSeparatorRow)
  if (sepIdx === -1) return rows // Not a proper table, leave as-is.

  // Parse all cell contents.
  const parsed = rows.map(parseCells)

  // Parse alignment from separator row.
  const sepCells = parseCells(rows[sepIdx])
  const alignments = sepCells.map(parseAlignment)

  // Determine max column count and widths.
  const colCount = Math.max(...parsed.map((r) => r.length))
  const widths = Array.from({ length: colCount }, (_, ci) =>
    Math.max(3, ...parsed.map((r) => (r[ci] ?? '').length)),
  )

  // Rebuild rows.
  return rows.map((_, ri) => {
    if (ri === sepIdx) {
      return buildSeparator(widths, alignments)
    }
    const cells = parsed[ri]
    const paddedCells = widths.map((w, ci) => {
      const cell = cells[ci] ?? ''
      return cell.padEnd(w)
    })
    return `| ${paddedCells.join(' | ')} |`
  })
}

// ---------------------------------------------------------------------------
// List indentation normalisation
// ---------------------------------------------------------------------------

/**
 * Normalise nested list indentation to 2 spaces per level.
 *
 * We walk through consecutive list lines and compute the nesting depth based
 * on the original indentation, then re-indent at 2-space increments.
 */
function normalizeListBlock(lines: string[]): string[] {
  // Collect unique indentation levels.
  const indents = [...new Set(lines.map(leadingSpaces))].sort((a, b) => a - b)
  // Build a mapping from old indent -> new indent.
  const indentMap = new Map<number, number>()
  indents.forEach((indent, level) => {
    indentMap.set(indent, level * 2)
  })

  return lines.map((line) => {
    const oldIndent = leadingSpaces(line)
    const newIndent = indentMap.get(oldIndent) ?? oldIndent
    return ' '.repeat(newIndent) + line.trimStart()
  })
}

// ---------------------------------------------------------------------------
// Main formatter
// ---------------------------------------------------------------------------

export function formatMarkdown(source: string): string {
  const inputLines = source.split('\n')
  const outputLines: string[] = []

  let inFencedBlock = false
  let i = 0

  while (i < inputLines.length) {
    const rawLine = inputLines[i]

    // --- Fenced code blocks: pass-through with fence cleanup ---------------
    if (!inFencedBlock && isFenceLine(rawLine)) {
      // Ensure blank line before code block if previous line is non-blank.
      if (
        outputLines.length > 0 &&
        !isBlank(outputLines[outputLines.length - 1])
      ) {
        outputLines.push('')
      }
      outputLines.push(normalizeCodeFenceOpen(rawLine))
      inFencedBlock = true
      i++
      continue
    }

    if (inFencedBlock) {
      if (isFenceLine(rawLine)) {
        outputLines.push(normalizeCodeFenceClose(rawLine))
        inFencedBlock = false
        // Ensure blank line after code block.
        if (i + 1 < inputLines.length && !isBlank(inputLines[i + 1])) {
          outputLines.push('')
        }
      } else {
        // Preserve code content as-is (don't trim trailing whitespace in code).
        outputLines.push(rawLine)
      }
      i++
      continue
    }

    // --- Tables: collect consecutive table rows and format them -------------
    if (isTableRow(rawLine)) {
      const tableLines: string[] = []
      while (i < inputLines.length && isTableRow(inputLines[i])) {
        tableLines.push(inputLines[i])
        i++
      }
      // Ensure blank line before table.
      if (
        outputLines.length > 0 &&
        !isBlank(outputLines[outputLines.length - 1])
      ) {
        outputLines.push('')
      }
      outputLines.push(...formatTable(tableLines))
      // Ensure blank line after table.
      if (i < inputLines.length && !isBlank(inputLines[i])) {
        outputLines.push('')
      }
      continue
    }

    // --- Lists: collect consecutive list lines and normalise indentation ----
    if (isListItem(rawLine)) {
      const listLines: string[] = []
      while (
        i < inputLines.length &&
        (isListItem(inputLines[i]) || (!isBlank(inputLines[i]) && leadingSpaces(inputLines[i]) > 0))
      ) {
        listLines.push(inputLines[i])
        i++
      }
      outputLines.push(...normalizeListBlock(listLines))
      continue
    }

    // --- Headings: ensure blank line before and after ----------------------
    if (isHeading(rawLine)) {
      const trimmed = rawLine.trimEnd()
      // Blank line before heading (unless start of doc or already blank).
      if (
        outputLines.length > 0 &&
        !isBlank(outputLines[outputLines.length - 1])
      ) {
        outputLines.push('')
      }
      outputLines.push(normalizeEmphasis(trimmed))
      // Blank line after heading.
      if (i + 1 < inputLines.length && !isBlank(inputLines[i + 1])) {
        outputLines.push('')
      }
      i++
      continue
    }

    // --- Blank lines: collapse runs of blanks into a single blank ----------
    if (isBlank(rawLine)) {
      // Only add a blank line if the previous output line wasn't blank.
      if (
        outputLines.length > 0 &&
        !isBlank(outputLines[outputLines.length - 1])
      ) {
        outputLines.push('')
      }
      i++
      continue
    }

    // --- Normal line: trim trailing whitespace, normalise emphasis ----------
    outputLines.push(normalizeEmphasis(rawLine.trimEnd()))
    i++
  }

  // Ensure file ends with exactly one newline.
  // Remove trailing blank lines.
  while (outputLines.length > 0 && isBlank(outputLines[outputLines.length - 1])) {
    outputLines.pop()
  }

  return outputLines.join('\n') + '\n'
}
