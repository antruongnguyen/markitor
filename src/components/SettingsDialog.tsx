import { useCallback, useState, useEffect, useRef } from 'react'
import { useAIStore, MODEL_SUGGESTIONS } from '../store/aiStore'

function SettingsDialogInner({ onClose }: { onClose: () => void }) {
  const apiKey = useAIStore((s) => s.apiKey)
  const setApiKey = useAIStore((s) => s.setApiKey)
  const baseUrl = useAIStore((s) => s.baseUrl)
  const setBaseUrl = useAIStore((s) => s.setBaseUrl)
  const model = useAIStore((s) => s.model)
  const setModel = useAIStore((s) => s.setModel)
  const maxTokens = useAIStore((s) => s.maxTokens)
  const setMaxTokens = useAIStore((s) => s.setMaxTokens)

  const [localKey, setLocalKey] = useState(apiKey)
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl)
  const [localModel, setLocalModel] = useState(model)
  const [localTokens, setLocalTokens] = useState(maxTokens)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const modelInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const filteredModels = localModel
    ? MODEL_SUGGESTIONS.filter((m) => m.includes(localModel.toLowerCase()))
    : MODEL_SUGGESTIONS

  const handleSave = useCallback(() => {
    setApiKey(localKey.trim())
    setBaseUrl(localBaseUrl.trim() || 'https://api.anthropic.com')
    setModel(localModel.trim())
    setMaxTokens(Math.max(1, localTokens))
    onClose()
  }, [localKey, localBaseUrl, localModel, localTokens, setApiKey, setBaseUrl, setModel, setMaxTokens, onClose])

  const handleSelectModel = useCallback((m: string) => {
    setLocalModel(m)
    setShowSuggestions(false)
    modelInputRef.current?.focus()
  }, [])

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

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-[420px] rounded-lg border border-gray-200 bg-white p-0 shadow-xl backdrop:bg-black/40 dark:border-gray-700 dark:bg-gray-800"
      onClose={onClose}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Settings</h2>
        <button
          type="button"
          className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
          onClick={onClose}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4">
        {/* API Key */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">API Key</span>
          <input
            type="password"
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder="sk-ant-..."
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-blue-400"
          />
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Stored in localStorage, never sent to our servers.
          </span>
        </label>

        {/* Base URL */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Base URL</span>
          <input
            type="text"
            value={localBaseUrl}
            onChange={(e) => setLocalBaseUrl(e.target.value)}
            placeholder="https://api.anthropic.com"
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-blue-400"
          />
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Change for Anthropic-compatible proxy providers. /v1/messages is appended automatically.
          </span>
        </label>

        {/* Model with autocomplete */}
        <div className="relative flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Model</span>
          <input
            ref={modelInputRef}
            type="text"
            value={localModel}
            onChange={(e) => {
              setLocalModel(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="claude-haiku-4-5-20251001"
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-blue-400"
          />
          {showSuggestions && filteredModels.length > 0 && (
            <ul
              ref={suggestionsRef}
              className="absolute left-0 top-full z-10 mt-0.5 max-h-40 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
            >
              {filteredModels.map((m) => (
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
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Type any model name or pick from suggestions.
          </span>
        </div>

        {/* Max Tokens — number input */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Max Tokens</span>
          <input
            type="number"
            min={1}
            value={localTokens}
            onChange={(e) => setLocalTokens(Number(e.target.value))}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-blue-400"
          />
        </label>
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
        <button
          type="button"
          className="rounded px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          onClick={handleSave}
        >
          Save
        </button>
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
