import { getDb, type SyncQueueItem } from './db'

export type { SyncQueueItem }

declare global {
  interface ServiceWorkerRegistration {
    readonly sync: SyncManager
  }
  interface SyncManager {
    register(tag: string): Promise<void>
    getTags(): Promise<string[]>
  }
}

export async function enqueueOfflineMutation(
  item: Pick<SyncQueueItem, 'method' | 'url' | 'payload'>,
): Promise<void> {
  const db = await getDb()
  await db.put('syncQueue', {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    retries: 0,
  })

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      if ('sync' in reg) await reg.sync.register('sync-mutations')
    } catch {
      // Background Sync not available in this context — online event handles it.
    }
  }
}

export async function getPendingMutations(): Promise<SyncQueueItem[]> {
  const db = await getDb()
  return db.getAllFromIndex('syncQueue', 'createdAt')
}

export async function removeMutation(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('syncQueue', id)
}

export async function incrementRetry(id: string): Promise<void> {
  const db = await getDb()
  const item = await db.get('syncQueue', id)
  if (item) await db.put('syncQueue', { ...item, retries: item.retries + 1 })
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDb()
  await db.clear('syncQueue')
}
