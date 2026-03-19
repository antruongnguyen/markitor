import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { EditorView } from '@codemirror/view'
import {
  SearchQuery,
  setSearchQuery,
  getSearchQuery,
  findNext,
  findPrevious,
  replaceNext,
  replaceAll,
  closeSearchPanel,
} from '@codemirror/search'
import {
  Search,
  Replace,
  ChevronUp,
  ChevronDown,
  X,
  CaseSensitive,
  Regex,
  ReplaceAll,
} from 'lucide-react'
import { useSearchStore } from '../store/searchStore'

function countMatches(
  text: string,
  search: string,
  caseSensitive: boolean,
  isRegex: boolean,
): number {
  if (!search) return 0
  try {
    const flags = 'g' + (caseSensitive ? '' : 'i')
    const pattern = isRegex
      ? search
      : search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(pattern, flags)
    const matches = text.match(re)
    return matches ? matches.length : 0
  } catch {
    return 0
  }
}

const iconBtn =
  'flex h-[26px] w-[26px] items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-200/80 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200'
const activeToggle =
  'flex h-[26px] w-[26px] items-center justify-center rounded transition-colors bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
const inputClass =
  'h-[26px] flex-1 min-w-0 rounded border bg-white px-2 text-[12px] text-gray-800 outline-none transition-colors border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400/20'

export function SearchPanelContent({ view }: { view: EditorView }) {
  const existing = getSearchQuery(view.state)
  const showReplace = useSearchStore((s) => s.showReplace)
  const toggleReplace = useSearchStore((s) => s.toggleReplace)

  const [searchText, setSearchText] = useState(existing.search || '')
  const [replaceText, setReplaceText] = useState(existing.replace || '')
  const [caseSensitive, setCaseSensitive] = useState(existing.caseSensitive)
  const [isRegex, setIsRegex] = useState(existing.regexp)
  const [matchCount, setMatchCount] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  // Focus search input on mount; pre-fill from selection
  useEffect(() => {
    searchRef.current?.focus()
    searchRef.current?.select()
    const sel = view.state.selection.main
    if (sel.from !== sel.to) {
      const selected = view.state.sliceDoc(sel.from, sel.to)
      if (!selected.includes('\n')) {
        setSearchText(selected)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Dispatch search query + count matches
  useEffect(() => {
    const query = new SearchQuery({
      search: searchText,
      replace: replaceText,
      caseSensitive,
      regexp: isRegex,
    })
    view.dispatch({ effects: setSearchQuery.of(query) })
    setMatchCount(
      countMatches(view.state.doc.toString(), searchText, caseSensitive, isRegex),
    )
  }, [view, searchText, replaceText, caseSensitive, isRegex])

  const handleClose = useCallback(() => {
    closeSearchPanel(view)
    view.focus()
  }, [view])

  const doFindNext = useCallback(() => findNext(view), [view])
  const doFindPrev = useCallback(() => findPrevious(view), [view])
  const doReplace = useCallback(() => replaceNext(view), [view])
  const doReplaceAll = useCallback(() => replaceAll(view), [view])

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) doFindPrev()
        else doFindNext()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    },
    [doFindNext, doFindPrev, handleClose],
  )

  const handleReplaceKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        doReplace()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    },
    [doReplace, handleClose],
  )

  const matchLabel = useMemo(() => {
    if (!searchText) return null
    return matchCount === 0 ? 'No results' : `${matchCount}`
  }, [searchText, matchCount])

  return (
    <div className="flex flex-col gap-1 px-2 py-1.5">
      {/* Search row */}
      <div className="flex items-center gap-1">
        {/* Toggle replace */}
        <button
          type="button"
          title={showReplace ? 'Hide replace' : 'Show replace (Ctrl+H)'}
          className={iconBtn}
          onClick={toggleReplace}
        >
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            className={`transition-transform duration-150 ${showReplace ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>

        {/* Search input */}
        <div className="relative flex flex-1 items-center">
          <Search
            size={13}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-2 text-gray-400 dark:text-gray-500"
          />
          <input
            ref={searchRef}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search…"
            className={inputClass + ' pl-7'}
          />
        </div>

        {/* Match count */}
        {matchLabel && (
          <span
            className={`shrink-0 text-[11px] tabular-nums ${matchCount === 0 ? 'text-red-400 dark:text-red-500' : 'text-gray-400 dark:text-gray-500'}`}
          >
            {matchLabel}
          </span>
        )}

        {/* Case sensitive */}
        <button
          type="button"
          title="Match case"
          className={caseSensitive ? activeToggle : iconBtn}
          onClick={() => setCaseSensitive(!caseSensitive)}
        >
          <CaseSensitive size={14} strokeWidth={1.5} />
        </button>

        {/* Regex */}
        <button
          type="button"
          title="Use regular expression"
          className={isRegex ? activeToggle : iconBtn}
          onClick={() => setIsRegex(!isRegex)}
        >
          <Regex size={14} strokeWidth={1.5} />
        </button>

        <div className="mx-0.5 h-4 w-px bg-gray-200 dark:bg-gray-600" />

        {/* Prev / Next */}
        <button
          type="button"
          title="Previous match (Shift+Enter)"
          className={iconBtn}
          onClick={doFindPrev}
        >
          <ChevronUp size={14} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          title="Next match (Enter)"
          className={iconBtn}
          onClick={doFindNext}
        >
          <ChevronDown size={14} strokeWidth={1.5} />
        </button>

        {/* Close */}
        <button
          type="button"
          title="Close (Escape)"
          className={iconBtn}
          onClick={handleClose}
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Replace row */}
      {showReplace && (
        <div className="flex items-center gap-1 pl-[30px]">
          <div className="relative flex flex-1 items-center">
            <Replace
              size={13}
              strokeWidth={1.5}
              className="pointer-events-none absolute left-2 text-gray-400 dark:text-gray-500"
            />
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={handleReplaceKeyDown}
              placeholder="Replace…"
              className={inputClass + ' pl-7'}
            />
          </div>
          <button type="button" title="Replace" className={iconBtn} onClick={doReplace}>
            <Replace size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            title="Replace all"
            className={iconBtn}
            onClick={doReplaceAll}
          >
            <ReplaceAll size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  )
}
