import { useCallback, useState, useEffect, useRef } from 'react'
import { X, Trash2, Keyboard } from 'lucide-react'
import { useAIStore, PROVIDER_PRESETS, getPreset, type ProviderId, type CustomFunction } from '../store/aiStore'
import { useShortcutsStore } from '../store/shortcutsStore'

function SettingsDialogInner({ onClose }: { onClose: () => void }) {
  const provider = useAIStore((s) => s.provider)
  const apiKey = useAIStore((s) => s.apiKey)
  const baseUrl = useAIStore((s) => s.baseUrl)
  const model = useAIStore((s) => s.model)
  const maxTokens = useAIStore((s) => s.maxTokens)
  const customFunctions = useAIStore((s) => s.customFunctions)
  const setProvider = useAIStore((s) => s.setProvider)
  const setApiKey = useAIStore((s) => s.setApiKey)
  const setBaseUrl = useAIStore((s) => s.setBaseUrl)
  const setModel = useAIStore((s) => s.setModel)
  const setMaxTokens = useAIStore((s) => s.setMaxTokens)
  const addCustomFunction = useAIStore((s) => s.addCustomFunction)
  const removeCustomFunction = useAIStore((s) => s.removeCustomFunction)

  const [localProvider, setLocalProvider] = useState(provider)
  const [localKey, setLocalKey] = useState(apiKey)
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl)
  const [localModel, setLocalModel] = useState(model)
  const [localTokens, setLocalTokens] = useState(maxTokens)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [tab, setTab] = useState<'provider' | 'functions'>('provider')
  const [newFnName, setNewFnName] = useState('')
  const [newFnPrompt, setNewFnPrompt] = useState('')
  const [newFnNeedsSelection, setNewFnNeedsSelection] = useState(true)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const modelInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLUListElement>(null)

  const preset = getPreset(localProvider)
  const modelSuggestions = localModel
    ? preset.models.filter((m) => m.toLowerCase().includes(localModel.toLowerCase()))
    : preset.models

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const handleProviderChange = useCallback((id: ProviderId) => {
    const p = getPreset(id)
    setLocalProvider(id)
    setLocalBaseUrl(p.defaultBaseUrl)
    setLocalModel(p.defaultModel)
  }, [])

  const handleSave = useCallback(() => {
    setProvider(localProvider)
    setApiKey(localKey.trim())
    setBaseUrl(localBaseUrl.trim() || getPreset(localProvider).defaultBaseUrl)
    setModel(localModel.trim())
    setMaxTokens(Math.max(1, localTokens))
    onClose()
  }, [localProvider, localKey, localBaseUrl, localModel, localTokens, setProvider, setApiKey, setBaseUrl, setModel, setMaxTokens, onClose])

  const handleSelectModel = useCallback((m: string) => {
    setLocalModel(m)
    setShowSuggestions(false)
    modelInputRef.current?.focus()
  }, [])

  const handleAddFunction = useCallback(() => {
    if (!newFnName.trim() || !newFnPrompt.trim()) return
    const fn: CustomFunction = {
      id: crypto.randomUUID(),
      name: newFnName.trim(),
      prompt: newFnPrompt.trim(),
      category: 'custom',
      needsSelection: newFnNeedsSelection,
    }
    addCustomFunction(fn)
    setNewFnName('')
    setNewFnPrompt('')
    setNewFnNeedsSelection(true)
  }, [newFnName, newFnPrompt, newFnNeedsSelection, addCustomFunction])

  // Close suggestions on outside click
  useEffect(() => {
    if (!showSuggestions) return
    const onClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        modelInputRef.current &&
        !modelInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [showSuggestions])

  const inputCls = 'rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition-all duration-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/20'
  const labelCls = 'text-xs font-medium text-gray-600 dark:text-gray-400'
  const hintCls = 'text-[11px] text-gray-400 dark:text-gray-500'

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-115 rounded-xl border border-gray-200/80 bg-white p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800"
      onClose={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200/80 px-5 py-3 dark:border-gray-700/60">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Settings</h2>
        <button
          type="button"
          aria-label="Close settings"
          className="rounded-md p-1 text-gray-400 transition-all duration-150 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
          onClick={onClose}
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200/80 dark:border-gray-700/60" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'provider'}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-all duration-150 ${tab === 'provider' ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          onClick={() => setTab('provider')}
        >
          Provider & Model
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'functions'}
          className={`flex-1 px-4 py-2 text-xs font-medium transition-all duration-150 ${tab === 'functions' ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          onClick={() => setTab('functions')}
        >
          Custom Functions
        </button>
      </div>

      {tab === 'provider' && (
        <div className="flex flex-col gap-4 px-5 py-4">
          {/* Provider */}
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Provider</span>
            <select
              value={localProvider}
              onChange={(e) => handleProviderChange(e.target.value as ProviderId)}
              className={inputCls}
            >
              {PROVIDER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>

          {/* API Key */}
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>API Key {!preset.keyRequired && <span className="font-normal text-gray-400">(optional)</span>}</span>
            <input
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder={preset.keyPlaceholder}
              className={inputCls}
            />
            <span className={hintCls}>
              Stored in localStorage, never sent to our servers.
            </span>
          </label>

          {/* Base URL */}
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Base URL</span>
            <input
              type="text"
              value={localBaseUrl}
              onChange={(e) => setLocalBaseUrl(e.target.value)}
              placeholder={preset.defaultBaseUrl || 'https://your-api.example.com'}
              className={inputCls}
            />
            <span className={hintCls}>
              {localProvider === 'anthropic'
                ? 'Uses /v1/messages (Anthropic native). Change for proxy providers.'
                : 'Uses /v1/chat/completions (OpenAI-compatible format).'}
            </span>
            {localBaseUrl && /localhost|127\.0\.0\.1/i.test(localBaseUrl) && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400">
                Local servers need CORS enabled for browser access.
                {localBaseUrl.includes('litellm') || localBaseUrl.includes(':4000') || localBaseUrl.includes(':6655')
                  ? ' For LiteLLM: litellm --cors_allow_origin "*"'
                  : localProvider === 'ollama' || localBaseUrl.includes(':11434')
                    ? ' Ollama supports CORS by default.'
                    : ' Configure your server to send Access-Control-Allow-Origin headers.'}
              </span>
            )}
          </label>

          {/* Model with autocomplete */}
          <div className="relative flex flex-col gap-1.5">
            <span className={labelCls}>Model</span>
            <input
              ref={modelInputRef}
              type="text"
              value={localModel}
              onChange={(e) => {
                setLocalModel(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={preset.defaultModel || 'model-name'}
              className={inputCls}
            />
            {showSuggestions && modelSuggestions.length > 0 && (
              <ul
                ref={suggestionsRef}
                role="listbox"
                aria-label="Model suggestions"
                className="absolute left-0 top-full z-10 mt-0.5 max-h-40 w-full overflow-y-auto rounded-md border border-gray-200/80 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
              >
                {modelSuggestions.map((m) => (
                  <li key={m}>
                    <button
                      type="button"
                      className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectModel(m)}
                    >
                      {m}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <span className={hintCls}>
              Type any model name or pick from suggestions.
            </span>
          </div>

          {/* Max Tokens */}
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Max Tokens</span>
            <input
              type="number"
              min={1}
              value={localTokens}
              onChange={(e) => setLocalTokens(Number(e.target.value))}
              className={inputCls}
            />
          </label>
        </div>
      )}

      {tab === 'functions' && (
        <div className="flex flex-col gap-4 px-5 py-4">
          {/* Existing custom functions */}
          {customFunctions.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className={labelCls}>Saved Functions</span>
              {customFunctions.map((fn) => (
                <div key={fn.id} className="flex items-start gap-2 rounded border border-gray-200 p-2 dark:border-gray-600">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{fn.name}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] text-gray-500 dark:text-gray-400">{fn.prompt}</div>
                    <div className="mt-0.5 text-[10px] text-gray-400">
                      {fn.needsSelection ? 'Requires selection' : 'No selection needed'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    onClick={() => removeCustomFunction(fn.id)}
                    title="Delete"
                    aria-label={`Delete ${fn.name}`}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New function form */}
          <div className="flex flex-col gap-2">
            <span className={labelCls}>Add New Function</span>
            <input
              type="text"
              value={newFnName}
              onChange={(e) => setNewFnName(e.target.value)}
              placeholder="Function name (e.g. Make it punchy)"
              className={inputCls}
            />
            <textarea
              value={newFnPrompt}
              onChange={(e) => setNewFnPrompt(e.target.value)}
              placeholder="Prompt template (e.g. Rewrite the following text to be punchy and engaging)"
              rows={3}
              className={`${inputCls} resize-none`}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newFnNeedsSelection}
                onChange={(e) => setNewFnNeedsSelection(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Requires text selection</span>
            </label>
            <button
              type="button"
              disabled={!newFnName.trim() || !newFnPrompt.trim()}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
              onClick={handleAddFunction}
            >
              Add Function
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-200/80 px-5 py-3 dark:border-gray-700/60">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
          onClick={() => {
            onClose()
            useShortcutsStore.getState().setOpen(true)
          }}
        >
          <Keyboard size={14} strokeWidth={1.5} />
          Keyboard Shortcuts
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            onClick={onClose}
          >
            Cancel
          </button>
          {tab === 'provider' && (
            <button
              type="button"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-blue-500"
              onClick={handleSave}
            >
              Save
            </button>
          )}
        </div>
      </div>
    </dialog>
  )
}

export function SettingsDialog() {
  const open = useAIStore((s) => s.settingsOpen)
  const setOpen = useAIStore((s) => s.setSettingsOpen)
  const handleClose = useCallback(() => setOpen(false), [setOpen])

  if (!open) return null
  return <SettingsDialogInner onClose={handleClose} />
}
