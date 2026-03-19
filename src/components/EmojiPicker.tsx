import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  type EmojiCategory,
  type EmojiEntry,
  CATEGORIES,
  getEmojisByCategory,
  searchEmojis,
  getRecentEmojis,
  addRecentEmoji,
} from '../utils/emojiData'

type EmojiPickerProps = {
  anchorRef: React.RefObject<HTMLElement | null>
  onSelect: (emoji: string) => void
  onClose: () => void
}

const CATEGORY_ICONS: Record<EmojiCategory, string> = {
  Smileys: '😊',
  People: '👋',
  Nature: '🌿',
  Food: '🍔',
  Activities: '⚽',
  Travel: '✈️',
  Objects: '💡',
  Symbols: '❤️',
}

export function EmojiPicker({ anchorRef, onSelect, onClose }: EmojiPickerProps) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<EmojiCategory | 'Recent'>('Smileys')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [recentEmojis, setRecentEmojis] = useState(() => getRecentEmojis())
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // Measure anchor position before paint (legitimate DOM measurement pattern)
  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const pickerWidth = 352
    const pickerHeight = 400

    let left = rect.left
    let top = rect.bottom + 4

    // Keep within viewport horizontally
    if (left + pickerWidth > window.innerWidth - 8) {
      left = window.innerWidth - pickerWidth - 8
    }
    if (left < 8) left = 8

    // If not enough room below, show above
    if (top + pickerHeight > window.innerHeight - 8) {
      top = rect.top - pickerHeight - 4
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- DOM measurement in layout effect is the standard approach
    setPos({ top, left })
  }, [anchorRef])

  // Focus search input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on click outside / Escape
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

  const byCategory = useMemo(() => getEmojisByCategory(), [])

  const searchResults = useMemo(() => {
    if (!query.trim()) return null
    return searchEmojis(query)
  }, [query])

  const displayEmojis: EmojiEntry[] | null = useMemo(() => {
    if (searchResults) return searchResults
    if (activeCategory === 'Recent') return null // handled separately
    return byCategory.get(activeCategory as EmojiCategory) ?? []
  }, [searchResults, activeCategory, byCategory])

  const handleSelect = useCallback(
    (emoji: string) => {
      addRecentEmoji(emoji)
      setRecentEmojis(getRecentEmojis())
      onSelect(emoji)
    },
    [onSelect],
  )

  const handleCategoryClick = useCallback((cat: EmojiCategory | 'Recent') => {
    setActiveCategory(cat)
    setQuery('')
    gridRef.current?.scrollTo(0, 0)
  }, [])

  if (!pos) return null

  const isSearching = !!query.trim()
  const hasRecent = recentEmojis.length > 0

  return createPortal(
    <div
      ref={ref}
      className="fixed z-50 flex w-[352px] flex-col overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-xl dark:border-gray-700/60 dark:bg-gray-800"
      style={{ top: `${pos.top}px`, left: `${pos.left}px`, height: '400px' }}
    >
      {/* Search */}
      <div className="border-b border-gray-200/80 px-3 py-2 dark:border-gray-700/60">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
          }}
          placeholder="Search emoji..."
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-300 focus:ring-1 focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        />
      </div>

      {/* Category tabs */}
      {!isSearching && (
        <div className="flex shrink-0 gap-0.5 border-b border-gray-200/80 px-1.5 py-1 dark:border-gray-700/60">
          {hasRecent && (
            <button
              type="button"
              title="Recently used"
              className={`flex h-7 w-7 items-center justify-center rounded text-sm transition-colors ${
                activeCategory === 'Recent'
                  ? 'bg-blue-50 dark:bg-blue-500/10'
                  : 'hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleCategoryClick('Recent')}
            >
              🕐
            </button>
          )}
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              title={cat}
              className={`flex h-7 w-7 items-center justify-center rounded text-sm transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-50 dark:bg-blue-500/10'
                  : 'hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleCategoryClick(cat)}
            >
              {CATEGORY_ICONS[cat]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div ref={gridRef} className="custom-scrollbar flex-1 overflow-y-auto px-2 py-1.5">
        {isSearching ? (
          <>
            {searchResults && searchResults.length > 0 ? (
              <EmojiGrid emojis={searchResults} onSelect={handleSelect} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                No emojis found
              </div>
            )}
          </>
        ) : activeCategory === 'Recent' ? (
          recentEmojis.length > 0 ? (
            <div>
              <div className="mb-1 px-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Recently Used
              </div>
              <div className="grid grid-cols-8 gap-0.5">
                {recentEmojis.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-xl transition-colors hover:bg-gray-100 active:scale-90 dark:hover:bg-white/5"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(emoji)}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : null
        ) : (
          displayEmojis && <EmojiGrid emojis={displayEmojis} onSelect={handleSelect} />
        )}
      </div>
    </div>,
    document.body,
  )
}

function EmojiGrid({ emojis, onSelect }: { emojis: EmojiEntry[]; onSelect: (emoji: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-0.5">
      {emojis.map((entry, i) => (
        <button
          key={`${entry.emoji}-${i}`}
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md text-xl transition-colors hover:bg-gray-100 active:scale-90 dark:hover:bg-white/5"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(entry.emoji)}
          title={entry.name}
        >
          {entry.emoji}
        </button>
      ))}
    </div>
  )
}
