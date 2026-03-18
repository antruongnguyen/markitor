import { create } from 'zustand'

const DEFAULT_CONTENT = `# Welcome to Markitor

A simple markdown editor with live preview.

## Features

- **Real-time preview** as you type
- Syntax highlighting for code blocks
- Keyboard shortcuts for formatting

## Try it out

Type some markdown here and see it rendered on the right!

\`\`\`typescript
const greeting = "Hello, Markitor!";
console.log(greeting);
\`\`\`

> Markdown is a lightweight markup language that you can use to add
> formatting elements to plaintext text documents.
`

type EditorStore = {
  content: string
  setContent: (s: string) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  content: DEFAULT_CONTENT,
  setContent: (s) => set({ content: s }),
}))
