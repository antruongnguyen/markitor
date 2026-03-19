import { useCallback, useEffect, useRef } from 'react'
import { X, Github, Globe, Mail, Scale } from 'lucide-react'
import { useAboutDialogStore } from '../store/aboutDialogStore'

const APP_INFO = {
  name: 'Markitor',
  version: __APP_VERSION__,
  author: 'An Nguyen',
  email: 'annguyen.apps@gmail.com',
  github: 'https://github.com/antruongnguyen/markitor',
  website: 'https://markitor.web.app',
  license: 'MIT',
} as const

function InfoRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5">
      <span className="shrink-0 text-gray-400 dark:text-gray-500">{icon}</span>
      <span className="w-16 shrink-0 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          {value}
        </a>
      ) : (
        <span className="truncate text-sm text-gray-700 dark:text-gray-200">{value}</span>
      )}
    </div>
  )
}

function AboutDialogInner({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [onClose],
  )

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-96 rounded-xl border border-gray-200/80 bg-white p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800"
      onClose={onClose}
      onKeyDown={handleKeyDown}
    >
      {/* Header with app name */}
      <div className="flex items-center justify-between border-b border-gray-200/80 px-5 py-4 dark:border-gray-700/60">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Markitor logo" className="h-9 w-9" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{APP_INFO.name}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">v{APP_INFO.version}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close"
          className="rounded-md p-1 text-gray-400 transition-all duration-150 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
          onClick={onClose}
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* App description */}
      <div className="border-b border-gray-200/80 px-5 py-3 dark:border-gray-700/60">
        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          A modern, feature-rich markdown editor built with React and CodeMirror. Write, preview, and export your markdown with ease.
        </p>
      </div>

      {/* Info rows */}
      <div className="divide-y divide-gray-100 py-1 dark:divide-gray-700/40">
        <InfoRow
          icon={<Mail size={14} strokeWidth={1.5} />}
          label="Author"
          value={`${APP_INFO.author}`}
          href={`mailto:${APP_INFO.email}`}
        />
        <InfoRow
          icon={<Github size={14} strokeWidth={1.5} />}
          label="GitHub"
          value="antruongnguyen/markitor"
          href={APP_INFO.github}
        />
        <InfoRow
          icon={<Globe size={14} strokeWidth={1.5} />}
          label="Website"
          value="markitor.web.app"
          href={APP_INFO.website}
        />
        <InfoRow
          icon={<Scale size={14} strokeWidth={1.5} />}
          label="License"
          value={APP_INFO.license}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200/80 px-5 py-2.5 text-center text-[10px] text-gray-400 dark:border-gray-700/60 dark:text-gray-500">
        Made with care for writers and developers
      </div>
    </dialog>
  )
}

export function AboutDialog() {
  const open = useAboutDialogStore((s) => s.open)
  const handleClose = useCallback(() => useAboutDialogStore.getState().setOpen(false), [])

  if (!open) return null
  return <AboutDialogInner onClose={handleClose} />
}
