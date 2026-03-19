import { useState, useRef, useCallback, type ReactNode } from 'react'
import { useLayoutStore } from '../store/layoutStore'

type SplitPaneProps = {
  left: ReactNode
  right: ReactNode
  minLeftWidth?: number
  minRightWidth?: number
}

export function SplitPane({
  left,
  right,
  minLeftWidth = 200,
  minRightWidth = 200,
}: SplitPaneProps) {
  const mode = useLayoutStore((s) => s.mode)
  const [leftWidthPercent, setLeftWidthPercent] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const totalWidth = rect.width
      const x = e.clientX - rect.left
      const minLeft = (minLeftWidth / totalWidth) * 100
      const maxLeft = 100 - (minRightWidth / totalWidth) * 100
      const percent = Math.min(maxLeft, Math.max(minLeft, (x / totalWidth) * 100))
      setLeftWidthPercent(percent)
    }

    const onMouseUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [minLeftWidth, minRightWidth])

  if (mode === 'editor') {
    return (
      <div className="h-full w-full">
        {left}
      </div>
    )
  }

  if (mode === 'preview') {
    return (
      <div className="h-full w-full">
        {right}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex h-full w-full">
      <div
        className="h-full overflow-hidden transition-[width] duration-200 ease-in-out"
        style={{ width: `${leftWidthPercent}%` }}
      >
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        className="group relative h-full w-1 cursor-col-resize flex-shrink-0 bg-gray-200 transition-colors duration-150 hover:bg-blue-500 dark:bg-gray-700 dark:hover:bg-blue-400"
        onMouseDown={onMouseDown}
      >
        <div className="absolute inset-y-0 -left-0.5 -right-0.5" />
      </div>
      <div className="h-full overflow-hidden flex-1">
        {right}
      </div>
    </div>
  )
}

