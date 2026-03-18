import { useState, useRef, useCallback, type ReactNode } from 'react'

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

  return (
    <div ref={containerRef} className="flex h-full w-full">
      <div className="h-full overflow-hidden" style={{ width: `${leftWidthPercent}%` }}>
        {left}
      </div>
      <div
        className="h-full w-1.5 cursor-col-resize bg-gray-700 hover:bg-blue-500 transition-colors flex-shrink-0"
        onMouseDown={onMouseDown}
      />
      <div className="h-full overflow-hidden flex-1">
        {right}
      </div>
    </div>
  )
}
