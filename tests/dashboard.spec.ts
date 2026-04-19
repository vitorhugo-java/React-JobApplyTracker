import { test, expect } from '@playwright/test'
import { loginUser, registerUser, uniqueEmail } from './helpers/auth'
import { setupMockApplicationsApi } from './helpers/appApi'

const PASSWORD = 'Test1234!'

test.describe('Dashboard', () => {
  let email: string

  test.beforeAll(async ({ browser }) => {
    email = uniqueEmail('dashboard')
    const page = await browser.newPage()
    await registerUser(page, email, PASSWORD)
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    setupMockApplicationsApi(page)
    await loginUser(page, email, PASSWORD)
    await page.goto('/dashboard')
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
  })

  test('renders all metric cards', async ({ page }) => {
    const metricIds = [
      'metric-total',
      'metric-waiting',
      'metric-interviews',
      'metric-overdue',
      'metric-reminders',
      'metric-to-send-later',
      'metric-rejected',
      'metric-ghosting',
      'metric-average-daily',
      'metric-average-weekly',
      'metric-average-monthly',
    ]

    for (const id of metricIds) {
      await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible()
    }
  })

  test('metric cards display numeric values', async ({ page }) => {
    const metricIds = [
      'metric-total-value',
      'metric-waiting-value',
      'metric-interviews-value',
      'metric-overdue-value',
      'metric-reminders-value',
      'metric-to-send-later-value',
      'metric-rejected-value',
      'metric-ghosting-value',
      'metric-average-daily-value',
      'metric-average-weekly-value',
      'metric-average-monthly-value',
    ]

    for (const id of metricIds) {
      const el = page.locator(`[data-testid="${id}"]`)
      await expect(el).toBeVisible()
      const text = await el.textContent()
      expect(Number(text)).toBeGreaterThanOrEqual(0)
    }
  })

  test('displays Upcoming Steps and Overdue Follow-ups sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Upcoming Steps', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Overdue Follow-ups', exact: true })).toBeVisible()
  })

  test('dashboard page heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })
})
