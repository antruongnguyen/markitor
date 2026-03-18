import { useState, useRef, useEffect } from 'react'
import { useThemeStore } from '../store/themeStore'
import { editorThemes } from '../utils/editorThemes'
import type { EditorThemeId } from '../utils/editorThemes'

export function ThemePicker() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const editorTheme = useThemeStore((s) => s.editorTheme)
  const setEditorTheme = useThemeStore((s) => s.setEditorTheme)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const current = editorThemes.find((t) => t.id === editorTheme)!

  function handleSelect(id: EditorThemeId) {
    setEditorTheme(id)
    setOpen(false)
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        title="Editor theme"
        className="flex h-7 items-center gap-1.5 rounded-md px-1.5 text-xs text-gray-500 transition-all duration-150 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
        onMouseDown={(e) => {
          e.preventDefault()
          setOpen(!open)
        }}
      >
        <span
          className="inline-block h-3 w-3 rounded-sm border border-gray-200 dark:border-gray-600"
          style={{ backgroundColor: current.swatches[0] }}
        />
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200/80 bg-white p-1 shadow-lg dark:border-gray-700/60 dark:bg-gray-800" style={{ animation: 'scaleIn 0.15s ease-out' }}>
          <div className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Editor Theme
          </div>
          {editorThemes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs transition-all duration-150 ${
                theme.id === editorTheme
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]'
              }`}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(theme.id)
              }}
            >
              {/* Color swatches */}
              <div className="flex shrink-0 overflow-hidden rounded-sm border border-gray-200 dark:border-gray-600">
                {theme.swatches.map((color, i) => (
                  <span
                    key={i}
                    className="inline-block h-4 w-3"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="flex-1">{theme.label}</span>
              {theme.id === editorTheme && (
                <span className="text-blue-500 dark:text-blue-400">&#10003;</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
