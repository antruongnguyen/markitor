import { Download, X } from 'lucide-react'
import { usePWAStore } from '../store/pwaStore'

export function InstallBanner() {
  const installable = usePWAStore((s) => s.installable)
  const dismissed = usePWAStore((s) => s.dismissed)
  const promptInstall = usePWAStore((s) => s.promptInstall)
  const dismiss = usePWAStore((s) => s.dismiss)

  if (!installable || dismissed) return null

  return (
    <div role="banner" className="flex items-center gap-2 border-b border-blue-200/60 bg-blue-50/80 px-3 py-1.5 text-xs text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
      <Download size={14} strokeWidth={1.5} className="shrink-0" />
      <span>Install Markitor as a desktop app for offline use</span>
      <button
        type="button"
        aria-label="Install Markitor"
        className="ml-auto rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-blue-500"
        onClick={promptInstall}
      >
        Install
      </button>
      <button
        type="button"
        className="rounded-md p-0.5 transition-colors hover:bg-blue-100 dark:hover:bg-blue-500/20"
        onClick={dismiss}
        title="Dismiss"
        aria-label="Dismiss install banner"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  )
}
