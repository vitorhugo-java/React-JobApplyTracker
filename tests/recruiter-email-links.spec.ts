import { test, expect, type Page } from '@playwright/test'
import { setupMockApplicationsApi } from './helpers/appApi'
import { setupMockAuth } from './helpers/auth'

const AUTH_STORAGE_KEY = 'auth-storage'

const apps = [
  {
    id: 101,
    vacancyName: 'Detail role',
    recruiterName: 'detail.recruiter@example.com',
    applicationDate: '2025-01-15',
    status: 'RH',
    archived: false,
    recruiterDmReminderEnabled: false,
    createdAt: '2025-01-15T12:00:00.000Z',
  },
  {
    id: 102,
    vacancyName: 'To send later role',
    recruiterName: 'queue.recruiter@example.com',
    applicationDate: null,
    status: null,
    archived: false,
    recruiterDmReminderEnabled: false,
    createdAt: '2025-01-16T12:00:00.000Z',
  },
  {
    id: 103,
    vacancyName: 'Overdue reminder role',
    recruiterName: 'overdue.recruiter@example.com',
    applicationDate: '2025-01-14',
    status: 'RH',
    archived: false,
    recruiterDmReminderEnabled: true,
    createdAt: '2025-01-14T00:00:00.000Z',
  },
]

async function injectAuth(page: Page) {
  const email = 'test@example.com'
  setupMockAuth(page, email, 'Test User')
  setupMockApplicationsApi(page, apps)
  await page.route('**/api/v1/applications/upcoming**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })
  await page.route('**/api/v1/applications/overdue**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([apps[2]]),
    })
  })

  await page.addInitScript(({ storageKey }) => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      state: {
        accessToken: 'pw-access-token',
        user: {
          id: 'pw-user-1',
          name: 'Test User',
          email: 'test@example.com',
          reminderTime: '19:00:00',
          roles: ['USER'],
          canUseGoogleIntegration: false,
        },
        theme: 'light',
      },
      version: 0,
    }))
  }, { storageKey: AUTH_STORAGE_KEY })
}

async function expectEmailLink(page: Page, email: string) {
  const link = page.getByRole('link', { name: email }).first()
  await expect(link).toHaveAttribute('href', `mailto:${email}`)
  return link
}

async function expectGmailComposePopup(page: Page, email: string) {
  const popupPromise = page.waitForEvent('popup')
  await (await expectEmailLink(page, email)).click()
  const popup = await popupPromise
  await expect.poll(() => decodeURIComponent(popup.url())).toContain(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`)
}

test.describe('Recruiter email links', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page)
  })

  test('opens recruiter email from application detail with Gmail compose fallback href', async ({ page }) => {
    await page.goto('/applications/101')
    await page.waitForURL('**/applications/101', { timeout: 10_000 })

    await expectGmailComposePopup(page, 'detail.recruiter@example.com')
  })

  test('renders recruiter email links in dashboard sections', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/dashboard', { timeout: 10_000 })

    await expectEmailLink(page, 'queue.recruiter@example.com')
    await expectEmailLink(page, 'overdue.recruiter@example.com')
  })

  test('renders recruiter email links in reminders lists', async ({ page }) => {
    await page.goto('/reminders')
    await page.waitForURL('**/reminders', { timeout: 10_000 })

    await expectEmailLink(page, 'overdue.recruiter@example.com')
  })

  test('renders recruiter email links in mobile application cards', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/applications')
    await page.waitForURL('**/applications', { timeout: 10_000 })

    await expectEmailLink(page, 'detail.recruiter@example.com')
  })
})
