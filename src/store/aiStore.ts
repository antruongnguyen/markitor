import { create } from 'zustand'

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
  baseUrl: string
  model: string
  maxTokens: number
  settingsOpen: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
  addMessage: (msg: AIMessage) => void
  setLoading: (loading: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  setModel: (model: string) => void
  setMaxTokens: (tokens: number) => void
  setSettingsOpen: (open: boolean) => void
  clearMessages: () => void
}

const STORAGE_PREFIX = 'markitor-ai-'

const storedKey = localStorage.getItem(STORAGE_PREFIX + 'key') ?? ''
const storedBaseUrl = localStorage.getItem(STORAGE_PREFIX + 'base-url') ?? 'https://api.anthropic.com'
const storedModel = localStorage.getItem(STORAGE_PREFIX + 'model') ?? 'claude-haiku-4-5-20251001'
const storedTokens = localStorage.getItem(STORAGE_PREFIX + 'max-tokens')

export const MODEL_SUGGESTIONS = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6-20250131',
  'claude-opus-4-6-20250501',
  'claude-sonnet-4-5-20241022',
  'claude-3-5-haiku-20241022',
]

export const useAIStore = create<AIStore>((set) => ({
  open: false,
  messages: [],
  loading: false,
  streamingContent: '',
  apiKey: storedKey,
  baseUrl: storedBaseUrl,
  model: storedModel,
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
  setBaseUrl: (url) => {
    localStorage.setItem(STORAGE_PREFIX + 'base-url', url)
    set({ baseUrl: url })
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
