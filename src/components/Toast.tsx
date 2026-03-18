import { useToastStore } from '../store/toastStore'

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto animate-[fadeInUp_0.2s_ease-out] rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-800 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
