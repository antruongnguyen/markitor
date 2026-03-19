import { useCallback, useRef, useState } from 'react'
import { X, Plus } from 'lucide-react'
import { useTabStore, type Tab } from '../store/tabStore'
import { useTemplateGalleryStore } from '../store/templateGalleryStore'
import { TemplateGallery } from './TemplateGallery'

function TabItem({
  tab,
  index,
  isActive,
  onSwitch,
  onClose,
  onMiddleClick,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: {
  tab: Tab
  index: number
  isActive: boolean
  onSwitch: () => void
  onClose: (e: React.MouseEvent) => void
  onMiddleClick: (e: React.MouseEvent) => void
  dragOverIndex: number | null
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  onDrop: (e: React.DragEvent, index: number) => void
}) {
  return (
    <button
      type="button"
      draggable
      aria-current={isActive ? 'page' : undefined}
      className={`group relative flex h-full max-w-45 items-center gap-1.5 px-3 text-xs transition-all duration-150 ${
        isActive
          ? 'bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-300'
      } ${dragOverIndex === index ? 'border-l-2 border-l-blue-500' : ''}`}
      onClick={onSwitch}
      onMouseDown={onMiddleClick}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
      title={tab.fileName}
    >
      {isActive && (
        <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
      )}
      <span className="truncate">
        {tab.fileName}
      </span>
      {tab.isDirty && (
        <span className="ml-0.5 shrink-0 text-[8px] text-blue-500" title="Unsaved changes">
          ●
        </span>
      )}
      <span
        role="button"
        tabIndex={-1}
        className="ml-auto shrink-0 rounded p-0.5 opacity-0 transition-all duration-150 hover:bg-gray-200 group-hover:opacity-100 dark:hover:bg-gray-600"
        onClick={onClose}
        title="Close tab"
        aria-label="Close tab"
      >
        <X size={12} strokeWidth={1.5} />
      </span>
    </button>
  )
}

export function TabBar() {
  const tabs = useTabStore((s) => s.tabs)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const switchTab = useTabStore((s) => s.switchTab)
  const closeTab = useTabStore((s) => s.closeTab)
  const reorderTabs = useTabStore((s) => s.reorderTabs)
  const scrollRef = useRef<HTMLDivElement>(null)
  const showTemplates = useTemplateGalleryStore((s) => s.open)
  const setShowTemplates = useTemplateGalleryStore((s) => s.setOpen)

  // Drag state
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleClose = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation()
      closeTab(tabId)
    },
    [closeTab],
  )

  const handleMiddleClick = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      if (e.button === 1) {
        e.preventDefault()
        closeTab(tabId)
      }
    },
    [closeTab],
  )

  const handleNewTab = useCallback(() => {
    setShowTemplates(true)
  }, [setShowTemplates])

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 0, 0)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault()
      const fromIndex = dragIndexRef.current
      if (fromIndex !== null && fromIndex !== toIndex) {
        reorderTabs(fromIndex, toIndex)
      }
      dragIndexRef.current = null
      setDragOverIndex(null)
    },
    [reorderTabs],
  )

  return (
    <>
      <div className="flex h-8 shrink-0 items-stretch border-b border-gray-200/80 bg-gray-100/80 dark:border-gray-700/60 dark:bg-gray-800/80">
        <div ref={scrollRef} className="flex flex-1 items-stretch overflow-x-auto">
          {tabs.map((tab, index) => (
            <TabItem
              key={tab.id}
              tab={tab}
              index={index}
              isActive={tab.id === activeTabId}
              onSwitch={() => switchTab(tab.id)}
              onClose={(e) => handleClose(e, tab.id)}
              onMiddleClick={(e) => handleMiddleClick(e, tab.id)}
              dragOverIndex={dragOverIndex}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
            />
          ))}
        </div>
        <button
          type="button"
          className="flex w-8 shrink-0 items-center justify-center border-l border-gray-200/80 text-gray-400 transition-all duration-150 hover:bg-gray-50 hover:text-gray-600 dark:border-gray-700/60 dark:hover:bg-white/5 dark:hover:text-gray-300"
          onClick={handleNewTab}
          title="New tab from template"
          aria-label="New tab"
        >
          <Plus size={16} strokeWidth={1.5} />
        </button>
      </div>
      {showTemplates && (
        <TemplateGallery onClose={() => setShowTemplates(false)} />
      )}
    </>
  )
}
