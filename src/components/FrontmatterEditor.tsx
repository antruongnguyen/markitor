import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  ChevronDown,
  Plus,
  Trash2,
  X,
  FileText,
} from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import { useFrontmatterStore } from '../store/frontmatterStore'
import {
  extractFrontmatter,
  buildFrontmatter,
  replaceFrontmatter,
  removeFrontmatter,
  FRONTMATTER_TEMPLATES,
  FIELD_TYPES,
  type FrontmatterField,
  type FrontmatterTemplate,
} from '../utils/frontmatter'

/** Tag chip input for array fields */
function TagInput({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = () => {
    const tag = input.trim()
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag])
    }
    setInput('')
  }

  return (
    <div
      className="flex min-h-7.5 flex-wrap items-center gap-1 rounded border border-gray-200/80 bg-white px-1.5 py-1 dark:border-gray-600/60 dark:bg-gray-700/50"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(tags.filter((t) => t !== tag))
            }}
            className="ml-0.5 rounded-full p-0.5 hover:bg-blue-100 dark:hover:bg-blue-500/20"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag()
          } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            onChange(tags.slice(0, -1))
          }
        }}
        onBlur={addTag}
        placeholder={tags.length === 0 ? 'Add tags...' : ''}
        className="min-w-15 flex-1 bg-transparent py-0.5 text-xs text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
      />
    </div>
  )
}

/** A single field row in the editor */
function FieldRow({
  field,
  onUpdate,
  onRemove,
}: {
  field: FrontmatterField
  onUpdate: (field: FrontmatterField) => void
  onRemove: () => void
}) {
  const renderInput = () => {
    switch (field.type) {
      case 'boolean':
        return (
          <button
            type="button"
            role="switch"
            aria-checked={!!field.value}
            onClick={() => onUpdate({ ...field, value: !field.value })}
            className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
              field.value
                ? 'bg-blue-500 dark:bg-blue-400'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                field.value ? 'translate-x-4' : ''
              }`}
            />
          </button>
        )
      case 'number':
        return (
          <input
            type="number"
            value={field.value as number}
            onChange={(e) => onUpdate({ ...field, value: Number(e.target.value) })}
            className="h-7.5 w-full rounded border border-gray-200/80 bg-white px-2 text-xs text-gray-900 outline-none focus:border-blue-400 dark:border-gray-600/60 dark:bg-gray-700/50 dark:text-gray-100 dark:focus:border-blue-500"
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={String(field.value || '')}
            onChange={(e) => onUpdate({ ...field, value: e.target.value })}
            className="h-7.5 w-full rounded border border-gray-200/80 bg-white px-2 text-xs text-gray-900 outline-none focus:border-blue-400 dark:border-gray-600/60 dark:bg-gray-700/50 dark:text-gray-100 dark:focus:border-blue-500"
          />
        )
      case 'array':
        return (
          <TagInput
            tags={Array.isArray(field.value) ? (field.value as string[]) : []}
            onChange={(tags) => onUpdate({ ...field, value: tags })}
          />
        )
      default:
        return (
          <input
            type="text"
            value={String(field.value ?? '')}
            onChange={(e) => onUpdate({ ...field, value: e.target.value })}
            className="h-7.5 w-full rounded border border-gray-200/80 bg-white px-2 text-xs text-gray-900 outline-none focus:border-blue-400 dark:border-gray-600/60 dark:bg-gray-700/50 dark:text-gray-100 dark:focus:border-blue-500"
          />
        )
    }
  }

  return (
    <div className="group flex items-center gap-2">
      <input
        type="text"
        value={field.key}
        onChange={(e) => onUpdate({ ...field, key: e.target.value })}
        placeholder="key"
        className="h-7.5 w-28 shrink-0 rounded border border-gray-200/80 bg-white px-2 text-xs font-medium text-gray-700 outline-none focus:border-blue-400 dark:border-gray-600/60 dark:bg-gray-700/50 dark:text-gray-300 dark:focus:border-blue-500"
      />
      <div className="flex-1">{renderInput()}</div>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        title="Remove field"
        aria-label="Remove field"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

/** Template picker dropdown */
function TemplatePicker({ onSelect }: { onSelect: (t: FrontmatterTemplate) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
      >
        <FileText size={12} />
        Template
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-lg dark:border-gray-700/60 dark:bg-gray-800">
          {FRONTMATTER_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onSelect(t)
                setOpen(false)
              }}
              className="flex w-full items-center px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Add field dropdown */
function AddFieldButton({ onAdd }: { onAdd: (type: FrontmatterField['type']) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
      >
        <Plus size={12} />
        Add field
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-lg dark:border-gray-700/60 dark:bg-gray-800">
          {FIELD_TYPES.map((ft) => (
            <button
              key={ft.value}
              type="button"
              onClick={() => {
                onAdd(ft.value)
                setOpen(false)
              }}
              className="flex w-full items-center px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
            >
              {ft.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const DEFAULT_VALUES: Record<FrontmatterField['type'], unknown> = {
  string: '',
  number: 0,
  boolean: false,
  date: new Date().toISOString().slice(0, 10),
  array: [],
  unknown: '',
}

export function FrontmatterEditor() {
  const content = useEditorStore((s) => s.content)
  const setContent = useEditorStore((s) => s.setContent)
  const expanded = useFrontmatterStore((s) => s.expanded)
  const toggle = useFrontmatterStore((s) => s.toggle)
  const setStoreHasFrontmatter = useFrontmatterStore((s) => s.setHasFrontmatter)

  const [fields, setFields] = useState<FrontmatterField[]>([])
  const syncingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Derive hasFrontmatter from content (no local state needed)
  const hasFrontmatter = useMemo(() => extractFrontmatter(content).found, [content])

  // Sync from editor content -> fields and store (bidirectional sync with syncingRef guard)
  useEffect(() => {
    if (syncingRef.current) return
    const result = extractFrontmatter(content)
    setStoreHasFrontmatter(result.found)
    if (result.found) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional bidirectional sync guarded by syncingRef
      setFields(result.fields)
    }
  }, [content, setStoreHasFrontmatter])

  // Sync from fields -> editor content (debounced)
  const syncToEditor = useCallback(
    (updatedFields: FrontmatterField[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        syncingRef.current = true
        const yamlStr = buildFrontmatter(updatedFields)
        const newContent = replaceFrontmatter(content, yamlStr)
        if (newContent !== content) {
          setContent(newContent)
        }
        // Allow next editor->fields sync after a tick
        requestAnimationFrame(() => {
          syncingRef.current = false
        })
      }, 300)
    },
    [content, setContent],
  )

  const updateField = useCallback(
    (index: number, field: FrontmatterField) => {
      setFields((prev) => {
        const next = [...prev]
        next[index] = field
        syncToEditor(next)
        return next
      })
    },
    [syncToEditor],
  )

  const removeField = useCallback(
    (index: number) => {
      setFields((prev) => {
        const next = prev.filter((_, i) => i !== index)
        if (next.length === 0) {
          // If no fields left, remove frontmatter entirely
          syncingRef.current = true
          const newContent = removeFrontmatter(content)
          setContent(newContent)
          setStoreHasFrontmatter(false)
          requestAnimationFrame(() => {
            syncingRef.current = false
          })
          return next
        }
        syncToEditor(next)
        return next
      })
    },
    [content, setContent, syncToEditor, setStoreHasFrontmatter],
  )

  const addField = useCallback(
    (type: FrontmatterField['type']) => {
      const newField: FrontmatterField = {
        key: '',
        value: DEFAULT_VALUES[type],
        type,
      }
      setFields((prev) => {
        const next = [...prev, newField]
        if (!hasFrontmatter) {
          // Insert frontmatter for the first time
          syncingRef.current = true
          const yamlStr = buildFrontmatter(next)
          const newContent = replaceFrontmatter(content, yamlStr)
          setContent(newContent)
          setStoreHasFrontmatter(true)
          requestAnimationFrame(() => {
            syncingRef.current = false
          })
        } else {
          syncToEditor(next)
        }
        return next
      })
    },
    [hasFrontmatter, content, setContent, syncToEditor, setStoreHasFrontmatter],
  )

  const applyTemplate = useCallback(
    (template: FrontmatterTemplate) => {
      const newFields = template.fields.map((f) => ({ ...f }))
      setFields(newFields)
      setStoreHasFrontmatter(true)
      syncingRef.current = true
      const yamlStr = buildFrontmatter(newFields)
      const newContent = replaceFrontmatter(content, yamlStr)
      setContent(newContent)
      requestAnimationFrame(() => {
        syncingRef.current = false
      })
    },
    [content, setContent, setStoreHasFrontmatter],
  )

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Don't render if panel is collapsed — toolbar button handles toggling back
  if (!expanded) return null

  return (
    <div className="shrink-0 border-b border-gray-200/80 bg-gray-50/80 dark:border-gray-700/60 dark:bg-gray-800/60">
      {/* Header bar */}
      <div className="flex items-center justify-between px-2 py-1">
        <button
          type="button"
          onClick={toggle}
          className="flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
        >
          <ChevronDown size={14} />
          Frontmatter
          {hasFrontmatter && (
            <span className="ml-1 text-[10px] text-gray-400 dark:text-gray-500">
              {fields.length} field{fields.length !== 1 ? 's' : ''}
            </span>
          )}
        </button>
        <div className="flex items-center gap-1">
          <TemplatePicker onSelect={applyTemplate} />
          <AddFieldButton onAdd={addField} />
          {!hasFrontmatter && (
            <button
              type="button"
              onClick={() => addField('string')}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
            >
              <Plus size={12} />
              Add frontmatter
            </button>
          )}
        </div>
      </div>

      {/* Field list */}
      {hasFrontmatter && fields.length > 0 && (
        <div className="space-y-1.5 px-2 pb-2">
          {fields.map((field, i) => (
            <FieldRow
              key={`${field.key}-${field.type}-${i}`}
              field={field}
              onUpdate={(f) => updateField(i, f)}
              onRemove={() => removeField(i)}
            />
          ))}
        </div>
      )}

      {hasFrontmatter && fields.length === 0 && (
        <div className="px-2 pb-2 text-xs text-gray-400 dark:text-gray-500">
          Frontmatter detected but could not parse fields. Edit the YAML directly in the editor.
        </div>
      )}
    </div>
  )
}
