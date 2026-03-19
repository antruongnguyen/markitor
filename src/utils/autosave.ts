const DB_NAME = 'markitor-autosave'
const DB_VERSION = 2
const STORE_NAME = 'drafts'
const META_STORE = 'meta'
const EXPIRY_DAYS = 7

export type Draft = {
  tabId: string
  content: string
  fileName: string
  cursorPos: number
  scrollTop: number
  savedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'tabId' })
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDB().then((db) => db.transaction(STORE_NAME, mode).objectStore(STORE_NAME))
}

export async function saveDraft(draft: Draft): Promise<void> {
  const store = await tx('readwrite')
  return new Promise((resolve, reject) => {
    const req = store.put(draft)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function saveDrafts(drafts: Draft[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    // Clear all old entries first to prevent orphaned drafts from accumulating
    store.clear()
    for (const draft of drafts) {
      store.put(draft)
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function loadAllDrafts(): Promise<Draft[]> {
  const store = await tx('readonly')
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result as Draft[])
    req.onerror = () => reject(req.error)
  })
}

export async function deleteDraft(tabId: string): Promise<void> {
  const store = await tx('readwrite')
  return new Promise((resolve, reject) => {
    const req = store.delete(tabId)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function clearAllDrafts(): Promise<void> {
  const store = await tx('readwrite')
  return new Promise((resolve, reject) => {
    const req = store.clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function expireOldDrafts(): Promise<void> {
  const drafts = await loadAllDrafts()
  const cutoff = Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000
  const expired = drafts.filter((d) => d.savedAt < cutoff)
  if (expired.length === 0) return
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    for (const d of expired) {
      store.delete(d.tabId)
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function saveActiveTabId(tabId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, 'readwrite')
    const store = transaction.objectStore(META_STORE)
    store.put(tabId, 'activeTabId')
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function loadActiveTabId(): Promise<string | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE, 'readonly')
    const store = transaction.objectStore(META_STORE)
    const req = store.get('activeTabId')
    req.onsuccess = () => resolve((req.result as string) ?? null)
    req.onerror = () => reject(req.error)
  })
}
