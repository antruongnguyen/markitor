import { useCallback, useEffect, useRef, useState } from 'react'
import { Type, Minimize2 } from 'lucide-react'
import { useFocusModeStore } from '../store/focusModeStore'

export function FocusModeOverlay() {
  const exit = useFocusModeStore((s) => s.exit)
  const typewriterMode = useFocusModeStore((s) => s.typewriterMode)
  const toggleTypewriter = useFocusModeStore((s) => s.toggleTypewriter)
  const [visible, setVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setVisible(false), 3000)
  }, [])

  const showControls = useCallback(() => {
    setVisible(true)
    scheduleHide()
  }, [scheduleHide])

  // Auto-hide after 3s on mount
  useEffect(() => {
    scheduleHide()
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [scheduleHide])

  // Show on mouse move
  useEffect(() => {
    const onMove = () => showControls()
    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [showControls])

  return (
    <div
      className={`pointer-events-none fixed right-4 top-4 z-50 flex items-center gap-2 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <button
        type="button"
        className={`pointer-events-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm transition-colors ${
          typewriterMode
            ? 'bg-blue-600/80 text-white hover:bg-blue-500/80'
            : 'bg-gray-900/10 text-gray-700 hover:bg-gray-900/20 hover:text-gray-900 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20 dark:hover:text-white'
        }`}
        onClick={toggleTypewriter}
        title="Toggle typewriter mode"
      >
        <Type size={14} strokeWidth={1.5} />
        Typewriter
      </button>
      <button
        type="button"
        className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-gray-900/10 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-lg backdrop-blur-sm transition-colors hover:bg-gray-900/20 hover:text-gray-900 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20 dark:hover:text-white"
        onClick={exit}
        title="Exit focus mode (Escape)"
      >
        <Minimize2 size={14} strokeWidth={1.5} />
        Exit Focus
      </button>
    </div>
  )
}
