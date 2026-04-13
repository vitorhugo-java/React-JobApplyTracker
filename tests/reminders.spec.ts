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

test.describe('Reminder flow', () => {
  let email: string

  test.beforeAll(async ({ browser }) => {
    email = uniqueEmail('reminder')
    const page = await browser.newPage()
    await registerUser(page, email, PASSWORD)
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/applications')
    await ensureLoggedIn(page, email)
    await page.waitForURL('**/applications', { timeout: 10_000 })
  })

  test('reminder UI appears when recruiterName is set', async ({ page }) => {
    const vacancy = `Reminder Test ${Date.now()}`
    const recruiterName = `Jane Doe ${Date.now()}`

    // Create an application with a recruiter name
    await page.locator('[data-testid="new-application-btn"]').click()
    await page.waitForURL('**/applications/new')

    await page.locator('[data-testid="app-vacancy-name"]').fill(vacancy)
    await page.locator('[data-testid="app-recruiter-name"]').fill(recruiterName)

    const dateInput = page.getByPlaceholder('Select date')
    await dateInput.fill('01/15/2025')
    await dateInput.press('Escape')

    await page.locator('[data-testid="app-submit"]').click()
    await page.waitForURL('**/applications', { timeout: 15_000 })

    // Navigate to the detail page for this application
    const row = page.locator('[data-testid="app-row"]').filter({ hasText: vacancy })
    await row.locator('td').first().click()
    await page.waitForURL(/\/applications\/\d+$/, { timeout: 10_000 })

    // The reminder section should be visible because recruiterName is set
    await expect(page.getByText('Recruiter DM Reminder')).toBeVisible()
  })

  test('reminder section is hidden when recruiterName is not set', async ({ page }) => {
    const vacancy = `No Recruiter ${Date.now()}`

    await page.locator('[data-testid="new-application-btn"]').click()
    await page.waitForURL('**/applications/new')

    await page.locator('[data-testid="app-vacancy-name"]').fill(vacancy)
    // Intentionally leave recruiterName empty

    const dateInput = page.getByPlaceholder('Select date')
    await dateInput.fill('01/15/2025')
    await dateInput.press('Escape')

    await page.locator('[data-testid="app-submit"]').click()
    await page.waitForURL('**/applications', { timeout: 15_000 })

    const row = page.locator('[data-testid="app-row"]').filter({ hasText: vacancy })
    await row.locator('td').first().click()
    await page.waitForURL(/\/applications\/\d+$/, { timeout: 10_000 })

    // Reminder section should NOT appear
    await expect(page.getByText('Recruiter DM Reminder')).not.toBeVisible()
  })
})
