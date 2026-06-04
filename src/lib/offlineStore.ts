import { getDb } from './db'
import { getEncryptionKey, encryptData, decryptData } from './crypto'
import { useAuthStore } from '@/store/authStore'

const DEFAULT_TTL_MS: Record<string, number> = {
  '/dashboard': 2 * 60 * 1000,
  '/metrics': 10 * 60 * 1000,
  '/gamification': 5 * 60 * 1000,
}
const FALLBACK_TTL = 5 * 60 * 1000

function ttlFor(url: string): number {
  for (const [prefix, ttl] of Object.entries(DEFAULT_TTL_MS)) {
    if (url.startsWith(prefix)) return ttl
  }
  return FALLBACK_TTL
}

function invalidationPatternFor(url: string): RegExp | null {
  if (url.includes('/applications')) return /^\/applications/
  if (url.includes('/dashboard')) return /^\/dashboard/
  if (url.includes('/gamification')) return /^\/gamification/
  if (url.includes('/metrics')) return /^\/metrics/
  return null
}

async function getKey(): Promise<CryptoKey | null> {
  const userId = useAuthStore.getState().user?.id
  if (!userId) return null
  return getEncryptionKey(userId)
}

export function buildCacheKey(url: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return url
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, String(v)]),
  ).toString()
  return qs ? `${url}?${qs}` : url
}

export async function cacheApiResponse(cacheKey: string, data: unknown): Promise<void> {
  const key = await getKey()
  if (!key) return
  const db = await getDb()
  const encrypted = await encryptData(data, key)
  await db.put('apiCache', {
    key: cacheKey,
    data: encrypted,
    timestamp: Date.now(),
    ttl: ttlFor(cacheKey),
  })
}

export async function getCachedApiResponse<T>(cacheKey: string): Promise<T | null> {
  const key = await getKey()
  if (!key) return null
  const db = await getDb()
  const entry = await db.get('apiCache', cacheKey)
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttl) {
    db.delete('apiCache', cacheKey).catch(() => {})
    return null
  }
  try {
    return await decryptData<T>(entry.data, key)
  } catch {
    return null
  }
}

export async function invalidateCacheForMutation(url: string): Promise<void> {
  const pattern = invalidationPatternFor(url)
  if (!pattern) return
  const db = await getDb()
  const allKeys = await db.getAllKeys('apiCache')
  const tx = db.transaction('apiCache', 'readwrite')
  await Promise.all(
    allKeys.filter((k) => pattern.test(String(k))).map((k) => tx.store.delete(k)),
  )
  await tx.done
}

export async function clearApiCache(): Promise<void> {
  const db = await getDb()
  await db.clear('apiCache')
}
