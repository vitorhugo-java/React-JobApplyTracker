import { test, expect } from '@playwright/test'
import { registerUser, uniqueEmail } from './helpers/auth'

const PASSWORD = 'Test1234!'

test('regression: application create sends LocalDate and saves without server error', async ({ page }) => {
  const email = uniqueEmail('app_regression')
  const vacancyName = `Regression Vacancy ${Date.now()}`

  await registerUser(page, email, PASSWORD)
  await page.goto('/applications')
  await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()

  await page.locator('[data-testid="new-application-btn"]').click()
  await page.waitForURL('**/applications/new')

  await page.locator('[data-testid="app-vacancy-name"]').fill(vacancyName)
  await page.getByPlaceholder('Company name or recruiter').fill('QA Team')
  await page.getByPlaceholder('https://...').fill('https://example.com/jobs/regression')

  const dateInput = page.getByPlaceholder('Select date').first()
  await dateInput.fill('04/13/2026')
  await dateInput.press('Escape')

  const createRequestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().includes('/api/applications')
  )
  const createResponsePromise = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().includes('/api/applications')
  )

  await page.locator('[data-testid="app-submit"]').click()

  const createRequest = await createRequestPromise
  const payload = createRequest.postDataJSON() as {
    applicationDate?: string
    nextStepDateTime?: string | null
  }

  expect(payload.applicationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  expect(payload.applicationDate).toBe('2026-04-13')
  expect(payload.nextStepDateTime ?? null).toBeNull()

  const createResponse = await createResponsePromise
  expect(createResponse.status(), 'Create application must not fail with HTTP 500').toBeLessThan(500)
  expect(createResponse.ok(), 'Create application must succeed').toBeTruthy()

  await page.waitForURL('**/applications', { timeout: 15_000 })
  await expect(page.getByText(vacancyName)).toBeVisible()
  await expect(page.getByText('Failed to save application.')).not.toBeVisible()
})
