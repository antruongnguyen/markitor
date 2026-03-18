import type { EditorView } from '@codemirror/view'

export type TableAlignment = 'left' | 'center' | 'right'

export type ParsedTable = {
  /** Starting position in the document */
  from: number
  /** Ending position in the document */
  to: number
  /** Header cells */
  headers: string[]
  /** Alignment per column */
  alignments: TableAlignment[]
  /** Data rows (each row is an array of cell strings) */
  rows: string[][]
  /** The line number (1-based) of the header row */
  headerLine: number
  /** Which row the cursor is on: -1 = header, -2 = separator, 0..n = data row index */
  cursorRow: number
  /** Which column (0-based) the cursor is in */
  cursorCol: number
}

/** Parse a single row's cells from a markdown table line */
function parseCells(line: string): string[] {
  const trimmed = line.trim()
  const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed
  const end = inner.endsWith('|') ? inner.slice(0, -1) : inner
  return end.split('|').map((c) => c.trim())
}

/** Check if a line is a separator row (e.g., |---|:---:|---:|) */
function isSeparatorLine(line: string): boolean {
  const cells = parseCells(line)
  return cells.length > 0 && cells.every((c) => /^:?-{1,}:?$/.test(c.trim()))
}

/** Parse alignment from a separator cell */
function parseAlignment(cell: string): TableAlignment {
  const t = cell.trim()
  const left = t.startsWith(':')
  const right = t.endsWith(':')
  if (left && right) return 'center'
  if (right) return 'right'
  return 'left'
}

/** Check if a line looks like a table row (has pipes) */
function isTableLine(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.includes('|') && !trimmed.startsWith('```')
}

/**
 * Find and parse the markdown table surrounding the cursor position.
 * Returns null if the cursor is not inside a table.
 */
export function parseTableAtCursor(view: EditorView): ParsedTable | null {
  const { state } = view
  const pos = state.selection.main.head
  const cursorLine = state.doc.lineAt(pos)

  if (!isTableLine(cursorLine.text)) return null

  // Scan upward to find the start of the table
  let startLineNum = cursorLine.number
  while (startLineNum > 1) {
    const prev = state.doc.line(startLineNum - 1)
    if (!isTableLine(prev.text)) break
    startLineNum--
  }

  // Scan downward to find the end of the table
  let endLineNum = cursorLine.number
  const totalLines = state.doc.lines
  while (endLineNum < totalLines) {
    const next = state.doc.line(endLineNum + 1)
    if (!isTableLine(next.text)) break
    endLineNum++
  }

  // Collect all table lines
  const lines: { text: string; lineNum: number }[] = []
  for (let i = startLineNum; i <= endLineNum; i++) {
    lines.push({ text: state.doc.line(i).text, lineNum: i })
  }

  // Need at least 2 lines (header + separator)
  if (lines.length < 2) return null

  // Find the separator line
  let sepIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (isSeparatorLine(lines[i].text)) {
      sepIdx = i
      break
    }
  }

  if (sepIdx < 1) return null // Separator must come after header

  const headerLine = lines[sepIdx - 1]
  const sepLine = lines[sepIdx]
  const headers = parseCells(headerLine.text)
  const alignments = parseCells(sepLine.text).map(parseAlignment)

  // Pad alignments to match header count
  while (alignments.length < headers.length) alignments.push('left')

  const dataLines = lines.slice(sepIdx + 1)
  const rows = dataLines.map((l) => {
    const cells = parseCells(l.text)
    // Pad or trim to match header count
    while (cells.length < headers.length) cells.push('')
    return cells.slice(0, headers.length)
  })

  // Determine cursor row/col
  let cursorRow = -2 // default: separator
  let cursorCol = 0

  if (cursorLine.number === headerLine.lineNum) {
    cursorRow = -1
  } else if (cursorLine.number === lines[sepIdx].lineNum) {
    cursorRow = -2
  } else {
    const dataIdx = dataLines.findIndex((l) => l.lineNum === cursorLine.number)
    cursorRow = dataIdx >= 0 ? dataIdx : 0
  }

  // Find cursor column by position within the line
  const lineText = cursorLine.text
  const posInLine = pos - cursorLine.from
  let col = 0
  let pipeCount = 0
  for (let i = 0; i < posInLine && i < lineText.length; i++) {
    if (lineText[i] === '|') {
      pipeCount++
      if (pipeCount > 0 && lineText.trimStart().startsWith('|')) {
        col = pipeCount - 1
      } else {
        col = pipeCount
      }
    }
  }
  cursorCol = Math.min(col, headers.length - 1)

  const from = state.doc.line(startLineNum).from
  const to = state.doc.line(endLineNum).to

  return {
    from,
    to,
    headers,
    alignments,
    rows,
    headerLine: headerLine.lineNum,
    cursorRow,
    cursorCol,
  }
}

/** Generate the separator cell for a given alignment */
function separatorCell(alignment: TableAlignment, width: number): string {
  const dashes = '-'.repeat(Math.max(width, 3))
  switch (alignment) {
    case 'center':
      return `:${dashes}:`
    case 'right':
      return `${dashes}:`
    default:
      return dashes
  }
}

/** Generate a formatted markdown table string */
export function generateTable(
  headers: string[],
  alignments: TableAlignment[],
  rows: string[][],
): string {
  const colCount = headers.length

  // Calculate column widths
  const widths = headers.map((h, i) => {
    const dataMax = rows.reduce((max, row) => Math.max(max, (row[i] || '').length), 0)
    return Math.max(h.length, dataMax, 3)
  })

  const padCell = (text: string, width: number, align: TableAlignment) => {
    const t = text || ''
    const pad = width - t.length
    if (pad <= 0) return t
    switch (align) {
      case 'center': {
        const left = Math.floor(pad / 2)
        return ' '.repeat(left) + t + ' '.repeat(pad - left)
      }
      case 'right':
        return ' '.repeat(pad) + t
      default:
        return t + ' '.repeat(pad)
    }
  }

  const headerRow =
    '| ' +
    headers.map((h, i) => padCell(h, widths[i], alignments[i] || 'left')).join(' | ') +
    ' |'

  const sepRow =
    '| ' +
    Array.from({ length: colCount }, (_, i) =>
      separatorCell(alignments[i] || 'left', widths[i]),
    ).join(' | ') +
    ' |'

  const dataRows = rows.map(
    (row) =>
      '| ' +
      Array.from({ length: colCount }, (_, i) =>
        padCell(row[i] || '', widths[i], alignments[i] || 'left'),
      ).join(' | ') +
      ' |',
  )

  return [headerRow, sepRow, ...dataRows].join('\n')
}

/** Create an empty table with the given dimensions */
export function createEmptyTable(rowCount: number, colCount: number): string {
  const headers = Array.from({ length: colCount }, (_, i) => `Header ${i + 1}`)
  const alignments: TableAlignment[] = Array.from({ length: colCount }, () => 'left')
  const rows = Array.from({ length: rowCount }, () =>
    Array.from({ length: colCount }, () => ''),
  )
  return generateTable(headers, alignments, rows)
}

/** Add a row to the table at the given index */
export function addRow(table: ParsedTable, index: number): { headers: string[]; alignments: TableAlignment[]; rows: string[][] } {
  const newRow = Array.from({ length: table.headers.length }, () => '')
  const newRows = [...table.rows]
  newRows.splice(Math.max(0, Math.min(index, newRows.length)), 0, newRow)
  return { headers: table.headers, alignments: table.alignments, rows: newRows }
}

/** Delete a row at the given index */
export function deleteRow(table: ParsedTable, index: number): { headers: string[]; alignments: TableAlignment[]; rows: string[][] } | null {
  if (table.rows.length <= 1) return null // Keep at least one data row
  const newRows = table.rows.filter((_, i) => i !== index)
  return { headers: table.headers, alignments: table.alignments, rows: newRows }
}

/** Add a column at the given index */
export function addColumn(table: ParsedTable, index: number): { headers: string[]; alignments: TableAlignment[]; rows: string[][] } {
  const idx = Math.max(0, Math.min(index, table.headers.length))
  const newHeaders = [...table.headers]
  newHeaders.splice(idx, 0, `Col ${idx + 1}`)
  const newAlignments = [...table.alignments]
  newAlignments.splice(idx, 0, 'left')
  const newRows = table.rows.map((row) => {
    const r = [...row]
    r.splice(idx, 0, '')
    return r
  })
  return { headers: newHeaders, alignments: newAlignments, rows: newRows }
}

/** Delete a column at the given index */
export function deleteColumn(table: ParsedTable, index: number): { headers: string[]; alignments: TableAlignment[]; rows: string[][] } | null {
  if (table.headers.length <= 1) return null // Keep at least one column
  const newHeaders = table.headers.filter((_, i) => i !== index)
  const newAlignments = table.alignments.filter((_, i) => i !== index)
  const newRows = table.rows.map((row) => row.filter((_, i) => i !== index))
  return { headers: newHeaders, alignments: newAlignments, rows: newRows }
}

/** Set alignment for a column */
export function setColumnAlignment(
  table: ParsedTable,
  colIndex: number,
  alignment: TableAlignment,
): { headers: string[]; alignments: TableAlignment[]; rows: string[][] } {
  const newAlignments = [...table.alignments]
  newAlignments[colIndex] = alignment
  return { headers: table.headers, alignments: newAlignments, rows: table.rows }
}

/**
 * Find the next/previous cell position for tab navigation.
 * Returns the document position to place the cursor, or null if at table boundary.
 */
export function getNextCellPosition(
  view: EditorView,
  table: ParsedTable,
  direction: 'forward' | 'backward',
): number | null {
  const { state } = view
  let row = table.cursorRow
  let col = table.cursorCol

  if (direction === 'forward') {
    col++
    if (col >= table.headers.length) {
      col = 0
      if (row === -1) {
        // Move from header to first data row
        row = 0
      } else if (row === -2) {
        row = 0
      } else {
        row++
      }
      if (row >= table.rows.length) return null // Past last row
    }
  } else {
    col--
    if (col < 0) {
      col = table.headers.length - 1
      if (row === 0 || row === -2) {
        row = -1
      } else if (row === -1) {
        return null // Before header
      } else {
        row--
      }
    }
  }

  // Calculate the target line number
  let targetLineNum: number
  if (row === -1) {
    targetLineNum = table.headerLine
  } else {
    // Data rows start at headerLine + 2 (header + separator)
    targetLineNum = table.headerLine + 2 + row
  }

  // Find the position of the target cell in the line
  const line = state.doc.line(targetLineNum)
  const lineText = line.text
  let pipeCount = 0
  let cellStart = 0
  let cellEnd = lineText.length

  for (let i = 0; i < lineText.length; i++) {
    if (lineText[i] === '|') {
      if (pipeCount === col + 1) {
        cellEnd = i
        break
      }
      pipeCount++
      if (pipeCount === col + 1) {
        cellStart = i + 1
      }
    }
  }

  // Position cursor at the content within the cell (skip leading space)
  const cellContent = lineText.slice(cellStart, cellEnd)
  const leadingSpaces = cellContent.length - cellContent.trimStart().length
  const contentLen = cellContent.trim().length

  const selectFrom = line.from + cellStart + leadingSpaces
  const selectTo = selectFrom + contentLen

  // Return the start of cell content for selection
  return selectFrom === selectTo ? selectFrom : selectFrom
}

/** Select the content of a cell at the given position */
export function selectCellContent(
  view: EditorView,
  table: ParsedTable,
  row: number,
  col: number,
): { from: number; to: number } | null {
  const { state } = view

  let targetLineNum: number
  if (row === -1) {
    targetLineNum = table.headerLine
  } else {
    targetLineNum = table.headerLine + 2 + row
  }

  if (targetLineNum < 1 || targetLineNum > state.doc.lines) return null

  const line = state.doc.line(targetLineNum)
  const lineText = line.text
  let pipeCount = 0
  let cellStart = 0
  let cellEnd = lineText.length

  for (let i = 0; i < lineText.length; i++) {
    if (lineText[i] === '|') {
      if (pipeCount === col + 1) {
        cellEnd = i
        break
      }
      pipeCount++
      if (pipeCount === col + 1) {
        cellStart = i + 1
      }
    }
  }

  const cellContent = lineText.slice(cellStart, cellEnd)
  const leadingSpaces = cellContent.length - cellContent.trimStart().length
  const contentLen = cellContent.trim().length

  return {
    from: line.from + cellStart + leadingSpaces,
    to: line.from + cellStart + leadingSpaces + contentLen,
  }
}
