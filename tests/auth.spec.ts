import { test, expect } from '@playwright/test'
import { registerUser, loginUser, uniqueEmail } from './helpers/auth'

const PASSWORD = 'Test1234!'
const DASHBOARD_FIXTURE = {
  totalApplications: 7,
  waitingResponses: 3,
  interviewsScheduled: 2,
  overdueFollowUps: 1,
  dmRemindersEnabled: 4,
}

test.describe('Auth flow', () => {
  test('register a new user', async ({ page }) => {
    const email = uniqueEmail('reg')
    await registerUser(page, email, PASSWORD)

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('login with valid credentials', async ({ page }) => {
    const email = uniqueEmail('login')
    // First register so the account exists
    await registerUser(page, email, PASSWORD)
    // Then logout and login again
    await page.locator('[aria-label="Logout"]').click()
    await page.waitForURL('**/login')

    await loginUser(page, email, PASSWORD)

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('persist session after page reload', async ({ page }) => {
    const email = uniqueEmail('persist')
    await registerUser(page, email, PASSWORD)

    await page.reload()
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 })

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('persist session when backend is unreachable on reload (F5 scenario)', async ({ page }) => {
    const email = uniqueEmail('persist_offline')
    await registerUser(page, email, PASSWORD)

    // Simulate backend going down (e.g. pressing F5 in VS Code to restart Spring Boot)
    await page.route('**/api/v1/auth/me', (route) => route.abort('failed'))
    await page.route('**/api/v1/auth/refresh', (route) => route.abort('failed'))

    await page.reload()

    // App should not redirect to /login — session must be preserved
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('clear session when backend returns 401 on reload', async ({ page }) => {
    const email = uniqueEmail('persist_401')
    await registerUser(page, email, PASSWORD)

    // Simulate both /me and /refresh returning 401 (e.g. revoked/expired tokens)
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) })
    )
    await page.route('**/api/v1/auth/refresh', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) })
    )

    await page.reload()

    // Tokens are invalid — app must redirect to /login
    await page.waitForURL('**/login', { timeout: 15_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('refresh expired access token when protected endpoints return 403', async ({ page }) => {
    const email = uniqueEmail('expired_403')
    await registerUser(page, email, PASSWORD)

    let refreshCalls = 0
    let summaryCalls = 0
    let upcomingCalls = 0
    let overdueCalls = 0

    await page.route('**/api/v1/auth/refresh', async (route) => {
      refreshCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'refreshed-access-token',
        }),
      })
    })

    await page.route('**/api/v1/dashboard/summary', async (route) => {
      summaryCalls += 1
      if (summaryCalls === 1) {
        await route.fulfill({ status: 403, body: '' })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DASHBOARD_FIXTURE),
      })
    })

    await page.route('**/api/v1/applications/upcoming', async (route) => {
      upcomingCalls += 1
      if (upcomingCalls === 1) {
        await route.fulfill({ status: 403, body: '' })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.route('**/api/v1/applications/overdue', async (route) => {
      overdueCalls += 1
      if (overdueCalls === 1) {
        await route.fulfill({ status: 403, body: '' })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.reload()
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 })

    await expect(page.getByTestId('metric-total-value')).toHaveText('7')
    // React StrictMode can trigger duplicate effects in dev, which may produce
    // more than one refresh attempt while preserving correct behavior.
    await expect.poll(() => refreshCalls >= 1).toBe(true)
    await expect.poll(() => summaryCalls >= 2).toBe(true)
    await expect.poll(() => upcomingCalls >= 2).toBe(true)
    await expect.poll(() => overdueCalls >= 2).toBe(true)
  })

  test('logout redirects to login', async ({ page }) => {
    const email = uniqueEmail('logout')
    await registerUser(page, email, PASSWORD)

    await page.locator('[aria-label="Logout"]').click()
    await page.waitForURL('**/login', { timeout: 10_000 })

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login', { timeout: 10_000 })

    await expect(page).toHaveURL(/\/login/)
  })
})
