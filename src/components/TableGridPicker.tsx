import { useEffect, useRef, useState } from 'react'

type TableGridPickerProps = {
  onSelect: (rows: number, cols: number) => void
  onClose: () => void
}

const MAX_ROWS = 8
const MAX_COLS = 8

export function TableGridPicker({ onSelect, onClose }: TableGridPickerProps) {
  const [hoverRow, setHoverRow] = useState(0)
  const [hoverCol, setHoverCol] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
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
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-1 rounded-md border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-600 dark:bg-gray-800"
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
    </div>
  )
}
