import { type Page } from '@playwright/test'

/**
 * Registers a new user and lands on /dashboard.
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string,
  name = 'Test User'
): Promise<void> {
  await page.goto('/register')
  await page.locator('[data-testid="register-name"]').fill(name)
  await page.locator('[data-testid="register-email"]').fill(email)
  await page.locator('[data-testid="register-password"]').fill(password)
  await page.locator('[data-testid="register-confirm-password"]').fill(password)
  await page.locator('[data-testid="register-submit"]').click()
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
}

/**
 * Logs in with an existing account and lands on /dashboard.
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login')
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
