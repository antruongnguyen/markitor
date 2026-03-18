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
  fileName: string
  fileHandle: FileSystemFileHandle | null
  isDirty: boolean
  cursorLine: number
  cursorColumn: number
  setContent: (s: string) => void
  setContentFromFile: (s: string) => void
  setFileMeta: (meta: { fileName: string; fileHandle: FileSystemFileHandle | null }) => void
  setCursorPosition: (line: number, column: number) => void
  markSaved: () => void
  setDirty: (dirty: boolean) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  content: DEFAULT_CONTENT,
  fileName: 'untitled.md',
  fileHandle: null,
  isDirty: false,
  cursorLine: 1,
  cursorColumn: 1,
  setContent: (s) =>
    set((state) => ({
      content: s,
      isDirty: state.content !== s ? true : state.isDirty,
    })),
  setContentFromFile: (s) =>
    set({
      content: s,
      isDirty: false,
    }),
  setFileMeta: ({ fileName, fileHandle }) =>
    set({
      fileName,
      fileHandle,
    }),
  setCursorPosition: (line, column) => set({ cursorLine: line, cursorColumn: column }),
  markSaved: () => set({ isDirty: false }),
  setDirty: (dirty) => set({ isDirty: dirty }),
}))
