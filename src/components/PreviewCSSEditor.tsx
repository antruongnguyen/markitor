import { useCallback, useEffect, useRef, useState } from 'react'
import { X, RotateCcw, Check } from 'lucide-react'
import { usePreviewStyleStore } from '../store/previewStyleStore'
import { PREVIEW_PRESETS, getPresetById } from '../utils/previewStyles'

function PreviewCSSEditorInner({ onClose }: { onClose: () => void }) {
  const customCSS = usePreviewStyleStore((s) => s.customCSS)
  const activePreset = usePreviewStyleStore((s) => s.activePreset)
  const setCustomCSS = usePreviewStyleStore((s) => s.setCustomCSS)
  const setActivePreset = usePreviewStyleStore((s) => s.setActivePreset)
  const reset = usePreviewStyleStore((s) => s.reset)

  const [localCSS, setLocalCSS] = useState(customCSS)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  // Live-apply CSS as user types
  useEffect(() => {
    setCustomCSS(localCSS)
  }, [localCSS, setCustomCSS])

  const handlePresetClick = useCallback(
    (presetId: string) => {
      const preset = getPresetById(presetId)
      if (!preset) return
      if (activePreset === presetId) {
        // Deselect preset
        setActivePreset(null)
        setLocalCSS('')
        return
      }
      setActivePreset(presetId)
      setLocalCSS(preset.css)
    },
    [activePreset, setActivePreset],
  )

  const handleReset = useCallback(() => {
    reset()
    setLocalCSS('')
  }, [reset])

  const inputCls =
    'rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none transition-all duration-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/20'
  const labelCls = 'text-xs font-medium text-gray-600 dark:text-gray-400'

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-[520px] rounded-xl border border-gray-200/80 bg-white p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800"
      onClose={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200/80 px-5 py-3 dark:border-gray-700/60">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Preview Style</h2>
        <button
          type="button"
          className="rounded-md p-1 text-gray-400 transition-all duration-150 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
          onClick={onClose}
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4">
        {/* Presets */}
        <div className="flex flex-col gap-1.5">
          <span className={labelCls}>Style Presets</span>
          <div className="grid grid-cols-2 gap-2">
            {PREVIEW_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-all duration-150 ${
                  activePreset === preset.id
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-white/[0.03]'
                }`}
                onClick={() => handlePresetClick(preset.id)}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{preset.name}</span>
                  {activePreset === preset.id && <Check size={14} className="text-blue-500 dark:text-blue-400" />}
                </div>
                <span className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{preset.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CSS Editor */}
        <div className="flex flex-col gap-1.5">
          <span className={labelCls}>Custom CSS</span>
          <textarea
            ref={textareaRef}
            value={localCSS}
            onChange={(e) => {
              setLocalCSS(e.target.value)
              setActivePreset(null)
            }}
            placeholder={`.preview-content {\n  font-family: serif;\n  line-height: 1.8;\n}`}
            rows={10}
            spellCheck={false}
            className={`${inputCls} resize-none font-mono text-xs leading-relaxed`}
          />
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Target <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">.preview-content</code> and its children. Changes apply in real-time.
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between border-t border-gray-200/80 px-5 py-3 dark:border-gray-700/60">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          onClick={handleReset}
        >
          <RotateCcw size={14} strokeWidth={1.5} />
          Reset to Default
        </button>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-blue-500"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </dialog>
  )
}

export function PreviewCSSEditorDialog() {
  const open = usePreviewStyleStore((s) => s.editorOpen)
  const setOpen = usePreviewStyleStore((s) => s.setEditorOpen)
  const handleClose = useCallback(() => setOpen(false), [setOpen])

  if (!open) return null
  return <PreviewCSSEditorInner onClose={handleClose} />
}
