import { create } from 'zustand'

export type AIModel = 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6-20250131'

export type AIMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  action?: string
  timestamp: number
}

type AIStore = {
  open: boolean
  messages: AIMessage[]
  loading: boolean
  streamingContent: string
  apiKey: string
  model: AIModel
  maxTokens: number
  settingsOpen: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
  addMessage: (msg: AIMessage) => void
  setLoading: (loading: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  setApiKey: (key: string) => void
  setModel: (model: AIModel) => void
  setMaxTokens: (tokens: number) => void
  setSettingsOpen: (open: boolean) => void
  clearMessages: () => void
}

const STORAGE_PREFIX = 'markitor-ai-'

const storedKey = localStorage.getItem(STORAGE_PREFIX + 'key') ?? ''
const storedModel = localStorage.getItem(STORAGE_PREFIX + 'model') as AIModel | null
const storedTokens = localStorage.getItem(STORAGE_PREFIX + 'max-tokens')

export const useAIStore = create<AIStore>((set) => ({
  open: false,
  messages: [],
  loading: false,
  streamingContent: '',
  apiKey: storedKey,
  model: storedModel === 'claude-haiku-4-5-20251001' || storedModel === 'claude-sonnet-4-6-20250131' ? storedModel : 'claude-haiku-4-5-20251001',
  maxTokens: storedTokens ? Number(storedTokens) : 1024,
  settingsOpen: false,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (open) => set({ open }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading: (loading) => set({ loading }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),
  setApiKey: (key) => {
    localStorage.setItem(STORAGE_PREFIX + 'key', key)
    set({ apiKey: key })
  },
  setModel: (model) => {
    localStorage.setItem(STORAGE_PREFIX + 'model', model)
    set({ model })
  },
  setMaxTokens: (tokens) => {
    localStorage.setItem(STORAGE_PREFIX + 'max-tokens', String(tokens))
    set({ maxTokens: tokens })
  },
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  clearMessages: () => set({ messages: [], streamingContent: '' }),
}))
