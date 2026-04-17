import { type Page } from '@playwright/test'

const API_V1 = '**/api/v1'

export function setupMockAuth(page: Page, email: string, name: string): void {
  const user = { id: 'pw-user-1', name, email }

  void page.route(`${API_V1}/auth/register`, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'pw-access-token',
        user,
      }),
    })
  })

  void page.route(`${API_V1}/auth/login`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'pw-access-token',
        user,
      }),
    })
  })

  void page.route(`${API_V1}/auth/refresh`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'pw-access-token',
      }),
    })
  })

  void page.route(`${API_V1}/auth/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    })
  })
}

/**
 * Registers a new user and lands on /dashboard.
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string,
  name = 'Test User'
): Promise<void> {
  setupMockAuth(page, email, name)

  await page.goto('/register')
  await page.locator('[data-testid="register-name"]').fill(name)
  await page.locator('[data-testid="register-email"]').fill(email)
  await page.locator('[data-testid="register-password"]').fill(password)
  await page.locator('[data-testid="register-confirm-password"]').fill(password)
  await page.locator('[data-testid="register-submit"]').click()

  await page
    .waitForURL((url) => /\/(dashboard|login)$/.test(url.pathname), {
      timeout: 15_000,
    })
    .catch(() => null)

  if (page.url().includes('/login')) {
    await loginUser(page, email, password)
  }
}

/**
 * Logs in with an existing account and lands on /dashboard.
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  setupMockAuth(page, email, 'Test User')

  if (!page.url().includes('/login')) {
    await page.goto('/login')
  }
  await page.waitForURL(/\/login/, { timeout: 10_000 })
  await page.locator('[data-testid="login-email"]').fill(email)
  await page.locator('[data-testid="login-password"]').fill(password)
  await page.locator('[data-testid="login-submit"]').click()
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
}

/**
 * Generates a unique email address for test isolation.
 */
export function uniqueEmail(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@playwright.test`
}
