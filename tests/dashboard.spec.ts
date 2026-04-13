import { test, expect, type Page } from '@playwright/test'
import { registerUser, uniqueEmail } from './helpers/auth'

const PASSWORD = 'Test1234!'

async function ensureLoggedIn(page: Page, email: string): Promise<void> {
  if (page.url().includes('/login')) {
    await page.locator('[data-testid="login-email"]').fill(email)
    await page.locator('[data-testid="login-password"]').fill(PASSWORD)
    await page.locator('[data-testid="login-submit"]').click()
    await page.waitForURL('**/dashboard')
  }
}

test.describe('Dashboard', () => {
  let email: string

  test.beforeAll(async ({ browser }) => {
    email = uniqueEmail('dashboard')
    const page = await browser.newPage()
    await registerUser(page, email, PASSWORD)
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await ensureLoggedIn(page, email)
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
  })

  test('renders all metric cards', async ({ page }) => {
    const metricIds = [
      'metric-total',
      'metric-waiting',
      'metric-interviews',
      'metric-overdue',
      'metric-reminders',
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
    ]

    for (const id of metricIds) {
      const el = page.locator(`[data-testid="${id}"]`)
      await expect(el).toBeVisible()
      const text = await el.textContent()
      expect(Number(text)).toBeGreaterThanOrEqual(0)
    }
  })

  test('displays Upcoming Steps and Overdue Follow-ups sections', async ({ page }) => {
    await expect(page.getByText('Upcoming Steps')).toBeVisible()
    await expect(page.getByText('Overdue Follow-ups')).toBeVisible()
  })

  test('dashboard page heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })
})
