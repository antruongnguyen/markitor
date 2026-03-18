/**
 * Thin wrapper around the Anthropic Messages API.
 *
 * Calls the API directly from the browser using the user's own API key.
 * The `anthropic-dangerous-direct-browser-access` header is required for
 * browser-side usage. If CORS is blocked, the user may need to route
 * requests through a local proxy (e.g. a simple CORS-anywhere server).
 */

const API_URL = 'https://api.anthropic.com/v1/messages'

export type StreamCallback = (chunk: string) => void

export async function sendMessage(opts: {
  apiKey: string
  model: string
  maxTokens: number
  system: string
  userMessage: string
  onChunk: StreamCallback
  signal?: AbortSignal
}): Promise<string> {
  const { apiKey, model, maxTokens, system, userMessage, onChunk, signal } = opts

  const res = await fetch(API_URL, {
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
        const event = JSON.parse(data)
        if (event.type === 'content_block_delta' && event.delta?.text) {
          full += event.delta.text
          onChunk(event.delta.text)
        }
      } catch {
        // skip malformed JSON lines
      }
    }
  }

  return full
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
    case 'custom':
      return `${customPrompt}\n\nText:\n${selectedText}`
    default:
      return selectedText
  }
}
