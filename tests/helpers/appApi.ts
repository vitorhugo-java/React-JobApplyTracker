import { type Page } from '@playwright/test'

type AppRecord = {
  id: number
  vacancyName: string | null
  recruiterName: string | null
  vacancyOpenedBy: string | null
  vacancyLink: string | null
  applicationDate: string | null
  rhAcceptedConnection: boolean
  interviewScheduled: boolean
  nextStepDateTime: string | null
  status: string | null
  recruiterDmReminderEnabled: boolean
  note: string | null
  archived: boolean
  archivedAt: string | null
  createdAt: string
}

const API_BASE = '**/api/v1'
const APPLICATIONS_COLLECTION_ROUTE = /\/api\/v1\/applications(?:\?.*)?$/
const SIX_HOURS_MS = 6 * 60 * 60 * 1000

const isSentReminder = (app: AppRecord): boolean => app.recruiterDmReminderEnabled && app.status != null

const compareValues = (left: string | null, right: string | null): number =>
  String(left || '').localeCompare(String(right || ''), undefined, { sensitivity: 'base' })

const compareDates = (left: string | null, right: string | null): number => {
  const leftTime = left ? new Date(left).getTime() : 0
  const rightTime = right ? new Date(right).getTime() : 0
  return leftTime - rightTime
}

const sortApps = (items: AppRecord[], sort: string | null): AppRecord[] => {
  const [field, direction = 'desc'] = String(sort || 'createdAt,desc').split(',')
  const factor = direction.toLowerCase() === 'asc' ? 1 : -1

  return [...items].sort((left, right) => {
    let comparison = 0

    switch (field) {
      case 'vacancyName':
      case 'recruiterName':
      case 'status':
        comparison = compareValues(left[field] as string | null, right[field] as string | null)
        break
      case 'applicationDate':
      case 'nextStepDateTime':
      case 'createdAt':
        comparison = compareDates(left[field] as string | null, right[field] as string | null)
        break
      default:
        comparison = compareDates(left.createdAt, right.createdAt)
        break
    }

    return comparison * factor
  })
}

const toNumber = (value: string | null): number | null => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseIdFromUrl = (url: string): number | null => {
  const match = url.match(/\/applications\/(\d+)/)
  return toNumber(match?.[1] ?? null)
}

const toPagedResponse = (items: AppRecord[], page: number, size: number) => ({
  content: items.slice(page * size, (page + 1) * size),
  number: page,
  size,
  totalElements: items.length,
  total: items.length,
  totalPages: Math.max(1, Math.ceil(items.length / size)),
})

const cloneApp = (app: AppRecord) => ({ ...app })

export function setupMockApplicationsApi(page: Page): void {
  const apps: AppRecord[] = []
  let nextId = 1

  const findById = (id: number): AppRecord | undefined => apps.find((app) => app.id === id)

  void page.route(`${API_BASE}/dashboard/summary`, async (route) => {
    const activeApps = apps.filter((app) => !app.archived)
    const overdueFollowUps = activeApps.filter((app) => {
      if (!isSentReminder(app)) return false
      return Date.now() - new Date(app.createdAt).getTime() >= SIX_HOURS_MS
    })

    const summary = {
      totalApplications: activeApps.length,
      waitingResponses: activeApps.filter((a) => a.status === 'RH').length,
      interviewsScheduled: activeApps.filter((a) => a.interviewScheduled).length,
      overdueFollowUps: overdueFollowUps.length,
      dmRemindersEnabled: activeApps.filter((a) => isSentReminder(a)).length,
      toSendLater: activeApps.filter((a) => a.status == null).length,
      rejectedCount: activeApps.filter((a) => a.status === 'Rejeitado').length,
      ghostingCount: activeApps.filter((a) => a.status === 'Ghosting').length,
      averageDailyApplications: Number((activeApps.length / 30).toFixed(2)),
      averageWeeklyApplications: Number((activeApps.length / 12).toFixed(2)),
      averageMonthlyApplications: Number((activeApps.length / 12).toFixed(2)),
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(summary),
    })
  })

  void page.route(`${API_BASE}/applications/upcoming`, async (route) => {
    const now = Date.now()
    const upcoming = apps.filter((app) => {
      if (!isSentReminder(app)) return false
      return now - new Date(app.createdAt).getTime() < SIX_HOURS_MS
    })

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(upcoming.map(cloneApp)),
    })
  })

  void page.route(`${API_BASE}/applications/overdue`, async (route) => {
    const now = Date.now()
    const overdue = apps.filter((app) => {
      if (!isSentReminder(app)) return false
      return now - new Date(app.createdAt).getTime() >= SIX_HOURS_MS
    })

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overdue.map(cloneApp)),
    })
  })

  void page.route(APPLICATIONS_COLLECTION_ROUTE, async (route) => {
    const request = route.request()
    const method = request.method()

    if (method === 'GET') {
      const url = new URL(request.url())
      const recruiterName = (url.searchParams.get('recruiterName') || '').toLowerCase()
      const status = url.searchParams.get('status')
      const archived = url.searchParams.get('archived') === 'true'
      const page = Number(url.searchParams.get('page') || '0')
      const size = Number(url.searchParams.get('size') || '10')
      const sort = url.searchParams.get('sort')

      let filtered = apps.filter((app) => app.archived === archived)
      if (recruiterName) {
        filtered = filtered.filter((app) => (app.recruiterName || '').toLowerCase().includes(recruiterName))
      }
      if (status) {
        if (status === 'TO_SEND_LATER') {
          filtered = filtered.filter((app) => app.status == null)
        } else {
          filtered = filtered.filter((app) => app.status === status)
        }
      }

      filtered = sortApps(filtered, sort)

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(toPagedResponse(filtered.map(cloneApp), page, size)),
      })
      return
    }

    if (method === 'POST') {
      const payload = request.postDataJSON() as Partial<AppRecord>
      const app: AppRecord = {
        id: nextId++,
        vacancyName: payload.vacancyName ?? null,
        recruiterName: payload.recruiterName ?? null,
        vacancyOpenedBy: payload.vacancyOpenedBy ?? null,
        vacancyLink: payload.vacancyLink ?? null,
        applicationDate: payload.applicationDate ?? null,
        rhAcceptedConnection: Boolean(payload.rhAcceptedConnection),
        interviewScheduled: Boolean(payload.interviewScheduled),
        nextStepDateTime: payload.nextStepDateTime ?? null,
        status: payload.status ?? 'RH',
        recruiterDmReminderEnabled: Boolean(payload.recruiterDmReminderEnabled),
        note: payload.note ?? null,
        archived: false,
        archivedAt: null,
        createdAt: new Date().toISOString(),
      }

      apps.push(app)
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(cloneApp(app)),
      })
      return
    }

    await route.continue()
  })

  void page.route(`${API_BASE}/applications/*/status`, async (route) => {
    const id = parseIdFromUrl(route.request().url())
    if (id === null) {
      await route.fulfill({ status: 400, body: '' })
      return
    }

    const app = findById(id)
    if (!app) {
      await route.fulfill({ status: 404, body: '' })
      return
    }

    const payload = route.request().postDataJSON() as { status?: string | null }
    app.status = payload.status === undefined ? app.status : payload.status

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(cloneApp(app)),
    })
  })

  void page.route(`${API_BASE}/applications/*/reminder`, async (route) => {
    const id = parseIdFromUrl(route.request().url())
    if (id === null) {
      await route.fulfill({ status: 400, body: '' })
      return
    }

    const app = findById(id)
    if (!app) {
      await route.fulfill({ status: 404, body: '' })
      return
    }

    const payload = route.request().postDataJSON() as { recruiterDmReminderEnabled?: boolean }
    app.recruiterDmReminderEnabled = Boolean(payload.recruiterDmReminderEnabled)

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(cloneApp(app)),
    })
  })

  void page.route(`${API_BASE}/applications/*/archive`, async (route) => {
    const id = parseIdFromUrl(route.request().url())
    if (id === null) {
      await route.fulfill({ status: 400, body: '' })
      return
    }

    const app = findById(id)
    if (!app) {
      await route.fulfill({ status: 404, body: '' })
      return
    }

    app.archived = true
    app.archivedAt = new Date().toISOString()

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(cloneApp(app)),
    })
  })

  void page.route(`${API_BASE}/applications/*/mark-dm-sent`, async (route) => {
    const id = parseIdFromUrl(route.request().url())
    if (id === null) {
      await route.fulfill({ status: 400, body: '' })
      return
    }

    const app = findById(id)
    if (!app) {
      await route.fulfill({ status: 404, body: '' })
      return
    }

    app.recruiterDmReminderEnabled = false

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(cloneApp(app)),
    })
  })

  void page.route(`${API_BASE}/applications/*`, async (route) => {
    const request = route.request()
    const method = request.method()
    const id = parseIdFromUrl(request.url())

    if (id === null) {
      await route.fulfill({ status: 400, body: '' })
      return
    }

    const app = findById(id)

    if (method === 'GET') {
      if (!app) {
        await route.fulfill({ status: 404, body: '' })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cloneApp(app)),
      })
      return
    }

    if (method === 'PUT') {
      if (!app) {
        await route.fulfill({ status: 404, body: '' })
        return
      }

      const payload = request.postDataJSON() as Partial<AppRecord>
      Object.assign(app, {
        ...payload,
        vacancyName: payload.vacancyName ?? app.vacancyName,
      })

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cloneApp(app)),
      })
      return
    }

    if (method === 'DELETE') {
      const index = apps.findIndex((item) => item.id === id)
      if (index >= 0) {
        apps.splice(index, 1)
      }
      await route.fulfill({ status: 204, body: '' })
      return
    }

    await route.continue()
  })
}
