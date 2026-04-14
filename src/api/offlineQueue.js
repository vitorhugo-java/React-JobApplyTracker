import logger from '../utils/logger'

const STORAGE_KEY = 'jobtracker:offline-request-queue'
const MAX_QUEUE_SIZE = 200
const AUTH_ENDPOINT_PATTERN = /\/auth\/(login|register|refresh|logout|forgot-password|reset-password)/i
const OFFLINE_QUEUE_EVENT = 'jobtracker:offline-queue-updated'

const safeParse = (value, fallback) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const readQueue = () => {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(STORAGE_KEY), [])
}

const writeQueue = (queue) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

const notifyStatus = (payload = {}) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(OFFLINE_QUEUE_EVENT, {
      detail: {
        queuedCount: getQueuedCount(),
        syncing: flushing,
        ...payload,
      },
    })
  )
}

const normalizeMethod = (method) => String(method || '').toUpperCase()

export const isMutatingMethod = (method) => {
  const normalized = normalizeMethod(method)
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalized)
}

const shouldSkipQueueByUrl = (url) => {
  if (!url) return false
  return AUTH_ENDPOINT_PATTERN.test(url)
}

const sanitizeHeaders = (headers = {}) => {
  const contentType = headers['Content-Type'] || headers['content-type']
  return contentType ? { 'Content-Type': contentType } : {}
}

export const shouldQueueRequest = (config = {}) => {
  if (config._skipOfflineQueue || config._fromOfflineQueue) return false
  if (!isMutatingMethod(config.method)) return false
  if (shouldSkipQueueByUrl(config.url)) return false
  return true
}

export const enqueueRequest = (config = {}) => {
  const queue = readQueue()
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    request: {
      url: config.url,
      method: normalizeMethod(config.method),
      data: config.data ?? null,
      params: config.params ?? null,
      headers: sanitizeHeaders(config.headers),
    },
  }

  queue.push(item)
  if (queue.length > MAX_QUEUE_SIZE) {
    queue.splice(0, queue.length - MAX_QUEUE_SIZE)
  }
  writeQueue(queue)
  notifyStatus()

  logger.warn('Request queued for offline sync', {
    method: item.request.method,
    url: item.request.url,
    queueLength: queue.length,
  })

  return item
}

export const getQueuedCount = () => readQueue().length

export const getOfflineQueueStatus = () => ({
  queuedCount: getQueuedCount(),
  syncing: flushing,
})

export const onOfflineQueueStatusChange = (listener) => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const wrapped = (event) => {
    listener(event.detail || getOfflineQueueStatus())
  }

  window.addEventListener(OFFLINE_QUEUE_EVENT, wrapped)
  window.addEventListener('storage', wrapped)
  return () => {
    window.removeEventListener(OFFLINE_QUEUE_EVENT, wrapped)
    window.removeEventListener('storage', wrapped)
  }
}

let flushing = false

export const flushOfflineQueue = async (api) => {
  if (flushing) return { processed: 0, remaining: getQueuedCount() }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, remaining: getQueuedCount() }
  }

  const queue = readQueue()
  if (!queue.length) return { processed: 0, remaining: 0 }

  flushing = true
  notifyStatus({ syncing: true })
  let processed = 0
  let remaining = [...queue]

  try {
    while (remaining.length) {
      const current = remaining[0]
      const { method, url, data, params, headers } = current.request

      try {
        await api({
          method,
          url,
          data,
          params,
          headers,
          _fromOfflineQueue: true,
          _skipOfflineQueue: true,
        })

        processed += 1
        remaining.shift()
        writeQueue(remaining)
        notifyStatus({ syncing: true })
      } catch (error) {
        const status = error?.response?.status

        // Keep queue for recoverable/auth/network failures; retry later in original order.
        if (!status || status === 401 || status === 403 || status === 429 || status >= 500) {
          break
        }

        // Drop permanently invalid requests so they do not block the full queue.
        logger.warn('Dropping invalid offline queued request', {
          method,
          url,
          status,
        })
        remaining.shift()
        writeQueue(remaining)
        notifyStatus({ syncing: true })
      }
    }

    return { processed, remaining: remaining.length }
  } finally {
    flushing = false
    notifyStatus({ syncing: false })
  }
}
