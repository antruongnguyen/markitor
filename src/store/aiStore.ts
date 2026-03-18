import { create } from 'zustand'

export type AIMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  action?: string
  timestamp: number
}

export type ProviderId = 'openai' | 'anthropic' | 'ollama' | 'custom'

export type ProviderPreset = {
  id: ProviderId
  label: string
  defaultBaseUrl: string
  models: string[]
  defaultModel: string
  keyPlaceholder: string
  keyRequired: boolean
}

export type CustomFunction = {
  id: string
  name: string
  prompt: string
  category: string
  needsSelection: boolean
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1', 'o1-mini', 'o3-mini'],
    defaultModel: 'gpt-4o',
    keyPlaceholder: 'sk-...',
    keyRequired: true,
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com',
    models: [
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-6-20250131',
      'claude-opus-4-6-20250501',
      'claude-sonnet-4-5-20241022',
      'claude-3-5-haiku-20241022',
    ],
    defaultModel: 'claude-haiku-4-5-20251001',
    keyPlaceholder: 'sk-ant-...',
    keyRequired: true,
  },
  {
    id: 'ollama',
    label: 'Ollama / Local',
    defaultBaseUrl: 'http://localhost:11434',
    models: ['llama3.1', 'llama3', 'mistral', 'codellama', 'mixtral', 'phi3', 'gemma2', 'qwen2.5'],
    defaultModel: 'llama3.1',
    keyPlaceholder: '',
    keyRequired: false,
  },
  {
    id: 'custom',
    label: 'Custom',
    defaultBaseUrl: '',
    models: [],
    defaultModel: '',
    keyPlaceholder: 'API key...',
    keyRequired: false,
  },
]

export function getPreset(id: ProviderId): ProviderPreset {
  return PROVIDER_PRESETS.find((p) => p.id === id) ?? PROVIDER_PRESETS[3]
}

type AIStore = {
  open: boolean
  messages: AIMessage[]
  loading: boolean
  streamingContent: string
  provider: ProviderId
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  settingsOpen: boolean
  customFunctions: CustomFunction[]
  toggle: () => void
  setOpen: (open: boolean) => void
  addMessage: (msg: AIMessage) => void
  setLoading: (loading: boolean) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  setProvider: (provider: ProviderId) => void
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  setModel: (model: string) => void
  setMaxTokens: (tokens: number) => void
  setSettingsOpen: (open: boolean) => void
  clearMessages: () => void
  addCustomFunction: (fn: CustomFunction) => void
  removeCustomFunction: (id: string) => void
  updateCustomFunction: (id: string, fn: Partial<CustomFunction>) => void
}

const STORAGE_PREFIX = 'markitor-ai-'

const storedProvider = (localStorage.getItem(STORAGE_PREFIX + 'provider') ?? 'anthropic') as ProviderId
const storedKey = localStorage.getItem(STORAGE_PREFIX + 'key') ?? ''
const storedBaseUrl = localStorage.getItem(STORAGE_PREFIX + 'base-url') ?? getPreset(storedProvider).defaultBaseUrl
const storedModel = localStorage.getItem(STORAGE_PREFIX + 'model') ?? getPreset(storedProvider).defaultModel
const storedTokens = localStorage.getItem(STORAGE_PREFIX + 'max-tokens')
const storedCustomFns = localStorage.getItem(STORAGE_PREFIX + 'custom-functions')

function persistCustomFunctions(fns: CustomFunction[]) {
  localStorage.setItem(STORAGE_PREFIX + 'custom-functions', JSON.stringify(fns))
}

export const useAIStore = create<AIStore>((set, get) => ({
  open: false,
  messages: [],
  loading: false,
  streamingContent: '',
  provider: storedProvider,
  apiKey: storedKey,
  baseUrl: storedBaseUrl,
  model: storedModel,
  maxTokens: storedTokens ? Number(storedTokens) : 1024,
  settingsOpen: false,
  customFunctions: storedCustomFns ? JSON.parse(storedCustomFns) : [],
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (open) => set({ open }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setLoading: (loading) => set({ loading }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),
  setProvider: (provider) => {
    localStorage.setItem(STORAGE_PREFIX + 'provider', provider)
    const preset = getPreset(provider)
    localStorage.setItem(STORAGE_PREFIX + 'base-url', preset.defaultBaseUrl)
    localStorage.setItem(STORAGE_PREFIX + 'model', preset.defaultModel)
    set({ provider, baseUrl: preset.defaultBaseUrl, model: preset.defaultModel })
  },
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
  addCustomFunction: (fn) => {
    const updated = [...get().customFunctions, fn]
    persistCustomFunctions(updated)
    set({ customFunctions: updated })
  },
  removeCustomFunction: (id) => {
    const updated = get().customFunctions.filter((f) => f.id !== id)
    persistCustomFunctions(updated)
    set({ customFunctions: updated })
  },
  updateCustomFunction: (id, partial) => {
    const updated = get().customFunctions.map((f) => (f.id === id ? { ...f, ...partial } : f))
    persistCustomFunctions(updated)
    set({ customFunctions: updated })
  },
}))
