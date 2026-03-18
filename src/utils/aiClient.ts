/**
 * OpenAI-compatible chat completions client.
 *
 * Sends requests using the /v1/chat/completions format which is supported by
 * OpenAI, Ollama, LM Studio, Together AI, vLLM, and many other providers.
 *
 * For Anthropic, we detect the provider and use the native /v1/messages API
 * with anthropic-specific headers to preserve full compatibility.
 */

import type { ProviderId } from '../store/aiStore'

export type StreamCallback = (chunk: string) => void

function isAnthropicProvider(provider: ProviderId, baseUrl: string): boolean {
  return provider === 'anthropic' || baseUrl.includes('anthropic.com')
}

async function streamAnthropicNative(opts: {
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  system: string
  userMessage: string
  onChunk: StreamCallback
  signal?: AbortSignal
}): Promise<string> {
  const { apiKey, baseUrl, model, maxTokens, system, userMessage, onChunk, signal } = opts
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/messages`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
    signal,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API error ${res.status}: ${body}`)
  }

  return parseSSE(res, (data) => {
    const event = JSON.parse(data)
    if (event.type === 'content_block_delta' && event.delta?.text) {
      return event.delta.text
    }
    return null
  }, onChunk)
}

async function streamOpenAICompatible(opts: {
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  system: string
  userMessage: string
  onChunk: StreamCallback
  signal?: AbortSignal
}): Promise<string> {
  const { apiKey, baseUrl, model, maxTokens, system, userMessage, onChunk, signal } = opts
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
    }),
    signal,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API error ${res.status}: ${body}`)
  }

  return parseSSE(res, (data) => {
    const event = JSON.parse(data)
    const delta = event.choices?.[0]?.delta?.content
    return delta ?? null
  }, onChunk)
}

async function parseSSE(
  res: Response,
  extractText: (data: string) => string | null,
  onChunk: StreamCallback,
): Promise<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop()!

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue

      try {
        const text = extractText(data)
        if (text) {
          full += text
          onChunk(text)
        }
      } catch {
        // skip malformed JSON lines
      }
    }
  }

  return full
}

export async function sendMessage(opts: {
  provider: ProviderId
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  system: string
  userMessage: string
  onChunk: StreamCallback
  signal?: AbortSignal
}): Promise<string> {
  if (isAnthropicProvider(opts.provider, opts.baseUrl)) {
    return streamAnthropicNative(opts)
  }
  return streamOpenAICompatible(opts)
}

export function buildSystemPrompt(documentContent: string): string {
  return `You are an AI writing assistant embedded in a markdown editor called Markitor. The user is editing a markdown document. Help them with writing tasks.

Current document:
---
${documentContent.slice(0, 8000)}
---

Guidelines:
- Return only the requested text, no extra commentary unless asked
- Preserve the user's writing style and voice
- Use markdown formatting when appropriate
- Be concise and direct`
}

export type ActionId =
  | 'rewrite-concise'
  | 'rewrite-formal'
  | 'rewrite-casual'
  | 'rewrite-clearer'
  | 'continue'
  | 'explain'
  | 'grammar'
  | 'summarize'
  | 'expand'
  | 'translate'
  | 'simplify'
  | 'outline'
  | 'fix-code'
  | 'comment-code'
  | 'custom'
  | `custom-fn-${string}`

export type ActionCategory = 'writing' | 'rewriting' | 'code' | 'custom'

export type ActionDef = {
  id: ActionId
  label: string
  category: ActionCategory
  needsSelection: boolean
}

export const BUILTIN_ACTIONS: ActionDef[] = [
  // Writing
  { id: 'continue', label: 'Continue writing', category: 'writing', needsSelection: false },
  { id: 'explain', label: 'Explain / Expand', category: 'writing', needsSelection: true },
  { id: 'summarize', label: 'Summarize', category: 'writing', needsSelection: true },
  { id: 'expand', label: 'Expand', category: 'writing', needsSelection: true },
  { id: 'outline', label: 'Generate outline', category: 'writing', needsSelection: true },
  { id: 'translate', label: 'Translate to English', category: 'writing', needsSelection: true },
  // Rewriting
  { id: 'rewrite-concise', label: 'More concise', category: 'rewriting', needsSelection: true },
  { id: 'rewrite-formal', label: 'More formal', category: 'rewriting', needsSelection: true },
  { id: 'rewrite-casual', label: 'More casual', category: 'rewriting', needsSelection: true },
  { id: 'rewrite-clearer', label: 'Clearer', category: 'rewriting', needsSelection: true },
  { id: 'simplify', label: 'Simplify', category: 'rewriting', needsSelection: true },
  { id: 'grammar', label: 'Fix grammar', category: 'rewriting', needsSelection: true },
  // Code
  { id: 'fix-code', label: 'Fix code', category: 'code', needsSelection: true },
  { id: 'comment-code', label: 'Add comments', category: 'code', needsSelection: true },
]

export const ACTION_CATEGORIES: { id: ActionCategory; label: string }[] = [
  { id: 'writing', label: 'Writing' },
  { id: 'rewriting', label: 'Rewriting' },
  { id: 'code', label: 'Code' },
  { id: 'custom', label: 'Custom' },
]

export function buildActionPrompt(
  action: string,
  selectedText: string,
  customPrompt?: string,
): string {
  switch (action) {
    case 'rewrite-concise':
      return `Rewrite the following text to be more concise while preserving the meaning:\n\n${selectedText}`
    case 'rewrite-formal':
      return `Rewrite the following text in a more formal tone:\n\n${selectedText}`
    case 'rewrite-casual':
      return `Rewrite the following text in a more casual, conversational tone:\n\n${selectedText}`
    case 'rewrite-clearer':
      return `Rewrite the following text to be clearer and easier to understand:\n\n${selectedText}`
    case 'continue':
      return `Continue writing from where this text ends. Write the next paragraph naturally:\n\n${selectedText}`
    case 'explain':
      return `Expand and explain the following text in more detail:\n\n${selectedText}`
    case 'grammar':
      return `Fix any grammar, spelling, and punctuation errors in the following text. Return only the corrected text:\n\n${selectedText}`
    case 'summarize':
      return `Summarize the following text concisely, capturing the key points:\n\n${selectedText}`
    case 'expand':
      return `Expand the following text with more detail, examples, and explanations:\n\n${selectedText}`
    case 'translate':
      return `Translate the following text to English. If it's already in English, improve the translation quality:\n\n${selectedText}`
    case 'simplify':
      return `Simplify the following text so it's easy to understand. Use shorter sentences and simpler words:\n\n${selectedText}`
    case 'outline':
      return `Generate a structured outline from the following text, using markdown headings and bullet points:\n\n${selectedText}`
    case 'fix-code':
      return `Fix any bugs, errors, or issues in the following code. Return only the corrected code:\n\n\`\`\`\n${selectedText}\n\`\`\``
    case 'comment-code':
      return `Add clear, helpful comments to the following code. Return the code with comments added:\n\n\`\`\`\n${selectedText}\n\`\`\``
    case 'custom':
      return `${customPrompt}\n\nText:\n${selectedText}`
    default:
      return selectedText
  }
}
