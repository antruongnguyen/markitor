import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type TableGridPickerProps = {
  onSelect: (rows: number, cols: number) => void
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
}

const MAX_ROWS = 8
const MAX_COLS = 8

export function TableGridPicker({ onSelect, onClose, anchorRef }: TableGridPickerProps) {
  const [hoverRow, setHoverRow] = useState(0)
  const [hoverCol, setHoverCol] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // Calculate position from anchor element
  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left })
  }, [anchorRef])

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

  if (!pos) return null

  return createPortal(
    <div
      ref={ref}
      className="fixed z-50 rounded-md border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-600 dark:bg-gray-800"
      style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
    >
      <div className="mb-1.5 text-center text-xs text-gray-500 dark:text-gray-400">
        {hoverRow > 0 && hoverCol > 0
          ? `${hoverRow} × ${hoverCol} table`
          : 'Select table size'}
      </div>
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)` }}
      >
        {Array.from({ length: MAX_ROWS * MAX_COLS }, (_, idx) => {
          const row = Math.floor(idx / MAX_COLS) + 1
          const col = (idx % MAX_COLS) + 1
          const isActive = row <= hoverRow && col <= hoverCol
          return (
            <button
              key={idx}
              type="button"
              className={`h-4 w-4 rounded-sm border transition-colors ${
                isActive
                  ? 'border-blue-400 bg-blue-100 dark:border-blue-500 dark:bg-blue-900/40'
                  : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700'
              }`}
              onMouseEnter={() => {
                setHoverRow(row)
                setHoverCol(col)
              }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(row, col)}
            />
          )
        })}
      </div>
    </div>,
    document.body,
  )
}
