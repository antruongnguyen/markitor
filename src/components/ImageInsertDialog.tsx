import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { EditorView } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'
import { Link, Upload, X } from 'lucide-react'
import { readAsDataURL, IMAGE_SIZE_WARN_BYTES } from '../utils/imageHandler'

type ImageInsertDialogProps = {
  anchorRef: React.RefObject<HTMLElement | null>
  getView: () => EditorView | null
  onClose: () => void
}

type Mode = 'url' | 'upload'

export function ImageInsertDialog({ anchorRef, getView, onClose }: ImageInsertDialogProps) {
  const ref = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [mode, setMode] = useState<Mode>('url')
  const [imageUrl, setImageUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [sizeWarning, setSizeWarning] = useState<string | null>(null)
  const [urlError, setUrlError] = useState(false)

  // Position the dialog below the anchor button
  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left })
  }, [anchorRef])

  // Focus URL input on open
  useEffect(() => {
    if (pos && mode === 'url') {
      urlInputRef.current?.focus()
    }
  }, [pos, mode])

  // Click outside and Escape to close
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [onClose, anchorRef])

  // Try to preview URL images
  useEffect(() => {
    if (mode !== 'url' || !imageUrl.trim()) {
      if (mode === 'url') {
        setPreviewSrc(null)
        setUrlError(false)
      }
      return
    }
    const img = new Image()
    img.onload = () => {
      setPreviewSrc(imageUrl)
      setUrlError(false)
    }
    img.onerror = () => {
      setPreviewSrc(null)
      setUrlError(true)
    }
    img.src = imageUrl
  }, [imageUrl, mode])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Pre-fill alt text from filename
    setAltText(file.name.replace(/\.[^.]+$/, ''))

    // Size warning
    if (file.size > IMAGE_SIZE_WARN_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      setSizeWarning(`${file.name} is ${sizeMB} MB — large images increase file size`)
    } else {
      setSizeWarning(null)
    }

    const dataUrl = await readAsDataURL(file)
    setPreviewSrc(dataUrl)
    setImageUrl(dataUrl)
  }, [])

  const handleInsert = useCallback(() => {
    const src = imageUrl.trim()
    if (!src) return

    const view = getView()
    if (!view) return

    const alt = altText.trim() || 'image'
    const markdown = `![${alt}](${src})`
    const { state } = view
    const range = state.selection.main

    view.dispatch({
      changes: { from: range.from, to: range.to, insert: markdown },
      selection: EditorSelection.single(range.from + markdown.length),
      scrollIntoView: true,
    })
    view.focus()
    onClose()
  }, [imageUrl, altText, getView, onClose])

  const canInsert = imageUrl.trim().length > 0

  if (!pos) return null

  const tabClass = (active: boolean) =>
    `flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
      active
        ? 'bg-white text-gray-800 shadow-sm dark:bg-gray-700 dark:text-gray-100'
        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
    }`

  return createPortal(
    <div
      ref={ref}
      className="fixed z-50 w-72 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800"
      style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Insert Image</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="mx-3 mt-2 flex gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-700/50">
        <button type="button" className={tabClass(mode === 'url')} onClick={() => setMode('url')}>
          <Link size={12} className="mr-1 inline" />
          URL
        </button>
        <button type="button" className={tabClass(mode === 'upload')} onClick={() => setMode('upload')}>
          <Upload size={12} className="mr-1 inline" />
          Upload
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        {/* URL Mode */}
        {mode === 'url' && (
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
              Image URL
            </label>
            <input
              ref={urlInputRef}
              type="url"
              placeholder="https://example.com/image.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canInsert) handleInsert()
              }}
              className={`w-full rounded-md border px-2.5 py-1.5 text-xs outline-none transition-colors ${
                urlError
                  ? 'border-red-300 bg-red-50 dark:border-red-500/50 dark:bg-red-900/20'
                  : 'border-gray-200 bg-gray-50 focus:border-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:focus:border-blue-500'
              } text-gray-800 dark:text-gray-100`}
            />
            {urlError && (
              <p className="mt-1 text-[10px] text-red-500 dark:text-red-400">Could not load image from URL</p>
            )}
          </div>
        )}

        {/* Upload Mode */}
        {mode === 'upload' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-xs text-gray-500 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
            >
              <Upload size={14} />
              Choose image file
            </button>
            {sizeWarning && (
              <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400">{sizeWarning}</p>
            )}
          </div>
        )}

        {/* Preview */}
        {previewSrc && (
          <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50">
            <img
              src={previewSrc}
              alt="Preview"
              className="max-h-32 w-full object-contain"
            />
          </div>
        )}

        {/* Alt Text */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Alt text
          </label>
          <input
            type="text"
            placeholder="Describe the image"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canInsert) handleInsert()
            }}
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-800 outline-none transition-colors focus:border-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canInsert}
            onClick={handleInsert}
            className="flex-1 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Insert
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
