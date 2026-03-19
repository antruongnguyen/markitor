import { useCallback } from 'react'
import { FileText, BookOpen, Users, List, Code2, Lightbulb, File, X } from 'lucide-react'
import { templates, type Template } from '../utils/templates'
import { useTabStore } from '../store/tabStore'
import { useEditorStore } from '../store/editorStore'

const iconMap: Record<string, typeof FileText> = {
  blank: File,
  readme: FileText,
  'blog-post': BookOpen,
  'meeting-notes': Users,
  changelog: List,
  'api-docs': Code2,
  'tech-spec': Lightbulb,
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: Template
  onSelect: (t: Template) => void
}) {
  const Icon = iconMap[template.id] ?? FileText
  const preview = template.content.slice(0, 120).trim() || '(empty document)'

  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className="group flex flex-col gap-2 rounded-lg border border-gray-200/80 bg-white p-4 text-left transition-all duration-150 hover:border-blue-300 hover:shadow-md dark:border-gray-700/60 dark:bg-gray-800/60 dark:hover:border-blue-500/50"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-gray-700 dark:text-gray-400 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-400">
          <Icon size={16} strokeWidth={1.5} />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {template.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {template.description}
          </div>
        </div>
      </div>
      <div className="line-clamp-3 font-mono text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
        {preview}
      </div>
    </button>
  )
}

export function TemplateGallery({ onClose }: { onClose: () => void }) {
  const addTab = useTabStore((s) => s.addTab)

  const handleSelect = useCallback(
    (template: Template) => {
      addTab({
        fileName: template.tabName,
        content: template.content,
      })
      // Mark as dirty if template has content (unsaved new doc)
      if (template.content) {
        useEditorStore.getState().setDirty(true)
      }
      onClose()
    },
    [addTab, onClose],
  )

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center pt-[12vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="New from template"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.15s ease-out' }}
      />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-2xl dark:border-gray-700/60 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.15s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200/80 px-5 py-3 dark:border-gray-700/60">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            New from Template
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Template grid */}
        <div className="custom-scrollbar grid max-h-105 grid-cols-2 gap-3 overflow-y-auto p-4">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onSelect={handleSelect} />
          ))}
        </div>
      </div>
    </div>
  )
}
