import logger from '../utils/logger'

const EXACT_CACHE_KEY = 'jobtracker:offline-get-cache'
const APPLICATION_SNAPSHOT_KEY = 'jobtracker:offline-applications-snapshot'
const FOLLOW_UP_WINDOW_MS = 6 * 60 * 60 * 1000
const FOLLOW_UP_EXPIRY_MS = 2 * 24 * 60 * 60 * 1000
const WAITING_RESPONSE_STATUSES = new Set([
  'Fiz a RH - Aguardando Atualizacao',
  'Fiz a Hiring Manager - Aguardando Atualizacao',
  'Fiz teste Tecnico - aguardando atualizacao',
])

const safeParse = (value, fallback) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const readExactCache = () => {
  if (typeof window === 'undefined') return {}
  return safeParse(window.localStorage.getItem(EXACT_CACHE_KEY), {})
}

const writeExactCache = (cache) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(EXACT_CACHE_KEY, JSON.stringify(cache))
}

const readApplicationSnapshot = () => {
  if (typeof window === 'undefined') return { active: [], archived: [] }
  return safeParse(window.localStorage.getItem(APPLICATION_SNAPSHOT_KEY), { active: [], archived: [] })
}

const writeApplicationSnapshot = (snapshot) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(APPLICATION_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

const ensureTrailingSlash = (value) => (value.endsWith('/') ? value : `${value}/`)

const resolveRequestUrl = (config = {}) => {
  const rawUrl = String(config.url || '')
  if (/^https?:\/\//i.test(rawUrl)) {
    return new URL(rawUrl)
  }

  const base = ensureTrailingSlash(
    String(config.baseURL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost'))
  )
  const normalizedUrl = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl
  return new URL(normalizedUrl, base)
}

const buildRequestParts = (config = {}) => {
  const requestUrl = resolveRequestUrl(config)
  const params = new URLSearchParams(requestUrl.search)

  Object.entries(config.params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    params.set(key, String(value))
  })

  const canonicalParams = new URLSearchParams(
    Array.from(params.entries()).sort(([left], [right]) => left.localeCompare(right))
  )
  const pathname = requestUrl.pathname.replace(/\/api\/v1$/, '')
  const apiPath = requestUrl.pathname.includes('/api/v1')
    ? requestUrl.pathname.slice(requestUrl.pathname.indexOf('/api/v1') + '/api/v1'.length)
    : pathname

  return {
    apiPath: apiPath || '/',
    cacheKey: `${apiPath || '/'}?${canonicalParams.toString()}`,
    params,
  }
}

const normalizeText = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const normalizeDateValue = (value) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const normalizeApplication = (app) => ({
  ...app,
  archived: Boolean(app?.archived),
  recruiterDmReminderEnabled: Boolean(app?.recruiterDmReminderEnabled),
  interviewScheduled: Boolean(app?.interviewScheduled),
  rhAcceptedConnection: Boolean(app?.rhAcceptedConnection),
  vacancyName: app?.vacancyName ?? null,
  recruiterName: app?.recruiterName ?? null,
  organization: app?.organization ?? null,
  vacancyLink: app?.vacancyLink ?? null,
  status: app?.status ?? null,
  previousStatus: app?.previousStatus ?? null,
  note: app?.note ?? null,
  applicationDate: app?.applicationDate ?? null,
  nextStepDateTime: app?.nextStepDateTime ?? null,
  recruiterDmSentAt: app?.recruiterDmSentAt ?? null,
  archivedAt: app?.archivedAt ?? null,
  createdAt: app?.createdAt ?? new Date().toISOString(),
  updatedAt: app?.updatedAt ?? new Date().toISOString(),
})

const upsertApplication = (apps, nextApp) => {
  const normalized = normalizeApplication(nextApp)
  const index = apps.findIndex((app) => String(app.id) === String(normalized.id))
  if (index === -1) {
    return [...apps, normalized]
  }

  const updated = [...apps]
  updated[index] = normalized
  return updated
}

const removeApplication = (apps, id) => apps.filter((app) => String(app.id) !== String(id))

const getSnapshotCollections = () => {
  const snapshot = readApplicationSnapshot()
  return {
    active: Array.isArray(snapshot.active) ? snapshot.active.map(normalizeApplication) : [],
    archived: Array.isArray(snapshot.archived) ? snapshot.archived.map(normalizeApplication) : [],
  }
}

const setSnapshotCollections = ({ active, archived }) => {
  writeApplicationSnapshot({
    active: active.map(normalizeApplication),
    archived: archived.map(normalizeApplication),
  })
}

const getAllApplications = () => {
  const snapshot = getSnapshotCollections()
  return [...snapshot.active, ...snapshot.archived]
}

const isSentApplication = (app) => Boolean(app?.status)

const isPendingReminder = (app) => (
  Boolean(app) &&
  !app.archived &&
  isSentApplication(app) &&
  Boolean(app.recruiterDmReminderEnabled) &&
  !app.recruiterDmSentAt
)

const getReminderGroups = (apps) => {
  const now = Date.now()
  const upcoming = []
  const overdue = []

  apps.forEach((app) => {
    if (!isPendingReminder(app)) return

    const createdAt = normalizeDateValue(app.createdAt)
    if (!createdAt) return

    const ageMs = now - createdAt.getTime()
    if (ageMs < FOLLOW_UP_WINDOW_MS) {
      upcoming.push(app)
      return
    }

    if (ageMs < FOLLOW_UP_EXPIRY_MS) {
      overdue.push(app)
    }
  })

  const sortByCreatedAtAsc = (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  upcoming.sort(sortByCreatedAtAsc)
  overdue.sort(sortByCreatedAtAsc)

  return { upcoming, overdue }
}

const roundToTwoDecimals = (value) => Math.round(value * 100) / 100

const countApplicationsSince = (apps, startDate) => (
  apps.filter((app) => {
    const date = normalizeDateValue(app.applicationDate)
    return date && date >= startDate
  }).length
)

const buildDashboardSummary = (apps) => {
  const activeApps = apps.filter((app) => !app.archived)
  const reminders = activeApps.filter(isPendingReminder)
  const { overdue } = getReminderGroups(activeApps)
  const now = new Date()

  return {
    totalApplications: activeApps.length,
    waitingResponses: activeApps.filter((app) => WAITING_RESPONSE_STATUSES.has(normalizeText(app.status))).length,
    interviewsScheduled: activeApps.filter((app) => app.interviewScheduled).length,
    overdueFollowUps: overdue.length,
    dmRemindersEnabled: reminders.length,
    toSendLater: activeApps.filter((app) => !app.status).length,
    rejectedCount: activeApps.filter((app) => app.status === 'Rejeitado').length,
    ghostingCount: activeApps.filter((app) => app.status === 'Ghosting').length,
    averageDailyApplications: roundToTwoDecimals(countApplicationsSince(activeApps, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)) / 30),
    averageWeeklyApplications: roundToTwoDecimals(countApplicationsSince(activeApps, new Date(now.getFullYear(), now.getMonth(), now.getDate() - (11 * 7))) / 12),
    averageMonthlyApplications: roundToTwoDecimals(countApplicationsSince(activeApps, new Date(now.getFullYear(), now.getMonth() - 11, now.getDate())) / 12),
  }
}

const compareNullableStrings = (left, right) => String(left || '').localeCompare(String(right || ''), undefined, { sensitivity: 'base' })

const compareNullableDates = (left, right) => {
  const leftTime = normalizeDateValue(left)?.getTime() ?? 0
  const rightTime = normalizeDateValue(right)?.getTime() ?? 0
  return leftTime - rightTime
}

const sortApplications = (apps, sortValue) => {
  const [field, direction = 'desc'] = String(sortValue || 'createdAt,desc').split(',')
  const directionFactor = direction.toLowerCase() === 'asc' ? 1 : -1

  const compare = (left, right) => {
    switch (field) {
      case 'vacancyName':
      case 'recruiterName':
      case 'status':
        return compareNullableStrings(left[field], right[field])
      case 'applicationDate':
      case 'nextStepDateTime':
      case 'createdAt':
      case 'updatedAt':
        return compareNullableDates(left[field], right[field])
      default:
        return compareNullableDates(left.createdAt, right.createdAt)
    }
  }

  return [...apps].sort((left, right) => compare(left, right) * directionFactor)
}

const toBooleanParam = (value) => {
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

const deriveApplicationsPage = (params) => {
  const snapshot = getSnapshotCollections()
  const archived = toBooleanParam(params.get('archived')) ?? false
  const recruiterName = normalizeText(params.get('recruiterName'))
  const status = params.get('status')
  const applicationDateFrom = params.get('applicationDateFrom')
  const applicationDateTo = params.get('applicationDateTo')
  const interviewScheduled = toBooleanParam(params.get('interviewScheduled'))
  const recruiterDmReminderEnabled = toBooleanParam(params.get('recruiterDmReminderEnabled'))
  const page = Number(params.get('page') || 0)
  const size = Number(params.get('size') || 10)
  const sort = params.get('sort') || 'createdAt,desc'

  let items = archived ? snapshot.archived : snapshot.active

  if (recruiterName) {
    items = items.filter((app) => normalizeText(app.recruiterName).includes(recruiterName))
  }

  if (status) {
    if (status === 'TO_SEND_LATER') {
      items = items.filter((app) => !app.status)
    } else {
      items = items.filter((app) => app.status === status)
    }
  }

  if (applicationDateFrom) {
    const minDate = normalizeDateValue(applicationDateFrom)
    items = items.filter((app) => {
      const date = normalizeDateValue(app.applicationDate)
      return date && minDate && date >= minDate
    })
  }

  if (applicationDateTo) {
    const maxDate = normalizeDateValue(applicationDateTo)
    items = items.filter((app) => {
      const date = normalizeDateValue(app.applicationDate)
      return date && maxDate && date <= maxDate
    })
  }

  if (interviewScheduled !== null) {
    items = items.filter((app) => Boolean(app.interviewScheduled) === interviewScheduled)
  }

  if (recruiterDmReminderEnabled !== null) {
    items = items.filter((app) => Boolean(app.recruiterDmReminderEnabled) === recruiterDmReminderEnabled)
  }

  items = sortApplications(items, sort)

  const safePage = Number.isFinite(page) && page >= 0 ? page : 0
  const safeSize = Number.isFinite(size) && size > 0 ? size : 10
  const start = safePage * safeSize
  const content = items.slice(start, start + safeSize)

  return {
    content,
    number: safePage,
    size: safeSize,
    totalElements: items.length,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / safeSize)),
  }
}

const deriveApplicationById = (appId) => getAllApplications().find((app) => String(app.id) === String(appId)) || null

const buildCachedResponse = (config, payload) => ({
  data: payload.data,
  status: payload.status || 200,
  statusText: payload.statusText || 'OK',
  headers: payload.headers || {},
  config,
  request: null,
  cached: true,
})

const storeExactResponse = (config, response) => {
  if (typeof window === 'undefined') return
  const { cacheKey } = buildRequestParts(config)
  const cache = readExactCache()
  cache[cacheKey] = {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    cachedAt: new Date().toISOString(),
  }
  writeExactCache(cache)
}

const hydrateSnapshotFromGetResponse = (config, data) => {
  const { apiPath, params } = buildRequestParts(config)

  if (apiPath === '/applications') {
    const archived = toBooleanParam(params.get('archived')) ?? false
    const items = Array.isArray(data) ? data : data?.content
    if (!Array.isArray(items)) return

    const snapshot = getSnapshotCollections()
    const collectionName = archived ? 'archived' : 'active'
    const merged = items.reduce((list, app) => upsertApplication(list, { ...app, archived }), snapshot[collectionName])
    setSnapshotCollections({
      ...snapshot,
      [collectionName]: merged,
    })
    return
  }

  const detailMatch = apiPath.match(/^\/applications\/([^/]+)$/)
  if (detailMatch && data?.id) {
    const snapshot = getSnapshotCollections()
    const collectionName = data.archived ? 'archived' : 'active'
    const oppositeCollection = data.archived ? 'active' : 'archived'

    setSnapshotCollections({
      [collectionName]: upsertApplication(snapshot[collectionName], data),
      [oppositeCollection]: removeApplication(snapshot[oppositeCollection], data.id),
    })
  }
}

const parseRequestData = (config) => {
  const raw = config?.data
  if (!raw) return {}
  if (typeof raw === 'string') {
    return safeParse(raw, {})
  }
  return raw
}

const buildOptimisticApplication = (payload, id, timestamp) => normalizeApplication({
  id,
  vacancyName: payload.vacancyName ?? null,
  recruiterName: payload.recruiterName ?? null,
  organization: payload.organization ?? null,
  vacancyLink: payload.vacancyLink ?? null,
  applicationDate: payload.applicationDate ?? null,
  rhAcceptedConnection: Boolean(payload.rhAcceptedConnection),
  interviewScheduled: Boolean(payload.interviewScheduled),
  nextStepDateTime: payload.nextStepDateTime ?? null,
  status: payload.status ?? null,
  previousStatus: payload.previousStatus ?? null,
  recruiterDmReminderEnabled: Boolean(payload.recruiterDmReminderEnabled),
  recruiterDmSentAt: payload.recruiterDmSentAt ?? null,
  note: payload.note ?? null,
  archived: Boolean(payload.archived),
  archivedAt: payload.archivedAt ?? null,
  createdAt: payload.createdAt ?? timestamp,
  updatedAt: timestamp,
})

export const cacheSuccessfulGetResponse = (config, response) => {
  if (String(config?.method || 'get').toLowerCase() !== 'get') return
  storeExactResponse(config, response)
  hydrateSnapshotFromGetResponse(config, response.data)
}

export const getCachedGetResponse = (config) => {
  if (String(config?.method || 'get').toLowerCase() !== 'get') return null

  const { apiPath, cacheKey, params } = buildRequestParts(config)
  const allApps = getAllApplications()

  if (apiPath === '/dashboard/summary' && allApps.length) {
    return buildCachedResponse(config, { data: buildDashboardSummary(allApps) })
  }

  if (apiPath === '/applications' && allApps.length) {
    return buildCachedResponse(config, { data: deriveApplicationsPage(params) })
  }

  if (apiPath === '/applications/upcoming' && allApps.length) {
    return buildCachedResponse(config, { data: getReminderGroups(allApps).upcoming })
  }

  if (apiPath === '/applications/overdue' && allApps.length) {
    return buildCachedResponse(config, { data: getReminderGroups(allApps).overdue })
  }

  const detailMatch = apiPath.match(/^\/applications\/([^/]+)$/)
  if (detailMatch && allApps.length) {
    const found = deriveApplicationById(detailMatch[1])
    if (found) {
      return buildCachedResponse(config, { data: found })
    }
  }

  const cache = readExactCache()
  if (cache[cacheKey]) {
    return buildCachedResponse(config, cache[cacheKey])
  }

  return null
}

export const replaceApplicationSnapshot = ({ active, archived }) => {
  setSnapshotCollections({ active, archived })
}

export const applyMutationToOfflineSnapshot = (config, options = {}) => {
  const method = String(config?.method || '').toUpperCase()
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return

  const { apiPath } = buildRequestParts(config)
  const payload = parseRequestData(config)
  const responseData = options.responseData
  const timestamp = options.timestamp || new Date().toISOString()
  const snapshot = getSnapshotCollections()
  let active = snapshot.active
  let archived = snapshot.archived

  if (method === 'POST' && apiPath === '/applications') {
    const createdApp = responseData?.id
      ? normalizeApplication(responseData)
      : buildOptimisticApplication(payload, `offline-${options.offlineId || Date.now()}`, timestamp)
    active = upsertApplication(active, createdApp)
    setSnapshotCollections({ active, archived })
    return createdApp
  }

  const detailMatch = apiPath.match(/^\/applications\/([^/]+)(?:\/([^/]+))?$/)
  if (!detailMatch) return null

  const [, id, action] = detailMatch
  const existing = deriveApplicationById(id)

  if (method === 'DELETE') {
    active = removeApplication(active, id)
    archived = removeApplication(archived, id)
    setSnapshotCollections({ active, archived })
    return null
  }

  let nextApp = responseData?.id ? normalizeApplication(responseData) : existing
  if (!nextApp) return null

  if (method === 'PUT') {
    nextApp = buildOptimisticApplication({ ...nextApp, ...payload, id }, id, timestamp)
  }

  if (method === 'PATCH') {
    if (action === 'status') {
      nextApp = normalizeApplication({ ...nextApp, status: payload.status ?? nextApp.status, updatedAt: timestamp })
    }

    if (action === 'reminder') {
      nextApp = normalizeApplication({
        ...nextApp,
        recruiterDmReminderEnabled: Boolean(payload.recruiterDmReminderEnabled),
        updatedAt: timestamp,
      })
    }

    if (action === 'mark-dm-sent') {
      nextApp = normalizeApplication({ ...nextApp, recruiterDmSentAt: timestamp, updatedAt: timestamp })
    }

    if (action === 'archive') {
      nextApp = normalizeApplication({ ...nextApp, archived: true, archivedAt: timestamp, updatedAt: timestamp })
    }
  }

  if (nextApp.archived) {
    active = removeApplication(active, nextApp.id)
    archived = upsertApplication(archived, nextApp)
  } else {
    archived = removeApplication(archived, nextApp.id)
    active = upsertApplication(active, nextApp)
  }

  setSnapshotCollections({ active, archived })
  return nextApp
}

export const logOfflineCacheMiss = (config) => {
  const { apiPath } = buildRequestParts(config)
  logger.warn('Offline cache miss', { url: apiPath })
}