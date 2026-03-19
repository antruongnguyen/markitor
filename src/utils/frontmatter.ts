import yaml from 'js-yaml'

/** Parsed frontmatter field with inferred type */
export type FrontmatterField = {
  key: string
  value: unknown
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'unknown'
}

/** Extraction result from a markdown document */
export type FrontmatterResult = {
  found: boolean
  raw: string
  fields: FrontmatterField[]
  bodyStart: number // char offset where the body (after closing ---) begins
}

const FM_REGEX = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

/** Extract frontmatter from markdown content */
export function extractFrontmatter(content: string): FrontmatterResult {
  const match = content.match(FM_REGEX)
  if (!match) {
    return { found: false, raw: '', fields: [], bodyStart: 0 }
  }

  const raw = match[1]
  const bodyStart = match[0].length

  try {
    const parsed = yaml.load(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { found: true, raw, fields: [], bodyStart }
    }

    const fields: FrontmatterField[] = Object.entries(parsed as Record<string, unknown>).map(
      ([key, value]) => ({
        key,
        value,
        type: inferType(value),
      }),
    )

    return { found: true, raw, fields, bodyStart }
  } catch {
    return { found: true, raw, fields: [], bodyStart }
  }
}

/** Infer the field type from a value */
function inferType(value: unknown): FrontmatterField['type'] {
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (value instanceof Date) return 'date'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'string') {
    // Check if it looks like a date (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
    return 'string'
  }
  return 'unknown'
}

/** Build frontmatter YAML string from fields */
export function buildFrontmatter(fields: FrontmatterField[]): string {
  const obj: Record<string, unknown> = {}
  for (const field of fields) {
    if (!field.key.trim()) continue
    obj[field.key] = coerceValue(field.value, field.type)
  }
  return yaml.dump(obj, { lineWidth: -1, noRefs: true }).trimEnd()
}

/** Coerce a value to match the expected type */
function coerceValue(value: unknown, type: FrontmatterField['type']): unknown {
  switch (type) {
    case 'boolean':
      return Boolean(value)
    case 'number':
      return Number(value) || 0
    case 'date':
      return String(value)
    case 'array':
      return Array.isArray(value) ? value : []
    default:
      return String(value ?? '')
  }
}

/** Replace or insert frontmatter in a document */
export function replaceFrontmatter(content: string, yamlStr: string): string {
  const match = content.match(FM_REGEX)
  if (match) {
    return `---\n${yamlStr}\n---\n${content.slice(match[0].length)}`
  }
  return `---\n${yamlStr}\n---\n\n${content}`
}

/** Remove frontmatter from a document */
export function removeFrontmatter(content: string): string {
  const match = content.match(FM_REGEX)
  if (!match) return content
  return content.slice(match[0].length)
}

/** Available frontmatter templates */
export type FrontmatterTemplate = {
  id: string
  name: string
  fields: FrontmatterField[]
}

export const FRONTMATTER_TEMPLATES: FrontmatterTemplate[] = [
  {
    id: 'blog',
    name: 'Blog Post',
    fields: [
      { key: 'title', value: '', type: 'string' },
      { key: 'date', value: new Date().toISOString().slice(0, 10), type: 'date' },
      { key: 'author', value: '', type: 'string' },
      { key: 'tags', value: [], type: 'array' },
      { key: 'description', value: '', type: 'string' },
      { key: 'draft', value: true, type: 'boolean' },
    ],
  },
  {
    id: 'docs',
    name: 'Documentation',
    fields: [
      { key: 'title', value: '', type: 'string' },
      { key: 'sidebar_position', value: 1, type: 'number' },
      { key: 'description', value: '', type: 'string' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    fields: [
      { key: 'title', value: '', type: 'string' },
    ],
  },
]

/** Default type for new fields */
export const FIELD_TYPES: { value: FrontmatterField['type']; label: string }[] = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'array', label: 'List' },
]
