# Markitor

A modern, AI-powered markdown editor built with React and CodeMirror 6. Write, preview, and publish beautiful documents — right in your browser.

Markitor is a fully client-side Progressive Web App. No backend, no accounts, no tracking. Your documents stay on your device.

## Features

### Editor

- **Live split-pane preview** with synchronized scrolling
- **Multi-tab editing** with drag-to-reorder and middle-click close
- **Rich formatting toolbar** — bold, italic, strikethrough, headings H1–H6, ordered/unordered lists, task lists, blockquotes, code blocks, links, images, tables, horizontal rules, superscript, subscript, indent/outdent, undo/redo
- **Smart paste** — paste a URL to create a link, paste HTML to convert to markdown, paste an image to embed as base64
- **Format document** — auto-prettify markdown with consistent spacing, aligned tables, and normalized lists
- **Markdown linting** — real-time warnings in the gutter for common issues (skipped headings, missing alt text, trailing whitespace, and more)
- **Smart autocomplete** — context-aware snippets and markdown syntax completion
- **Visual table editor** — grid picker for inserting tables, floating toolbar for editing rows and columns, Tab key navigation between cells
- **Search and replace** — custom panel with regex support, case sensitivity toggle, and icon-based UI
- **Keyboard shortcuts** — comprehensive and customizable via a searchable shortcuts panel (`Ctrl+/`)
- **Typewriter mode** — keeps the active line centered in the viewport for comfortable long-form writing

### AI Writing Assistant

- **Multi-provider support** — works with OpenAI, Anthropic, Ollama, or any OpenAI-compatible API
- **Built-in actions** — summarize, expand, translate, simplify, fix grammar, generate outline, and more
- **Custom functions** — define your own AI prompt templates
- **Streaming responses** — see AI output appear in real time
- **Resizable panel** — drag to adjust the AI sidebar width

### Content

- **KaTeX math** — inline `$...$` and block `$$...$$` LaTeX rendering
- **Mermaid diagrams** — flowcharts, sequence diagrams, Gantt charts, and more
- **Footnotes** — `[^1]` references with automatic numbering and back-links
- **Definition lists** — term/definition pairs rendered as `<dl>` in preview
- **YAML frontmatter** — visual form editor with templates for blog posts, documentation, and custom schemas
- **Emoji picker** — searchable emoji insertion with category tabs and recently used
- **Document templates** — 7 built-in templates (README, blog post, meeting notes, changelog, API docs, technical spec, and blank)

### Writing Tools

- **Writing statistics** — word count, character count, reading time, Flesch-Kincaid readability score, sentence analysis, vocabulary richness, and top words
- **Focus / Zen mode** — distraction-free full-screen editing with optional typewriter scrolling
- **Table of contents** — collapsible sidebar generated from document headings
- **Custom preview CSS** — apply your own styles to the preview pane with built-in presets (Serif Academic, Newspaper, Terminal, Minimal)
- **Command palette** — quick access to every action via `Ctrl+P`

### Files & Storage

- **Open / Save** — native file picker via the File System Access API
- **Auto-save** — drafts saved to IndexedDB every 30 seconds and on every typing pause
- **Saved documents browser** — reopen any previously saved document from browser storage
- **Export** — save as HTML or print to PDF
- **Drag-and-drop images** — drop or paste images to embed as base64
- **Image insertion dialog** — specify alt text, enter a URL, or choose a file from your device

### App

- **Progressive Web App** — installable on desktop and mobile with full offline support
- **Dark / Light mode** — follows your system preference or set manually
- **Three layout modes** — editor only, preview only, or split view
- **Responsive** — works on any screen size

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm 9 or later

### Install

```bash
git clone https://github.com/user/markitor.git
cd markitor
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

The production build is output to `dist/`. Serve it with any static file server.

### Preview production build

```bash
npm run preview
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 8 |
| Editor | CodeMirror 6 |
| Preview | markdown-it + highlight.js |
| Math | KaTeX |
| Diagrams | Mermaid |
| Styling | Tailwind CSS v4 |
| Icons | lucide-react |
| State | Zustand 5 |
| PWA | vite-plugin-pwa |
| Storage | IndexedDB (auto-save) + File System Access API |

## Project Structure

```
src/
  components/     # React components (24 files)
    Editor.tsx        # CodeMirror 6 editor
    Preview.tsx       # Markdown preview with KaTeX/Mermaid
    SplitPane.tsx     # Resizable split layout
    Toolbar.tsx       # Formatting toolbar
    AIPanel.tsx       # AI writing assistant
    TabBar.tsx        # Multi-tab interface
    CommandPalette.tsx # Quick action launcher
    ...
  store/          # Zustand state management (20 stores)
  hooks/          # Custom React hooks
  utils/          # Utility functions and helpers (27 files)
  App.tsx         # Root application component
  main.tsx        # Entry point
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save to browser | `Ctrl+S` |
| Save to disk | `Ctrl+Shift+S` |
| Command palette | `Ctrl+P` |
| Find & replace | `Ctrl+F` / `Ctrl+H` |
| Bold | `Ctrl+B` |
| Italic | `Ctrl+I` |
| Heading 1–6 | `Ctrl+1` – `Ctrl+6` |
| Link | `Ctrl+K` |
| Toggle focus mode | `Ctrl+Shift+F` |
| Toggle typewriter | `Ctrl+Alt+T` |
| Format document | `Alt+Shift+F` |
| View all shortcuts | `Ctrl+/` |

All shortcuts are customizable from the keyboard shortcuts panel.

## AI Configuration

Markitor works with any OpenAI-compatible API. Open Settings (`Ctrl+,`) to configure:

1. **Provider** — choose OpenAI, Anthropic, Ollama (local), or Custom
2. **API Key** — your provider API key
3. **Base URL** — auto-filled per provider, or set your own
4. **Model** — select from suggested models or enter a custom model name

For local AI (Ollama), no API key is needed — just point the base URL to your local server.

## License

[MIT](LICENSE)
