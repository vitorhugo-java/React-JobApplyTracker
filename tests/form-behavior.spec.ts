import { test, expect } from '@playwright/test'
import { setupMockApplicationsApi } from './helpers/appApi'
import { setupMockAuth } from './helpers/auth'

async function injectAuth(page) {
  setupMockAuth(page, 'test@example.com', 'Test User')
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

test.describe('Application Form Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page)
    await page.goto('/applications/new')
  })

  test('toggling "To send later" clears and restores application date', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'New Application' })).toBeVisible()
    
    const dateInput = page.locator('input#applicationDate')
    await expect(dateInput).toBeVisible({ timeout: 10000 })
    
    // Default date should be set
    await expect(dateInput).not.toHaveValue('')

    // Toggle ON
    await page.getByTestId('app-to-send-later').click()
    await expect(dateInput).toHaveValue('')

    // Toggle OFF
    await page.getByTestId('app-to-send-later').click()
    await expect(dateInput).not.toHaveValue('')
  })
})
