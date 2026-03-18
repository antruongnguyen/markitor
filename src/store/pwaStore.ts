import { create } from 'zustand'

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type PWAStore = {
  /** Whether the browser is online */
  online: boolean
  /** Whether the app can be installed (beforeinstallprompt fired) */
  installable: boolean
  /** Whether the user has dismissed the install banner */
  dismissed: boolean
  /** Trigger the native install prompt */
  promptInstall: () => void
  /** Dismiss the install banner */
  dismiss: () => void
  /** Internal: init listeners (call once from App) */
  _init: () => () => void
}

let _deferredPrompt: BeforeInstallPromptEvent | null = null

export const usePWAStore = create<PWAStore>((set) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  installable: false,
  dismissed: false,

  promptInstall: async () => {
    if (!_deferredPrompt) return
    _deferredPrompt.prompt()
    const { outcome } = await _deferredPrompt.userChoice
    if (outcome === 'accepted') {
      set({ installable: false })
    }
    _deferredPrompt = null
  },

  dismiss: () => set({ dismissed: true }),

  _init: () => {
    const onOnline = () => set({ online: true })
    const onOffline = () => set({ online: false })
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      _deferredPrompt = e as BeforeInstallPromptEvent
      set({ installable: true })
    }
    const onAppInstalled = () => {
      set({ installable: false })
      _deferredPrompt = null
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)

    // Sync initial state
    set({ online: navigator.onLine })

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  },
}))
