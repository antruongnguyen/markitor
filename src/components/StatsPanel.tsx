import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X,
  Clock,
  Mic,
  BookOpen,
  Type,
  Hash,
  AlignLeft,
  BarChart3,
} from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import { useStatsStore } from '../store/statsStore'
import { computeStats, gradeLabel, readingEaseLabel, formatTime, type TextStats } from '../utils/textStats'

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-xs font-medium tabular-nums text-gray-700 dark:text-gray-200">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Clock; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-200/60 px-3 py-2.5 last:border-b-0 dark:border-gray-700/40">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon size={12} strokeWidth={1.5} aria-hidden="true" className="text-gray-400 dark:text-gray-500" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function ReadabilityMeter({ score, label }: { score: number; label: string }) {
  // Map 0-100 score to a color: red -> yellow -> green
  const pct = Math.min(100, Math.max(0, score))
  const hue = (pct / 100) * 120 // 0=red, 60=yellow, 120=green
  return (
    <div className="mt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">Reading Ease</span>
        <span className="font-medium text-gray-700 dark:text-gray-200">{score.toFixed(1)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: `hsl(${hue}, 70%, 50%)` }}
        />
      </div>
      <div className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{label}</div>
    </div>
  )
}

function TopWordBar({ word, count, max }: { word: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-20 truncate text-xs text-gray-600 dark:text-gray-300">{word}</span>
      <div className="flex flex-1 items-center gap-1.5">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300 dark:bg-blue-400"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-5 text-right text-[10px] tabular-nums text-gray-400 dark:text-gray-500">
          {count}
        </span>
      </div>
    </div>
  )
}

export function StatsPanel() {
  const close = useStatsStore((s) => s.setOpen)
  const content = useEditorStore((s) => s.content)
  const debouncedContent = useDebounced(content, 300)
  const scrollRef = useRef<HTMLDivElement>(null)

  const stats: TextStats = useMemo(() => computeStats(debouncedContent), [debouncedContent])

  const maxTopWord = stats.topWords[0]?.count ?? 0

  return (
    <aside
      className="flex h-full w-70 shrink-0 flex-col overflow-hidden border-l border-gray-200/80 bg-gray-50/80 transition-colors duration-200 dark:border-gray-700/60 dark:bg-gray-800/80"
      style={{ animation: 'slideInRight 0.2s ease-out' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200/60 px-3 py-2 dark:border-gray-700/40">
        <div className="flex items-center gap-1.5">
          <BarChart3 size={14} strokeWidth={1.5} className="text-gray-500 dark:text-gray-400" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            Writing Statistics
          </span>
        </div>
        <button
          type="button"
          aria-label="Close statistics"
          className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          onClick={() => close(false)}
          title="Close statistics"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto">
        {/* Counts */}
        <Section title="Counts" icon={Hash}>
          <StatRow label="Words" value={stats.words} />
          <StatRow label="Characters" value={stats.characters} />
          <StatRow label="Characters (no spaces)" value={stats.charactersNoSpaces} />
          <StatRow label="Sentences" value={stats.sentences} />
          <StatRow label="Paragraphs" value={stats.paragraphs} />
          <StatRow label="Lines" value={stats.lines} />
        </Section>

        {/* Time estimates */}
        <Section title="Time Estimates" icon={Clock}>
          <StatRow label="Reading time" value={formatTime(stats.readingTimeMinutes)} />
          <StatRow label="Speaking time" value={formatTime(stats.speakingTimeMinutes)} />
        </Section>

        {/* Readability */}
        <Section title="Readability" icon={BookOpen}>
          <ReadabilityMeter
            score={stats.fleschReadingEase}
            label={readingEaseLabel(stats.fleschReadingEase)}
          />
          <div className="mt-2">
            <StatRow
              label="Grade level"
              value={`${stats.fleschKincaidGrade.toFixed(1)} — ${gradeLabel(stats.fleschKincaidGrade)}`}
            />
          </div>
        </Section>

        {/* Sentence analysis */}
        <Section title="Sentences" icon={AlignLeft}>
          <StatRow label="Avg. sentence length" value={`${stats.avgSentenceLength.toFixed(1)} words`} />
          {stats.longestSentence && (
            <div className="mt-1">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Longest sentence:</span>
              <p className="mt-0.5 line-clamp-3 text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
                {stats.longestSentence}
              </p>
            </div>
          )}
        </Section>

        {/* Vocabulary */}
        <Section title="Vocabulary" icon={Type}>
          <StatRow label="Unique words" value={stats.uniqueWords} />
          <StatRow label="Richness ratio" value={`${(stats.vocabularyRichness * 100).toFixed(1)}%`} />
        </Section>

        {/* Top words */}
        {stats.topWords.length > 0 && (
          <Section title="Top Words" icon={Mic}>
            {stats.topWords.map((tw) => (
              <TopWordBar key={tw.word} word={tw.word} count={tw.count} max={maxTopWord} />
            ))}
          </Section>
        )}
      </div>
    </aside>
  )
}
