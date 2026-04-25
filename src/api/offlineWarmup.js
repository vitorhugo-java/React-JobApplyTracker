import { getApplications, getOverdue, getUpcoming } from './applications'
import { getDashboardSummary } from './dashboard'
import { replaceApplicationSnapshot } from './offlineCache'
import logger from '../utils/logger'

const PAGE_SIZE = 100

let warmupPromise = null

export const isMeteredConnection = () => {
  if (typeof navigator === 'undefined') return false
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!connection) return false

  return Boolean(connection.saveData) || connection.type === 'cellular'
}

const extractItems = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.items)) return data.items
  return []
}

const fetchApplicationsByArchiveState = async (archived) => {
  const items = []
  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    const response = await getApplications({
      archived,
      page,
      size: PAGE_SIZE,
      sort: 'createdAt,desc',
    })

    const pageItems = extractItems(response.data)
    items.push(...pageItems)
    totalPages = response.data?.totalPages || Math.max(1, Math.ceil((response.data?.totalElements || pageItems.length) / PAGE_SIZE))
    page += 1
  }

  return items
}

export const warmOfflineData = async () => {
  if (warmupPromise) return warmupPromise
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return null
  if (!navigator.onLine || isMeteredConnection()) return null

  warmupPromise = (async () => {
    const [active, archived] = await Promise.all([
      fetchApplicationsByArchiveState(false),
      fetchApplicationsByArchiveState(true),
    ])

    replaceApplicationSnapshot({ active, archived })

    await Promise.allSettled([
      getDashboardSummary(),
      getUpcoming(),
      getOverdue(),
    ])

    logger.info('Offline data warmup completed', {
      activeCount: active.length,
      archivedCount: archived.length,
    })

    return { activeCount: active.length, archivedCount: archived.length }
  })().catch((error) => {
    logger.warn('Offline data warmup failed', { message: error?.message })
    return null
  }).finally(() => {
    warmupPromise = null
  })

  return warmupPromise
}