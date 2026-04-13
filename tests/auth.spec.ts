import { test, expect } from '@playwright/test'
import { registerUser, loginUser, uniqueEmail } from './helpers/auth'

const PASSWORD = 'Test1234!'

test.describe('Auth flow', () => {
  test('register a new user', async ({ page }) => {
    const email = uniqueEmail('reg')
    await registerUser(page, email, PASSWORD)

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText('Dashboard')).toBeVisible()
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
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('persist session after page reload', async ({ page }) => {
    const email = uniqueEmail('persist')
    await registerUser(page, email, PASSWORD)

    await page.reload()
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 })

    await expect(page.getByText('Dashboard')).toBeVisible()
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
