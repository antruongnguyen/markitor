export type Heading = {
  level: number
  text: string
  line: number
}

/** Strip common inline markdown formatting from heading text. */
function cleanText(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // [text](url) → text
    .replace(/[*_~`]+/g, '')                  // bold, italic, strikethrough, code
    .trim()
}

/** Extract headings (h1-h6) from markdown using ATX-style regex. */
export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = []
  const lines = content.split('\n')
  let inCodeFence = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track fenced code blocks so we don't match headings inside them
    if (/^```/.test(line)) {
      inCodeFence = !inCodeFence
      continue
    }
    if (inCodeFence) continue

    const match = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/)
    if (match) {
      const text = cleanText(match[2])
      if (text) {
        headings.push({ level: match[1].length, text, line: i + 1 })
      }
    }
  }

  return headings
}
