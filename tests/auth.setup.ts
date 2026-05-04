import { test as setup, expect } from '@playwright/test'
import { setupMockAuth, uniqueEmail } from './helpers/auth'

const AUTH_STATE_PATH = 'tests/.auth-state.json'
const PASSWORD = 'Test1234!'

setup('authenticate', async ({ page }) => {
  const email = uniqueEmail('setup')
  
  // 1. Manually setup mocks for the registration flow
  await setupMockAuth(page, email, 'Setup User')
  
  // 2. Perform the UI interaction
  await page.goto('/register')
  await page.getByTestId('register-name').fill('Setup User')
  await page.getByTestId('register-email').fill(email)
  await page.getByTestId('register-password').fill(PASSWORD)
  await page.getByTestId('register-submit').click()
  
  // 3. Robust landing check
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  
  // 4. Save session
  await page.context().storageState({ path: AUTH_STATE_PATH })
})
