import { useCallback, useRef } from 'react'
import { X, Plus } from 'lucide-react'
import { useTabStore, type Tab } from '../store/tabStore'

function TabItem({
  tab,
  isActive,
  onSwitch,
  onClose,
}: {
  tab: Tab
  isActive: boolean
  onSwitch: () => void
  onClose: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      className={`group flex h-full max-w-[180px] items-center gap-1.5 border-r border-gray-200 px-3 text-xs transition-colors dark:border-gray-700 ${
        isActive
          ? 'bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-850'
      }`}
      onClick={onSwitch}
      title={tab.fileName}
    >
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
        className="ml-auto shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100 dark:hover:bg-gray-600"
        onClick={onClose}
        title="Close tab"
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
  const addTab = useTabStore((s) => s.addTab)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation()
      closeTab(tabId)
    },
    [closeTab],
  )

  const handleNewTab = useCallback(() => {
    addTab()
  }, [addTab])

  return (
    <div className="flex h-8 shrink-0 items-stretch border-b border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
      <div ref={scrollRef} className="flex flex-1 items-stretch overflow-x-auto">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSwitch={() => switchTab(tab.id)}
            onClose={(e) => handleClose(e, tab.id)}
          />
        ))}
      </div>
      <button
        type="button"
        className="flex w-8 shrink-0 items-center justify-center border-l border-gray-200 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 dark:border-gray-700 dark:hover:bg-gray-750 dark:hover:text-gray-300"
        onClick={handleNewTab}
        title="New tab"
      >
        <Plus size={16} strokeWidth={1.5} />
      </button>
    </div>
  )
}
