/** Common English stop words excluded from top-words analysis. */
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
  'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
  'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
  'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
  'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been',
  'has', 'had', 'did', 'does', 'am', 'being', 'having', 'doing',
])

/** Count syllables in a word using a vowel-group heuristic. */
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length <= 2) return 1

  // Count vowel groups
  const vowelGroups = w.match(/[aeiouy]+/g)
  let count = vowelGroups ? vowelGroups.length : 1

  // Silent e at the end
  if (w.endsWith('e') && !w.endsWith('le') && count > 1) {
    count--
  }

  // Common suffixes that add syllables
  if (w.endsWith('tion') || w.endsWith('sion')) {
    // Already counted correctly via vowel groups
  }

  return Math.max(1, count)
}

/** Strip markdown syntax to get plain text for analysis. */
function stripMarkdown(text: string): string {
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    // Remove images
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove links but keep text
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove headings markers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove strikethrough
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove blockquote markers
    .replace(/^>\s+/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove frontmatter
    .replace(/^---[\s\S]*?---/g, '')
    // Collapse whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export type TextStats = {
  words: number
  characters: number
  charactersNoSpaces: number
  sentences: number
  paragraphs: number
  lines: number
  readingTimeMinutes: number
  speakingTimeMinutes: number
  fleschReadingEase: number
  fleschKincaidGrade: number
  avgSentenceLength: number
  longestSentence: string
  uniqueWords: number
  vocabularyRichness: number
  topWords: { word: string; count: number }[]
  syllables: number
}

const EMPTY_STATS: TextStats = {
  words: 0,
  characters: 0,
  charactersNoSpaces: 0,
  sentences: 0,
  paragraphs: 0,
  lines: 0,
  readingTimeMinutes: 0,
  speakingTimeMinutes: 0,
  fleschReadingEase: 0,
  fleschKincaidGrade: 0,
  avgSentenceLength: 0,
  longestSentence: '',
  uniqueWords: 0,
  vocabularyRichness: 0,
  topWords: [],
  syllables: 0,
}

/** Compute full writing statistics from raw markdown text. */
export function computeStats(rawMarkdown: string): TextStats {
  if (!rawMarkdown.trim()) return EMPTY_STATS

  const plain = stripMarkdown(rawMarkdown)
  if (!plain) return EMPTY_STATS

  // Basic counts
  const characters = plain.length
  const charactersNoSpaces = plain.replace(/\s/g, '').length
  const lines = rawMarkdown.split('\n').length

  // Words
  const wordList = plain.match(/\b[a-zA-Z'-]+\b/g) ?? []
  const words = wordList.length
  if (words === 0) return { ...EMPTY_STATS, characters, charactersNoSpaces, lines }

  // Paragraphs — non-empty blocks separated by blank lines
  const paragraphs = plain.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1

  // Sentences — split on . ! ? followed by space or end
  const sentenceList = plain
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  const sentences = Math.max(sentenceList.length, 1)

  // Sentence analysis
  const sentenceWordCounts = sentenceList.map(
    (s) => (s.match(/\b[a-zA-Z'-]+\b/g) ?? []).length,
  )
  const avgSentenceLength = words / sentences
  const longestIdx = sentenceWordCounts.indexOf(Math.max(...sentenceWordCounts))
  const longestSentence = sentenceList[longestIdx] ?? ''

  // Syllables
  const syllables = wordList.reduce((sum, w) => sum + countSyllables(w), 0)

  // Reading & speaking time
  const readingTimeMinutes = words / 225
  const speakingTimeMinutes = words / 130

  // Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
  const fleschReadingEase = Math.max(
    0,
    Math.min(100, 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)),
  )

  // Flesch-Kincaid Grade Level: 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59
  const fleschKincaidGrade = Math.max(
    0,
    0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59,
  )

  // Vocabulary
  const lowerWords = wordList.map((w) => w.toLowerCase())
  const uniqueWords = new Set(lowerWords).size
  const vocabularyRichness = uniqueWords / words

  // Top words (excluding stop words)
  const freq = new Map<string, number>()
  for (const w of lowerWords) {
    if (w.length < 2 || STOP_WORDS.has(w)) continue
    freq.set(w, (freq.get(w) ?? 0) + 1)
  }
  const topWords = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    lines,
    readingTimeMinutes,
    speakingTimeMinutes,
    fleschReadingEase,
    fleschKincaidGrade,
    avgSentenceLength,
    longestSentence,
    uniqueWords,
    vocabularyRichness,
    topWords,
    syllables,
  }
}

/** Human-readable interpretation of Flesch-Kincaid Grade Level. */
export function gradeLabel(grade: number): string {
  if (grade <= 1) return 'Very easy'
  if (grade <= 5) return 'Easy'
  if (grade <= 8) return 'Fairly easy'
  if (grade <= 10) return 'Standard'
  if (grade <= 12) return 'Fairly difficult'
  if (grade <= 16) return 'Difficult'
  return 'Very difficult'
}

/** Human-readable interpretation of Flesch Reading Ease score. */
export function readingEaseLabel(score: number): string {
  if (score >= 90) return 'Very easy'
  if (score >= 80) return 'Easy'
  if (score >= 70) return 'Fairly easy'
  if (score >= 60) return 'Standard'
  if (score >= 50) return 'Fairly difficult'
  if (score >= 30) return 'Difficult'
  return 'Very difficult'
}

/** Format minutes into a human-readable string. */
export function formatTime(minutes: number): string {
  if (minutes < 1) return '< 1 min'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`
}
