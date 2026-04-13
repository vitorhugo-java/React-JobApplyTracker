import { test, expect, type Page } from '@playwright/test'
import { registerUser, uniqueEmail } from './helpers/auth'

const PASSWORD = 'Test1234!'

/** Fill and submit the application form with minimal required fields. */
async function createApplication(
  page: Page,
  vacancyName: string,
  recruiterName = ''
): Promise<void> {
  await page.locator('[data-testid="new-application-btn"]').click()
  await page.waitForURL('**/applications/new')

  await page.locator('[data-testid="app-vacancy-name"]').fill(vacancyName)

  if (recruiterName) {
    await page.locator('[data-testid="app-recruiter-name"]').fill(recruiterName)
  }

  // Fill the application date by typing into the Calendar input
  const dateInput = page.getByPlaceholder('Select date')
  await dateInput.fill('01/15/2025')
  await dateInput.press('Escape')

  await page.locator('[data-testid="app-submit"]').click()
  await page.waitForURL('**/applications', { timeout: 15_000 })
}

test.describe('Application flow', () => {
  let sharedEmail: string

  test.beforeAll(async ({ browser }) => {
    sharedEmail = uniqueEmail('apps')
    const page = await browser.newPage()
    await registerUser(page, sharedEmail, PASSWORD)
    await page.context().storageState({ path: 'tests/.auth-apps.json' })
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([])
    // Restore saved auth state
    await page.goto('/applications')
    // If redirected to login, log in again
    if (page.url().includes('/login')) {
      await page.locator('[data-testid="login-email"]').fill(sharedEmail)
      await page.locator('[data-testid="login-password"]').fill(PASSWORD)
      await page.locator('[data-testid="login-submit"]').click()
      await page.waitForURL('**/dashboard')
      await page.goto('/applications')
    }
    await page.waitForURL('**/applications', { timeout: 10_000 })
  })

  test('create a job application', async ({ page }) => {
    const vacancy = `Frontend Engineer ${Date.now()}`
    await createApplication(page, vacancy)

    await expect(page.locator('[data-testid="app-row"]').first()).toBeVisible()
    await expect(page.getByText(vacancy)).toBeVisible()
  })

  test('view application list page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()
    await expect(page.locator('[data-testid="new-application-btn"]')).toBeVisible()
  })

  test('filter applications by recruiter name', async ({ page }) => {
    const uniqueRecruiter = `Recruiter_${Date.now()}`
    const vacancy = `Job for filter ${Date.now()}`
    await createApplication(page, vacancy, uniqueRecruiter)

    // Use the recruiter filter
    await page.locator('[data-testid="filter-recruiter"]').fill(uniqueRecruiter)
    // Wait for the debounce / re-fetch
    await page.waitForTimeout(600)

    await expect(page.getByText(vacancy)).toBeVisible()
  })

  test('edit application and save changes', async ({ page }) => {
    const original = `Edit Me ${Date.now()}`
    const updated = `Edited ${Date.now()}`

    await createApplication(page, original)

    // Find and click the edit button for the created row
    const row = page.locator('[data-testid="app-row"]').filter({ hasText: original })
    await row.getByRole('button').nth(1).click() // Edit button (2nd action icon)
    await page.waitForURL(/\/applications\/.*\/edit/)

    await page.locator('[data-testid="app-vacancy-name"]').fill(updated)
    await page.locator('[data-testid="app-submit"]').click()
    await page.waitForURL(/\/applications\/\d+$/, { timeout: 15_000 })

    await expect(page.getByText(updated)).toBeVisible()
  })

  test('update application status via edit form', async ({ page }) => {
    const vacancy = `Status Test ${Date.now()}`
    await createApplication(page, vacancy)

    const row = page.locator('[data-testid="app-row"]').filter({ hasText: vacancy })
    await row.getByRole('button').nth(1).click()
    await page.waitForURL(/\/applications\/.*\/edit/)

    // Open the status dropdown and select a different status
    await page.locator('[data-testid="app-status"]').click()
    await page.locator('.p-dropdown-item').filter({ hasText: 'Teste Técnico' }).first().click()

    await page.locator('[data-testid="app-submit"]').click()
    await page.waitForURL(/\/applications\/\d+$/, { timeout: 15_000 })

    await expect(page.getByText('Teste Técnico')).toBeVisible()
  })

  test('delete an application', async ({ page }) => {
    const vacancy = `Delete Me ${Date.now()}`
    await createApplication(page, vacancy)

    const row = page.locator('[data-testid="app-row"]').filter({ hasText: vacancy })
    // Click the delete button (3rd action icon)
    await row.getByRole('button').nth(2).click()

    // Confirm the deletion dialog
    await page.locator('.p-confirm-dialog-accept').click()
    await page.waitForTimeout(1000)

    await expect(page.getByText(vacancy)).not.toBeVisible()
  })
})
