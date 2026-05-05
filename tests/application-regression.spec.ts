import { test, expect } from '@playwright/test'
import { registerUser, uniqueEmail } from './helpers/auth'
import { setupMockApplicationsApi } from './helpers/appApi'

const PASSWORD = 'Test1234!'

test('regression: application create sends LocalDate and saves without server error', async ({ page }) => {
  const email = uniqueEmail('app_regression')
  const vacancyName = `Regression Vacancy ${Date.now()}`

  setupMockApplicationsApi(page)
  await registerUser(page, email, PASSWORD)
  await page.goto('/applications')
  await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()

  await page.getByTestId('new-application-btn').click()
  await page.waitForURL('**/applications/new')

  await page.getByTestId('app-vacancy-name').fill(vacancyName)
  await page.getByTestId('app-recruiter-name').fill('QA Team')
  // app-vacancy-link already has data-testid in ApplicationForm.jsx
  await page.getByTestId('app-vacancy-link').fill('https://example.com/jobs/regression')

  // NOTE: Add pt={{ input: { 'data-testid': 'app-application-date' } }} to the
  // applicationDate Calendar component in ApplicationForm.jsx for this locator to work.
  const dateInput = page.getByTestId('app-application-date')
  await dateInput.fill('13/04/2026')
  await dateInput.press('Escape')

  const createRequestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().includes('/api/v1/applications')
  )
  const createResponsePromise = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.url().includes('/api/v1/applications')
  )

  await page.getByTestId('app-submit').click()

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
  await expect(page.getByTestId('app-row').getByText(vacancyName)).toBeVisible()
  await expect(page.getByText('Failed to save application.')).not.toBeVisible()
})
