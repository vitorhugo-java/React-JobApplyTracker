import { api } from './api'
import { getPendingMutations, removeMutation, incrementRetry } from './syncQueue'
import { invalidateCacheForMutation } from './offlineStore'

const MAX_RETRIES = 3

export async function replayOfflineQueue(): Promise<{ replayed: number; failed: number }> {
  const queue = await getPendingMutations()
  let replayed = 0
  let failed = 0

  for (const item of queue) {
    if (item.retries >= MAX_RETRIES) {
      await removeMutation(item.id)
      continue
    }
    try {
      await api.request({ method: item.method, url: item.url, data: item.payload })
      await removeMutation(item.id)
      await invalidateCacheForMutation(item.url)
      replayed++
    } catch {
      await incrementRetry(item.id)
      failed++
    }
  }

  return { replayed, failed }
}
