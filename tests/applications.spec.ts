import { test, expect, type Page } from '@playwright/test'
import { loginUser, registerUser, uniqueEmail } from './helpers/auth'

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

  // Fill the application date by typing into the Calendar input.
  const dateInput = page.locator('input#applicationDate_input, input#applicationDate').first()
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

    const row = page.locator('[data-testid="app-row"]').filter({ hasText: original })
    await row.locator('[data-testid="inline-edit"]').click()

    await row.locator('[data-testid="inline-edit-vacancy"]').fill(updated)
    await row.locator('[data-testid="inline-save"]').click()
    await page.waitForTimeout(600)

    await expect(page.getByText(updated)).toBeVisible()
  })

  test('update application status via edit form', async ({ page }) => {
    const vacancy = `Status Test ${Date.now()}`
    await createApplication(page, vacancy)

    const row = page.locator('[data-testid="app-row"]').filter({ hasText: vacancy })
    await row.locator('[data-testid="inline-edit"]').click()

    await row.locator('[data-testid="inline-edit-status"]').click()
    await page.locator('.p-dropdown-item').filter({ hasText: 'Teste Técnico' }).first().click()

    await row.locator('[data-testid="inline-save"]').click()
    await page.waitForTimeout(600)

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

  test('queue changes while offline and sync when back online', async ({ page }) => {
    test.setTimeout(90_000)

    const vacancy = `Offline Sync ${Date.now()}`
    const mockedApplications: Array<Record<string, unknown>> = []
    let apiOffline = false

    await loginUser(page, sharedEmail, PASSWORD)

    await page.route(/\/api\/applications(?:\?.*)?$/, async (route) => {
      const request = route.request()
      const method = request.method()

      if (method === 'POST') {
        if (apiOffline) {
          await route.abort('internetdisconnected')
          return
        }

        const payload = request.postDataJSON() as Record<string, unknown>
        mockedApplications.push({
          id: mockedApplications.length + 1,
          ...payload,
        })
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockedApplications[mockedApplications.length - 1]),
        })
        return
      }

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockedApplications),
        })
        return
      }

      await route.continue()
    })

    apiOffline = true
    await page.goto('/applications')
    await page.waitForURL('**/applications', { timeout: 15_000 })

    await page.evaluate((vacancyName) => {
      const key = 'jobtracker:offline-request-queue'
      const queue = [
        {
          id: `test-${Date.now()}`,
          createdAt: new Date().toISOString(),
          request: {
            url: '/applications',
            method: 'POST',
            data: {
              vacancyName,
              recruiterName: 'Offline Recruiter',
              applicationDate: '2025-01-15',
              status: 'RH',
              recruiterDmReminderEnabled: false,
              rhAcceptedConnection: false,
              interviewScheduled: false,
              nextStepDateTime: null,
              vacancyOpenedBy: null,
              vacancyLink: null,
            },
            params: null,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        },
      ]
      window.localStorage.setItem(key, JSON.stringify(queue))
    }, vacancy)

    await page.reload()
    await page.waitForURL('**/applications', { timeout: 15_000 })

    await expect(page.locator('[data-testid="sync-status-text"]')).toContainText('1 alteracoes pendentes')

    apiOffline = false
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect(page.locator('[data-testid="sync-status-text"]')).toHaveText('Sincronizado', {
      timeout: 20_000,
    })

    await page.goto('/applications')
    await expect(page.getByText(vacancy)).toBeVisible({ timeout: 15_000 })
  })
})
