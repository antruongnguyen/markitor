/**
 * AI chat client using official SDK libraries.
 *
 * - Anthropic SDK for native Anthropic API (supports browser via dangerouslyAllowBrowser)
 * - OpenAI SDK for all OpenAI-compatible providers (OpenAI, Ollama, LM Studio, Together AI, etc.)
 */

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { ProviderId } from '../store/aiStore'

export type StreamCallback = (chunk: string) => void

function isAnthropicProvider(provider: ProviderId, baseUrl: string): boolean {
  return provider === 'anthropic' || baseUrl.includes('anthropic.com')
}

/** Ensure the base URL ends with /v1 for the OpenAI SDK (it appends /chat/completions). */
function toOpenAIBaseURL(baseUrl: string): string {
  const cleaned = baseUrl.replace(/\/+$/, '')
  if (/\/v\d+$/.test(cleaned)) return cleaned
  return `${cleaned}/v1`
}

async function streamWithAnthropic(opts: {
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  system: string
  userMessage: string
  onChunk: StreamCallback
  signal?: AbortSignal
}): Promise<string> {
  const client = new Anthropic({
    apiKey: opts.apiKey,
    baseURL: opts.baseUrl.replace(/\/+$/, ''),
    dangerouslyAllowBrowser: true,
  })

  const stream = client.messages.stream(
    {
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: 'user' as const, content: opts.userMessage }],
    },
    { signal: opts.signal },
  )

  let full = ''
  stream.on('text', (text) => {
    full += text
    opts.onChunk(text)
  })

  await stream.finalMessage()
  return full
}

async function streamWithOpenAI(opts: {
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  system: string
  userMessage: string
  onChunk: StreamCallback
  signal?: AbortSignal
}): Promise<string> {
  const client = new OpenAI({
    apiKey: opts.apiKey || 'not-required',
    baseURL: toOpenAIBaseURL(opts.baseUrl),
    dangerouslyAllowBrowser: true,
  })

  const stream = await client.chat.completions.create(
    {
      model: opts.model,
      max_tokens: opts.maxTokens,
      stream: true,
      messages: [
        { role: 'system' as const, content: opts.system },
        { role: 'user' as const, content: opts.userMessage },
      ],
    },
    { signal: opts.signal },
  )

  let full = ''
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      full += content
      opts.onChunk(content)
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
  try {
    if (isAnthropicProvider(opts.provider, opts.baseUrl)) {
      return await streamWithAnthropic(opts)
    }
    return await streamWithOpenAI(opts)
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err

    // Surface SDK error messages clearly
    const msg =
      err instanceof Anthropic.APIConnectionError || err instanceof OpenAI.APIConnectionError
        ? `Connection failed to ${opts.baseUrl}. ${/localhost|127\.0\.0\.1/i.test(opts.baseUrl) ? 'Make sure the local server (e.g. Ollama) is running.' : 'This may be a CORS issue — use Anthropic (supports browser access) or a local provider like Ollama.'}`
        : err instanceof Anthropic.APIError
          ? `Anthropic API error ${err.status}: ${err.message}`
          : err instanceof OpenAI.APIError
            ? `API error ${err.status}: ${err.message}`
            : err instanceof TypeError && /fetch|network/i.test(err.message)
              ? `Network error connecting to ${opts.baseUrl}. Check your connection and provider settings.`
              : null

    if (msg) throw new Error(msg)
    throw err
  }
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
