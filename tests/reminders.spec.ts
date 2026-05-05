import { test, expect } from '@playwright/test'
import { loginUser, registerUser, uniqueEmail } from './helpers/auth'
import { setupMockApplicationsApi } from './helpers/appApi'

const PASSWORD = 'Test1234!'

test.describe('Reminder flow', () => {
  let email: string

  test.beforeAll(async ({ browser }) => {
    email = uniqueEmail('reminder')
    const page = await browser.newPage()
    await registerUser(page, email, PASSWORD)
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    setupMockApplicationsApi(page)
    await loginUser(page, email, PASSWORD)
    await page.goto('/applications')
    await page.waitForURL('**/applications', { timeout: 10_000 })
  })

  test('reminder UI appears when recruiterName is set', async ({ page }) => {
    const vacancy = `Reminder Test ${Date.now()}`
    const recruiterName = `Jane Doe ${Date.now()}`

    // Create an application with a recruiter name
    await page.getByTestId('new-application-btn').click()
    await page.waitForURL('**/applications/new')

    await page.getByTestId('app-vacancy-name').fill(vacancy)
    await page.getByTestId('app-recruiter-name').fill(recruiterName)

    // NOTE: Add pt={{ input: { 'data-testid': 'app-application-date' } }} to the
    // applicationDate Calendar component in ApplicationForm.jsx for this locator to work.
    const dateInput = page.getByTestId('app-application-date')
    await dateInput.fill('15/01/2025')
    await dateInput.press('Escape')

    await page.getByTestId('app-submit').click()
    await page.waitForURL('**/applications', { timeout: 15_000 })

    // Navigate to the detail page for this application
    const row = page.getByTestId('app-row').filter({ hasText: vacancy })
    // NOTE: Add data-testid="app-vacancy-cell" to the first <td> in the app-row
    // table rows inside ApplicationsList.jsx for this locator to work.
    await row.getByTestId('app-vacancy-cell').click()
    await page.waitForURL(/\/applications\/\d+$/, { timeout: 10_000 })

    // The reminder section should be visible because recruiterName is set
    await expect(page.getByText('Recruiter DM Reminder')).toBeVisible()
  })

  test('reminder section is hidden when recruiterName is not set', async ({ page }) => {
    const vacancy = `No Recruiter ${Date.now()}`

    await page.getByTestId('new-application-btn').click()
    await page.waitForURL('**/applications/new')

    await page.getByTestId('app-vacancy-name').fill(vacancy)
    // Intentionally leave recruiterName empty

    // NOTE: Add pt={{ input: { 'data-testid': 'app-application-date' } }} to the
    // applicationDate Calendar component in ApplicationForm.jsx for this locator to work.
    const dateInput = page.getByTestId('app-application-date')
    await dateInput.fill('15/01/2025')
    await dateInput.press('Escape')

    await page.getByTestId('app-submit').click()
    await page.waitForURL('**/applications', { timeout: 15_000 })

    const row = page.getByTestId('app-row').filter({ hasText: vacancy })
    // NOTE: Add data-testid="app-vacancy-cell" to the first <td> in the app-row
    // table rows inside ApplicationsList.jsx for this locator to work.
    await row.getByTestId('app-vacancy-cell').click()
    await page.waitForURL(/\/applications\/\d+$/, { timeout: 10_000 })

    // Reminder section should NOT appear
    await expect(page.getByText('Recruiter DM Reminder')).not.toBeVisible()
  })

  test('separates reminders at the exact 6-hour boundary', async ({ page }) => {
    await loginUser(page, email, PASSWORD)

    const now = new Date('2026-04-13T12:00:00.000Z')
    const sixHoursMs = 6 * 60 * 60 * 1000

    const apps = [
      {
        id: 'app-upcoming',
        vacancyName: 'Upcoming < 6h',
        recruiterName: 'Alice',
        status: 'RH',
        recruiterDmReminderEnabled: true,
        createdAt: new Date(now.getTime() - sixHoursMs + 60_000).toISOString(),
      },
      {
        id: 'app-boundary',
        vacancyName: 'Boundary == 6h',
        recruiterName: 'Bob',
        status: 'RH',
        recruiterDmReminderEnabled: true,
        createdAt: new Date(now.getTime() - sixHoursMs).toISOString(),
      },
      {
        id: 'app-overdue',
        vacancyName: 'Overdue > 6h',
        recruiterName: 'Carol',
        status: 'RH',
        recruiterDmReminderEnabled: true,
        createdAt: new Date(now.getTime() - sixHoursMs - 60_000).toISOString(),
      },
    ]

    const threshold = new Date(now.getTime() - sixHoursMs)
    const upcoming = apps.filter((app) => new Date(app.createdAt) > threshold)
    const overdue = apps.filter((app) => new Date(app.createdAt) <= threshold)

    await page.route('**/api/v1/applications/upcoming', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(upcoming),
      })
    })

    await page.route('**/api/v1/applications/overdue', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(overdue),
      })
    })

    await page.goto('/reminders')
    await page.waitForURL('**/reminders', { timeout: 10_000 })
    await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/v1/applications/upcoming') && response.ok()),
      page.waitForResponse((response) => response.url().includes('/api/v1/applications/overdue') && response.ok()),
    ])

    // NOTE: Add data-testid="reminders-upcoming-section" and
    // data-testid="reminders-overdue-section" to the Section wrapper <div>s
    // in Reminders.jsx for these locators to work.
    const upcomingSection = page.getByTestId('reminders-upcoming-section')
    const overdueSection = page.getByTestId('reminders-overdue-section')

    await expect(upcomingSection.getByText('Upcoming < 6h')).toBeVisible()
    await expect(upcomingSection.getByText('Boundary == 6h')).not.toBeVisible()
    await expect(upcomingSection.getByText('Overdue > 6h')).not.toBeVisible()

    await expect(overdueSection.getByText('Boundary == 6h')).toBeVisible()
    await expect(overdueSection.getByText('Overdue > 6h')).toBeVisible()
    await expect(overdueSection.getByText('Upcoming < 6h')).not.toBeVisible()
  })
})
