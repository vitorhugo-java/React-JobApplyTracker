import { test, expect, type Page } from '@playwright/test'
import { setupMockApplicationsApi } from './helpers/appApi'
import { setupMockAuth } from './helpers/auth'

test.describe.configure({ mode: 'serial' })

/**
 * Atomic helper to ensure authentication is injected before app load.
 */
async function injectAuth(page: Page) {
  const email = 'test@example.com'
  setupMockAuth(page, email, 'Test User')
  setupMockApplicationsApi(page)
  
  await page.addInitScript(() => {
    window.localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        accessToken: 'pw-access-token',
        user: { id: 'pw-user-1', name: 'Test User', email: 'test@example.com' },
        theme: 'light'
      },
      version: 0
    }))
  })
}

async function createApplication(
  page: Page,
  vacancyName: string,
  recruiterName = ''
): Promise<void> {
  await page.getByTestId('new-application-btn').click()
  await page.waitForURL('**/applications/new')

  await page.getByTestId('app-vacancy-name').fill(vacancyName)
  if (recruiterName) {
    await page.getByTestId('app-recruiter-name').fill(recruiterName)
  }

  // Force date value directly into the DOM - Absolute PrimeReact CI fix
  await page.evaluate(() => {
    const input = document.querySelector('input#applicationDate') as HTMLInputElement;
    if (input) {
      input.value = '15/01/2025';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  });

  // State reconciliation buffer
  await page.waitForTimeout(500)

  // Wait for request and navigation
  const responsePromise = page.waitForResponse(r => 
    r.url().includes('/api/v1/applications') && r.request().method() === 'POST'
  )
  await page.getByTestId('app-submit').click()
  await responsePromise
  
  await page.waitForURL('**/applications', { timeout: 15000 })
}

test.describe('Application flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page)
    await page.goto('/applications')
    await expect(page.getByTestId('new-application-btn')).toBeVisible({ timeout: 10000 })
  })

  test('create a job application', async ({ page }) => {
    const vacancy = `Frontend Engineer ${Date.now()}`
    await createApplication(page, vacancy)
    await expect(page.getByTestId('app-row').getByText(vacancy)).toBeVisible()
  })

  test('filter applications by recruiter name', async ({ page }) => {
    const uniqueRecruiter = `Recruiter_${Date.now()}`
    const vacancy = `Job for filter ${Date.now()}`
    await createApplication(page, vacancy, uniqueRecruiter)

    await page.getByTestId('filter-recruiter').fill(uniqueRecruiter)
    await expect(page.getByTestId('app-row').filter({ hasText: vacancy })).toBeVisible()
  })

  test('sort applications by selected order', async ({ page }) => {
    const vacancyA = `Alpha Vacancy ${Date.now()}`
    const vacancyZ = `Zulu Vacancy ${Date.now()}`

    await createApplication(page, vacancyZ)
    await createApplication(page, vacancyA)

    await page.getByTestId('applications-sort').click()
    await page.getByRole('option', { name: 'Vacancy A-Z' }).click()

    const rows = page.getByTestId('app-row')
    await expect(rows.nth(0)).toContainText(vacancyA)
    await expect(rows.nth(1)).toContainText(vacancyZ)
  })

  test('edit application and save changes', async ({ page }) => {
    const original = `Edit Me ${Date.now()}`
    const updated = `Edited ${Date.now()}`

    await createApplication(page, original)

    const row = page.getByTestId('app-row').filter({ hasText: original })
    await row.getByTestId('inline-edit').click()
    await page.getByTestId('inline-edit-vacancy').fill(updated)
    
    const savePromise = page.waitForResponse(r => 
      r.url().includes('/api/v1/applications/') && r.request().method() === 'PUT'
    )
    await page.getByTestId('inline-save').click()
    await savePromise

    await expect(page.getByTestId('app-row').getByText(updated)).toBeVisible()
  })

  test('archive and delete application', async ({ page }) => {
    const vacancy = `Archive Me ${Date.now()}`
    await createApplication(page, vacancy)

    const row = page.getByTestId('app-row').filter({ hasText: vacancy })
    await row.getByRole('button', { name: 'Archive application' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Yes' }).click()

    await expect(page.getByText(vacancy)).not.toBeVisible()

    await page.getByTestId('applications-tab-archived').click()
    await expect(page.getByTestId('app-row').getByText(vacancy)).toBeVisible()
    
    await row.getByRole('button', { name: 'Delete application' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Yes' }).click()

    await expect(page.getByText(vacancy)).not.toBeVisible()
  })
})
