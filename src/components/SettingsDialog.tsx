import { useCallback, useState, useEffect, useRef } from 'react'
import { useAIStore, type AIModel } from '../store/aiStore'

function SettingsDialogInner({ onClose }: { onClose: () => void }) {
  const apiKey = useAIStore((s) => s.apiKey)
  const setApiKey = useAIStore((s) => s.setApiKey)
  const model = useAIStore((s) => s.model)
  const setModel = useAIStore((s) => s.setModel)
  const maxTokens = useAIStore((s) => s.maxTokens)
  const setMaxTokens = useAIStore((s) => s.setMaxTokens)

  const [localKey, setLocalKey] = useState(apiKey)
  const [localTokens, setLocalTokens] = useState(maxTokens)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const handleSave = useCallback(() => {
    setApiKey(localKey.trim())
    setMaxTokens(localTokens)
    onClose()
  }, [localKey, localTokens, setApiKey, setMaxTokens, onClose])

  const handleModelChange = useCallback(
    (m: AIModel) => {
      setModel(m)
    },
    [setModel],
  )

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
            Your key is stored in localStorage and never sent to our servers.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Model</span>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                model === 'claude-haiku-4-5-20251001'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleModelChange('claude-haiku-4-5-20251001')}
            >
              Haiku 4.5
              <span className="block text-[10px] font-normal opacity-70">Fast</span>
            </button>
            <button
              type="button"
              className={`flex-1 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                model === 'claude-sonnet-4-6-20250131'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleModelChange('claude-sonnet-4-6-20250131')}
            >
              Sonnet 4.6
              <span className="block text-[10px] font-normal opacity-70">Quality</span>
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Max Tokens: {localTokens}
          </span>
          <input
            type="range"
            min={256}
            max={4096}
            step={256}
            value={localTokens}
            onChange={(e) => setLocalTokens(Number(e.target.value))}
            className="w-full accent-blue-600 dark:accent-blue-400"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>256</span>
            <span>4096</span>
          </div>
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
