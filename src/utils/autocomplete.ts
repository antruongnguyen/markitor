import {
  type CompletionContext,
  type CompletionResult,
  type Completion,
  autocompletion,
  snippetCompletion,
  completionKeymap,
} from '@codemirror/autocomplete'
import type { Extension } from '@codemirror/state'
import { keymap } from '@codemirror/view'

// ── Language identifiers for fenced code blocks ──

const languages: Completion[] = [
  'javascript',
  'typescript',
  'python',
  'bash',
  'sh',
  'json',
  'html',
  'css',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
  'csharp',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'sql',
  'yaml',
  'toml',
  'xml',
  'markdown',
  'diff',
  'dockerfile',
  'graphql',
  'shell',
  'plaintext',
  'mermaid',
  'math',
].map((lang) => ({ label: lang, type: 'keyword' }))

// ── Emoji shortcodes ──

const emojis: Completion[] = [
  { label: ':smile:', detail: '😄' },
  { label: ':laughing:', detail: '😆' },
  { label: ':wink:', detail: '😉' },
  { label: ':heart:', detail: '❤️' },
  { label: ':thumbsup:', detail: '👍' },
  { label: ':thumbsdown:', detail: '👎' },
  { label: ':clap:', detail: '👏' },
  { label: ':fire:', detail: '🔥' },
  { label: ':rocket:', detail: '🚀' },
  { label: ':star:', detail: '⭐' },
  { label: ':check:', detail: '✅' },
  { label: ':x:', detail: '❌' },
  { label: ':warning:', detail: '⚠️' },
  { label: ':info:', detail: 'ℹ️' },
  { label: ':bulb:', detail: '💡' },
  { label: ':memo:', detail: '📝' },
  { label: ':bug:', detail: '🐛' },
  { label: ':tada:', detail: '🎉' },
  { label: ':thinking:', detail: '🤔' },
  { label: ':eyes:', detail: '👀' },
  { label: ':wave:', detail: '👋' },
  { label: ':100:', detail: '💯' },
  { label: ':sparkles:', detail: '✨' },
  { label: ':zap:', detail: '⚡' },
  { label: ':gear:', detail: '⚙️' },
  { label: ':lock:', detail: '🔒' },
  { label: ':key:', detail: '🔑' },
  { label: ':link:', detail: '🔗' },
  { label: ':hammer:', detail: '🔨' },
  { label: ':book:', detail: '📖' },
  { label: ':calendar:', detail: '📅' },
  { label: ':chart:', detail: '📊' },
  { label: ':pin:', detail: '📌' },
  { label: ':construction:', detail: '🚧' },
  { label: ':arrow_up:', detail: '⬆️' },
  { label: ':arrow_down:', detail: '⬇️' },
  { label: ':arrow_left:', detail: '⬅️' },
  { label: ':arrow_right:', detail: '➡️' },
].map((e) => ({ ...e, type: 'text', apply: e.detail }))

// ── Snippet completions ──

const snippets: Completion[] = [
  snippetCompletion(
    '| ${Header 1} | ${Header 2} | ${Header 3} |\n| --- | --- | --- |\n| ${Cell} | ${Cell} | ${Cell} |\n| ${Cell} | ${Cell} | ${Cell} |\n| ${Cell} | ${Cell} | ${Cell} |',
    { label: 'table3x3', detail: '3×3 table template', type: 'text' },
  ),
  snippetCompletion(
    '---\ntitle: ${Title}\ndate: ${date}\nauthor: ${Author}\ntags: [${tags}]\n---\n',
    { label: 'meta', detail: 'YAML frontmatter', type: 'text' },
  ),
  snippetCompletion('- [ ] ${task}', {
    label: 'task',
    detail: 'Checkbox item',
    type: 'text',
  }),
  snippetCompletion('![${alt text}](${url})', {
    label: 'img',
    detail: 'Image template',
    type: 'text',
  }),
  snippetCompletion('[${text}](${url})', {
    label: 'link',
    detail: 'Link template',
    type: 'text',
  }),
  snippetCompletion(
    '```${language}\n${code}\n```',
    { label: 'code', detail: 'Fenced code block', type: 'text' },
  ),
  snippetCompletion(
    '<details>\n<summary>${Summary}</summary>\n\n${Content}\n\n</details>',
    { label: 'details', detail: 'Collapsible section', type: 'text' },
  ),
  snippetCompletion(
    '> [!${NOTE}]\n> ${content}',
    { label: 'alert', detail: 'GitHub alert/admonition', type: 'text' },
  ),
]

// ── Heading anchor completions (from current document) ──

function headingAnchors(ctx: CompletionContext): CompletionResult | null {
  // Trigger on [[ for internal heading links
  const before = ctx.matchBefore(/\[\[[^\]]*/)
  if (!before) return null

  const doc = ctx.state.doc.toString()
  const headingPattern = /^#{1,6}\s+(.+)$/gm
  const options: Completion[] = []

  let match
  while ((match = headingPattern.exec(doc)) !== null) {
    const text = match[1].trim()
    // GitHub-style anchor: lowercase, spaces to hyphens, remove non-alphanum except hyphens
    const anchor = text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    options.push({
      label: `[[${text}`,
      detail: `#${anchor}`,
      apply: `[${text}](#${anchor})`,
      type: 'keyword',
    })
  }

  if (options.length === 0) return null

  return { from: before.from, options, validFor: /\[\[[^\]]*/ }
}

// ── Fenced code block language completions ──

function codeBlockLanguage(ctx: CompletionContext): CompletionResult | null {
  // Match ``` at start of line optionally followed by a partial language name
  const before = ctx.matchBefore(/^`{3}(\w*)$/m)
  if (!before) return null

  // Only trigger if the backticks are at the start of the line
  const line = ctx.state.doc.lineAt(before.from)
  const lineText = line.text
  if (!lineText.startsWith('```')) return null

  return {
    from: before.from + 3, // after the backticks
    options: languages,
    validFor: /^\w*$/,
  }
}

// ── Emoji shortcode completions ──

function emojiCompletions(ctx: CompletionContext): CompletionResult | null {
  const before = ctx.matchBefore(/:[a-z_]{2,}/)
  if (!before) return null

  return {
    from: before.from,
    options: emojis,
    validFor: /^:[a-z_]*$/,
  }
}

// ── Snippet completions (triggered at line start) ──

function snippetCompletions(ctx: CompletionContext): CompletionResult | null {
  const before = ctx.matchBefore(/^\w+$/m)
  if (!before) return null

  // Only trigger at line start (no leading content before the word)
  const line = ctx.state.doc.lineAt(before.from)
  const prefix = line.text.slice(0, before.from - line.from)
  if (prefix.trim().length > 0) return null

  // Only activate if at least 2 characters typed for non-intrusive behavior
  if (before.text.length < 2) return null

  return {
    from: before.from,
    options: snippets,
    validFor: /^\w*$/,
  }
}

// ── YAML frontmatter suggestion ──

function frontmatterCompletion(ctx: CompletionContext): CompletionResult | null {
  // Only at the very start of the document
  if (ctx.pos > 5) return null
  const before = ctx.matchBefore(/^-{2,3}$/)
  if (!before || before.from !== 0) return null

  return {
    from: before.from,
    options: [
      snippetCompletion(
        '---\ntitle: ${Title}\ndate: ${date}\nauthor: ${Author}\ntags: [${tags}]\n---\n\n',
        { label: '---', detail: 'YAML frontmatter', type: 'text' },
      ),
    ],
  }
}

// ── Table formatting helper ──

function tableHelper(ctx: CompletionContext): CompletionResult | null {
  // Trigger when typing | at start of an otherwise empty line
  const before = ctx.matchBefore(/^\|$/)
  if (!before) return null

  const line = ctx.state.doc.lineAt(before.from)
  if (line.text.trim() !== '|') return null

  return {
    from: before.from,
    options: [
      snippetCompletion(
        '| ${Header 1} | ${Header 2} |\n| --- | --- |\n| ${Cell} | ${Cell} |',
        { label: '|', detail: '2-column table', type: 'text' },
      ),
      snippetCompletion(
        '| ${Header 1} | ${Header 2} | ${Header 3} |\n| --- | --- | --- |\n| ${Cell} | ${Cell} | ${Cell} |',
        { label: '| (3 cols)', detail: '3-column table', type: 'text' },
      ),
    ],
  }
}

// ── Export combined autocomplete extension ──

export function markdownAutocomplete(): Extension {
  return [
    autocompletion({
      override: [
        headingAnchors,
        codeBlockLanguage,
        emojiCompletions,
        snippetCompletions,
        frontmatterCompletion,
        tableHelper,
      ],
      defaultKeymap: false,
      activateOnTyping: true,
      maxRenderedOptions: 20,
    }),
    keymap.of(completionKeymap),
  ]
}
