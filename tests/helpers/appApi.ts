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
  status: string
  recruiterDmReminderEnabled: boolean
  createdAt: string
}

const API_BASE = '**/api/v1'
const APPLICATIONS_COLLECTION_ROUTE = /\/api\/v1\/applications(?:\?.*)?$/

const toNumber = (value: string | null): number | null => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseIdFromUrl = (url: string): number | null => {
  const match = url.match(/\/applications\/(\d+)/)
  return toNumber(match?.[1] ?? null)
}

const toPagedResponse = (items: AppRecord[]) => ({
  content: items,
  totalElements: items.length,
  total: items.length,
})

const cloneApp = (app: AppRecord) => ({ ...app })

export function setupMockApplicationsApi(page: Page): void {
  const apps: AppRecord[] = []
  let nextId = 1

  const findById = (id: number): AppRecord | undefined => apps.find((app) => app.id === id)

  void page.route(`${API_BASE}/dashboard/summary`, async (route) => {
    const summary = {
      totalApplications: apps.length,
      waitingResponses: apps.filter((a) => a.status === 'RH').length,
      interviewsScheduled: apps.filter((a) => a.interviewScheduled).length,
      overdueFollowUps: apps.filter((a) => a.recruiterDmReminderEnabled).length,
      dmRemindersEnabled: apps.filter((a) => a.recruiterDmReminderEnabled).length,
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(summary),
    })
  })

  void page.route(`${API_BASE}/applications/upcoming`, async (route) => {
    const now = Date.now()
    const thresholdMs = 6 * 60 * 60 * 1000
    const upcoming = apps.filter((app) => {
      if (!app.recruiterDmReminderEnabled) return false
      return now - new Date(app.createdAt).getTime() < thresholdMs
    })

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(upcoming.map(cloneApp)),
    })
  })

  void page.route(`${API_BASE}/applications/overdue`, async (route) => {
    const now = Date.now()
    const thresholdMs = 6 * 60 * 60 * 1000
    const overdue = apps.filter((app) => {
      if (!app.recruiterDmReminderEnabled) return false
      return now - new Date(app.createdAt).getTime() >= thresholdMs
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

      let filtered = apps
      if (recruiterName) {
        filtered = filtered.filter((app) => (app.recruiterName || '').toLowerCase().includes(recruiterName))
      }
      if (status) {
        filtered = filtered.filter((app) => app.status === status)
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(toPagedResponse(filtered.map(cloneApp))),
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
        status: payload.status || 'RH',
        recruiterDmReminderEnabled: Boolean(payload.recruiterDmReminderEnabled),
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

    const payload = route.request().postDataJSON() as { status?: string }
    app.status = payload.status || app.status

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
