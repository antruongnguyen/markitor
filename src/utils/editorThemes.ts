import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { oneDark } from '@codemirror/theme-one-dark'

export type EditorThemeId =
  | 'github-light'
  | 'one-dark'
  | 'solarized-light'
  | 'solarized-dark'
  | 'dracula'
  | 'nord'

export type EditorThemeMeta = {
  id: EditorThemeId
  label: string
  dark: boolean
  /** Representative colors for the swatch: [background, foreground, accent] */
  swatches: [string, string, string]
}

export const editorThemes: EditorThemeMeta[] = [
  { id: 'github-light', label: 'GitHub Light', dark: false, swatches: ['#ffffff', '#24292e', '#0366d6'] },
  { id: 'one-dark', label: 'One Dark', dark: true, swatches: ['#282c34', '#abb2bf', '#61afef'] },
  { id: 'solarized-light', label: 'Solarized Light', dark: false, swatches: ['#fdf6e3', '#657b83', '#268bd2'] },
  { id: 'solarized-dark', label: 'Solarized Dark', dark: true, swatches: ['#002b36', '#839496', '#268bd2'] },
  { id: 'dracula', label: 'Dracula', dark: true, swatches: ['#282a36', '#f8f8f2', '#bd93f9'] },
  { id: 'nord', label: 'Nord', dark: true, swatches: ['#2e3440', '#d8dee9', '#88c0d0'] },
]

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

// ── Solarized Light ──

const solarizedLightChrome = EditorView.theme({
  '&': { backgroundColor: '#fdf6e3', color: '#657b83' },
  '.cm-gutters': { backgroundColor: '#eee8d5', color: '#93a1a1', borderRight: '1px solid #eee8d5' },
  '.cm-activeLineGutter': { backgroundColor: '#eee8d5' },
  '.cm-activeLine': { backgroundColor: '#eee8d5' },
  '.cm-cursor': { borderLeftColor: '#657b83' },
  '.cm-selectionBackground': { backgroundColor: '#268bd225' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: '#268bd240' },
})

const solarizedLightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#859900' },
  { tag: tags.name, color: '#657b83' },
  { tag: tags.function(tags.variableName), color: '#268bd2' },
  { tag: tags.definition(tags.variableName), color: '#268bd2' },
  { tag: tags.string, color: '#2aa198' },
  { tag: tags.comment, color: '#93a1a1', fontStyle: 'italic' },
  { tag: tags.number, color: '#d33682' },
  { tag: tags.bool, color: '#cb4b16' },
  { tag: tags.operator, color: '#657b83' },
  { tag: tags.typeName, color: '#b58900' },
  { tag: tags.meta, color: '#cb4b16' },
  { tag: tags.link, color: '#268bd2' },
  { tag: tags.heading, color: '#cb4b16', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
])

// ── Solarized Dark ──

const solarizedDarkChrome = EditorView.theme({
  '&': { backgroundColor: '#002b36', color: '#839496' },
  '.cm-gutters': { backgroundColor: '#073642', color: '#586e75', borderRight: '1px solid #073642' },
  '.cm-activeLineGutter': { backgroundColor: '#073642' },
  '.cm-activeLine': { backgroundColor: '#073642' },
  '.cm-cursor': { borderLeftColor: '#839496' },
  '.cm-selectionBackground': { backgroundColor: '#268bd225' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: '#268bd240' },
})

const solarizedDarkHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#859900' },
  { tag: tags.name, color: '#839496' },
  { tag: tags.function(tags.variableName), color: '#268bd2' },
  { tag: tags.definition(tags.variableName), color: '#268bd2' },
  { tag: tags.string, color: '#2aa198' },
  { tag: tags.comment, color: '#586e75', fontStyle: 'italic' },
  { tag: tags.number, color: '#d33682' },
  { tag: tags.bool, color: '#cb4b16' },
  { tag: tags.operator, color: '#839496' },
  { tag: tags.typeName, color: '#b58900' },
  { tag: tags.meta, color: '#cb4b16' },
  { tag: tags.link, color: '#268bd2' },
  { tag: tags.heading, color: '#cb4b16', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
])

// ── Dracula ──

const draculaChrome = EditorView.theme({
  '&': { backgroundColor: '#282a36', color: '#f8f8f2' },
  '.cm-gutters': { backgroundColor: '#282a36', color: '#6272a4', borderRight: '1px solid #44475a' },
  '.cm-activeLineGutter': { backgroundColor: '#44475a' },
  '.cm-activeLine': { backgroundColor: '#44475a' },
  '.cm-cursor': { borderLeftColor: '#f8f8f2' },
  '.cm-selectionBackground': { backgroundColor: '#44475a' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: '#44475a' },
})

const draculaHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#ff79c6' },
  { tag: tags.name, color: '#f8f8f2' },
  { tag: tags.function(tags.variableName), color: '#50fa7b' },
  { tag: tags.definition(tags.variableName), color: '#50fa7b' },
  { tag: tags.string, color: '#f1fa8c' },
  { tag: tags.comment, color: '#6272a4', fontStyle: 'italic' },
  { tag: tags.number, color: '#bd93f9' },
  { tag: tags.bool, color: '#bd93f9' },
  { tag: tags.operator, color: '#ff79c6' },
  { tag: tags.typeName, color: '#8be9fd', fontStyle: 'italic' },
  { tag: tags.meta, color: '#f8f8f2' },
  { tag: tags.link, color: '#8be9fd' },
  { tag: tags.heading, color: '#bd93f9', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
])

// ── Nord ──

const nordChrome = EditorView.theme({
  '&': { backgroundColor: '#2e3440', color: '#d8dee9' },
  '.cm-gutters': { backgroundColor: '#2e3440', color: '#4c566a', borderRight: '1px solid #3b4252' },
  '.cm-activeLineGutter': { backgroundColor: '#3b4252' },
  '.cm-activeLine': { backgroundColor: '#3b4252' },
  '.cm-cursor': { borderLeftColor: '#d8dee9' },
  '.cm-selectionBackground': { backgroundColor: '#434c5e' },
  '&.cm-focused .cm-selectionBackground': { backgroundColor: '#434c5e' },
})

const nordHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#81a1c1' },
  { tag: tags.name, color: '#d8dee9' },
  { tag: tags.function(tags.variableName), color: '#88c0d0' },
  { tag: tags.definition(tags.variableName), color: '#88c0d0' },
  { tag: tags.string, color: '#a3be8c' },
  { tag: tags.comment, color: '#616e88', fontStyle: 'italic' },
  { tag: tags.number, color: '#b48ead' },
  { tag: tags.bool, color: '#81a1c1' },
  { tag: tags.operator, color: '#81a1c1' },
  { tag: tags.typeName, color: '#8fbcbb' },
  { tag: tags.meta, color: '#5e81ac' },
  { tag: tags.link, color: '#88c0d0' },
  { tag: tags.heading, color: '#88c0d0', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
])

// ── Theme Extension Map ──

const themeExtensions: Record<EditorThemeId, Extension> = {
  'github-light': [githubLightChrome, syntaxHighlighting(githubLightHighlight)],
  'one-dark': oneDark,
  'solarized-light': [solarizedLightChrome, syntaxHighlighting(solarizedLightHighlight)],
  'solarized-dark': [solarizedDarkChrome, syntaxHighlighting(solarizedDarkHighlight)],
  'dracula': [draculaChrome, syntaxHighlighting(draculaHighlight)],
  'nord': [nordChrome, syntaxHighlighting(nordHighlight)],
}

export function getThemeExtension(id: EditorThemeId): Extension {
  return themeExtensions[id]
}

export function getThemeMeta(id: EditorThemeId): EditorThemeMeta {
  return editorThemes.find((t) => t.id === id)!
}
