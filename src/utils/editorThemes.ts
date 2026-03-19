import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { oneDark } from '@codemirror/theme-one-dark'
import type { ResolvedTheme } from '../store/themeStore'

// ── GitHub Light ──

const githubLightChrome = EditorView.theme({
  '&': { backgroundColor: '#ffffff', color: '#24292e' },
  '.cm-gutters': { backgroundColor: '#fafbfc', color: '#959da5', borderRight: '1px solid #e1e4e8' },
  '.cm-activeLineGutter': { backgroundColor: '#f1f8ff' },
  '.cm-activeLine': { backgroundColor: '#f6f8fa' },
  '.cm-cursor': { borderLeftColor: '#24292e' },
  '.cm-selectionBackground': { backgroundColor: '#0366d625' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: '#0366d640' },
})

const githubLightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#d73a49' },
  { tag: tags.name, color: '#24292e' },
  { tag: tags.function(tags.variableName), color: '#6f42c1' },
  { tag: tags.definition(tags.variableName), color: '#005cc5' },
  { tag: tags.string, color: '#032f62' },
  { tag: tags.comment, color: '#6a737d', fontStyle: 'italic' },
  { tag: tags.number, color: '#005cc5' },
  { tag: tags.bool, color: '#005cc5' },
  { tag: tags.operator, color: '#d73a49' },
  { tag: tags.typeName, color: '#e36209' },
  { tag: tags.meta, color: '#005cc5' },
  { tag: tags.link, color: '#0366d6' },
  { tag: tags.heading, color: '#005cc5', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
])

// ── One Dark syntax highlight (standalone, for use with focus mode) ──

const oneDarkHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#c678dd' },
  { tag: tags.name, color: '#e06c75' },
  { tag: tags.function(tags.variableName), color: '#61afef' },
  { tag: tags.definition(tags.variableName), color: '#e06c75' },
  { tag: tags.string, color: '#98c379' },
  { tag: tags.comment, color: '#7f848e', fontStyle: 'italic' },
  { tag: tags.number, color: '#d19a66' },
  { tag: tags.bool, color: '#d19a66' },
  { tag: tags.operator, color: '#56b6c2' },
  { tag: tags.typeName, color: '#e5c07b' },
  { tag: tags.meta, color: '#61afef' },
  { tag: tags.link, color: '#61afef' },
  { tag: tags.heading, color: '#e06c75', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#c8ccd4' },
  { tag: tags.strong, fontWeight: 'bold', color: '#c8ccd4' },
])

/** Standalone One Dark syntax highlighting extension (no chrome/structural styles). */
export const oneDarkSyntax: Extension = syntaxHighlighting(oneDarkHighlight)

const lightTheme: Extension = [githubLightChrome, syntaxHighlighting(githubLightHighlight)]
const darkTheme: Extension = oneDark

/** Returns the CodeMirror theme extension matching the resolved light/dark mode. */
export function getThemeExtension(resolved: ResolvedTheme): Extension {
  return resolved === 'dark' ? darkTheme : lightTheme
}
