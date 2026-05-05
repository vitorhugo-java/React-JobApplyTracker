import api from './axios'
import { getApplications } from './applications'

export const getDashboardSummary = () => api.get('/dashboard/summary')

const DASHBOARD_METRICS_PAGE_SIZE = 200
const MAX_DASHBOARD_METRICS_PAGES = 50
const METRICS_TEST_DATA_KEY = 'jobtracker:e2e-metrics-applications'

const getSeededMetricsApplications = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const rawData = window.sessionStorage.getItem(METRICS_TEST_DATA_KEY)
    || window.localStorage.getItem(METRICS_TEST_DATA_KEY)

  if (!rawData) {
    return null
  }

  try {
    const parsed = JSON.parse(rawData)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const getMetricsApplications = async (params = {}) => {
  const seededApplications = getSeededMetricsApplications()

  if (seededApplications) {
    return seededApplications
  }

  const allItems = []

  for (let page = 0; page < MAX_DASHBOARD_METRICS_PAGES; page += 1) {
    const response = await getApplications({
      archived: false,
      sort: 'createdAt,desc',
      size: DASHBOARD_METRICS_PAGE_SIZE,
      page,
      ...params,
    })

    const payload = response.data
    const items = Array.isArray(payload) ? payload : payload?.content || payload?.items || []
    allItems.push(...items)

    if (Array.isArray(payload)) {
      break
    }

    const totalPages = payload?.totalPages ?? 0
    const reachedLastPage = totalPages > 0 ? page + 1 >= totalPages : items.length < DASHBOARD_METRICS_PAGE_SIZE

    if (reachedLastPage) {
      break
    }
  }

  return allItems
}
