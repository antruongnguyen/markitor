import { useCallback, useRef, useState, useEffect } from 'react'
import { Trash2, Settings, Send, ChevronDown } from 'lucide-react'
import { useAIStore } from '../store/aiStore'
import { useEditorStore } from '../store/editorStore'
import { editorViewRef } from '../utils/editorViewRef'
import {
  sendMessage,
  buildSystemPrompt,
  buildActionPrompt,
  BUILTIN_ACTIONS,
  ACTION_CATEGORIES,
  type ActionId,
  type ActionDef,
} from '../utils/aiClient'

function getSelectedText(): string {
  const view = editorViewRef.current
  if (!view) return ''
  const { from, to } = view.state.selection.main
  if (from === to) return ''
  return view.state.doc.sliceString(from, to)
}

function getContextAroundCursor(): string {
  const view = editorViewRef.current
  if (!view) return ''
  const doc = view.state.doc.toString()
  const pos = view.state.selection.main.head
  const start = Math.max(0, pos - 500)
  return doc.slice(start, pos)
}

export function AIPanel() {
  const messages = useAIStore((s) => s.messages)
  const loading = useAIStore((s) => s.loading)
  const streamingContent = useAIStore((s) => s.streamingContent)
  const provider = useAIStore((s) => s.provider)
  const apiKey = useAIStore((s) => s.apiKey)
  const baseUrl = useAIStore((s) => s.baseUrl)
  const model = useAIStore((s) => s.model)
  const maxTokens = useAIStore((s) => s.maxTokens)
  const customFunctions = useAIStore((s) => s.customFunctions)
  const addMessage = useAIStore((s) => s.addMessage)
  const setLoading = useAIStore((s) => s.setLoading)
  const setStreamingContent = useAIStore((s) => s.setStreamingContent)
  const appendStreamingContent = useAIStore((s) => s.appendStreamingContent)
  const clearMessages = useAIStore((s) => s.clearMessages)
  const setSettingsOpen = useAIStore((s) => s.setSettingsOpen)
  const content = useEditorStore((s) => s.content)

  const [customPrompt, setCustomPrompt] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('writing')
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  // Build the custom function actions from store
  const customActions: ActionDef[] = customFunctions.map((fn) => ({
    id: `custom-fn-${fn.id}` as ActionId,
    label: fn.name,
    category: 'custom' as const,
    needsSelection: fn.needsSelection,
  }))

  const allActions = [...BUILTIN_ACTIONS, ...customActions]

  const runAction = useCallback(
    async (action: ActionId) => {
      const preset = provider
      const needsKey = preset === 'anthropic' || preset === 'openai'
      if (needsKey && !apiKey) {
        setSettingsOpen(true)
        return
      }

      const selected = getSelectedText()
      const contextText = action === 'continue' ? getContextAroundCursor() : selected

      // For custom functions, find the prompt template
      let userPrompt: string
      if (action.startsWith('custom-fn-')) {
        const fnId = action.replace('custom-fn-', '')
        const fn = customFunctions.find((f) => f.id === fnId)
        if (!fn) return
        if (fn.needsSelection && !contextText) return
        userPrompt = fn.needsSelection ? `${fn.prompt}\n\nText:\n${contextText}` : fn.prompt
      } else if (action === 'custom') {
        if (!customPrompt.trim()) return
        userPrompt = buildActionPrompt(action, contextText || '', customPrompt)
      } else {
        if (!contextText && action !== 'continue') return
        userPrompt = buildActionPrompt(action, contextText)
      }

      const displayLabel = action.startsWith('custom-fn-')
        ? customFunctions.find((f) => f.id === action.replace('custom-fn-', ''))?.name ?? action
        : action === 'custom'
          ? customPrompt
          : `[${action}] ${(contextText || '').slice(0, 100)}${(contextText || '').length > 100 ? '...' : ''}`

      addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: displayLabel,
        action,
        timestamp: Date.now(),
      })

      setLoading(true)
      setStreamingContent('')

      const abort = new AbortController()
      abortRef.current = abort

      try {
        const full = await sendMessage({
          provider,
          apiKey,
          baseUrl,
          model,
          maxTokens,
          system: buildSystemPrompt(content),
          userMessage: userPrompt,
          onChunk: (chunk) => appendStreamingContent(chunk),
          signal: abort.signal,
        })

        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: full,
          action,
          timestamp: Date.now(),
        })
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${errorMsg}`,
          timestamp: Date.now(),
        })
      } finally {
        setLoading(false)
        setStreamingContent('')
        abortRef.current = null
      }
    },
    [provider, apiKey, baseUrl, model, maxTokens, content, customPrompt, customFunctions, addMessage, setLoading, setStreamingContent, appendStreamingContent, setSettingsOpen],
  )

  const handleApply = useCallback((text: string) => {
    const view = editorViewRef.current
    if (!view) return
    const { from, to } = view.state.selection.main
    view.dispatch({
      changes: { from, to, insert: text },
    })
    view.focus()
  }, [])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const handleCustomSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!customPrompt.trim()) return
      runAction('custom')
      setCustomPrompt('')
    },
    [customPrompt, runAction],
  )

  const hasSelection = !!getSelectedText()

  const toggleCategory = useCallback((catId: string) => {
    setExpandedCategory((prev) => (prev === catId ? null : catId))
  }, [])

  // Filter categories that have actions
  const visibleCategories = ACTION_CATEGORIES.filter((cat) =>
    allActions.some((a) => a.category === cat.id),
  )

  return (
    <div className="flex h-full w-[300px] shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">AI Assistant</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            onClick={clearMessages}
            title="Clear history"
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            onClick={() => setSettingsOpen(true)}
            title="AI settings"
          >
            <Settings size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Actions by category — collapsible */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        {visibleCategories.map((cat) => {
          const catActions = allActions.filter((a) => a.category === cat.id)
          const isExpanded = expandedCategory === cat.id
          return (
            <div key={cat.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-1.5 text-left"
                onClick={() => toggleCategory(cat.id)}
              >
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {cat.label}
                </span>
                <ChevronDown
                  size={12}
                  strokeWidth={1.5}
                  className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              {isExpanded && (
                <div className="flex flex-wrap gap-1 px-3 pb-2">
                  {catActions.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      disabled={loading || (a.needsSelection && !hasSelection)}
                      className="rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      onClick={() => runAction(a.id)}
                      title={a.needsSelection && !hasSelection ? 'Select text in editor first' : a.label}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-2">
        {messages.length === 0 && !loading && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Select text in the editor and choose an action, or use the custom prompt below.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-full rounded-lg px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 shadow-sm dark:bg-gray-900 dark:text-gray-200'
              }`}
            >
              <pre className="whitespace-pre-wrap break-words font-sans">{msg.content}</pre>
            </div>
            {msg.role === 'assistant' && !msg.content.startsWith('Error:') && (
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded bg-green-600 px-2 py-0.5 text-[10px] font-medium text-white transition-colors hover:bg-green-500"
                  onClick={() => handleApply(msg.content)}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-0.5 text-[10px] font-medium text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                  onClick={() => navigator.clipboard.writeText(msg.content)}
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && streamingContent && (
          <div className="flex flex-col items-start gap-1">
            <div className="max-w-full rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-gray-800 shadow-sm dark:bg-gray-900 dark:text-gray-200">
              <pre className="whitespace-pre-wrap break-words font-sans">{streamingContent}</pre>
            </div>
          </div>
        )}

        {loading && !streamingContent && (
          <div className="flex items-center gap-2 py-2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-xs text-gray-400">Thinking...</span>
          </div>
        )}
      </div>

      {/* Stop button */}
      {loading && (
        <div className="border-t border-gray-200 px-3 py-2 dark:border-gray-700">
          <button
            type="button"
            className="w-full rounded bg-red-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500"
            onClick={handleStop}
          >
            Stop generating
          </button>
        </div>
      )}

      {/* Custom prompt input */}
      <form
        onSubmit={handleCustomSubmit}
        className="flex gap-2 border-t border-gray-200 px-3 py-2 dark:border-gray-700"
      >
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Ask AI anything..."
          disabled={loading}
          className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400"
        />
        <button
          type="submit"
          disabled={loading || !customPrompt.trim()}
          className="shrink-0 rounded bg-blue-600 p-1.5 text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
        >
          <Send size={14} strokeWidth={1.5} />
        </button>
      </form>
    </div>
  )
}
