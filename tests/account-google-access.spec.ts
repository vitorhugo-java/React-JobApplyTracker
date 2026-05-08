import { test, expect } from '@playwright/test'
import { setupMockAuth } from './helpers/auth'

const API_BASE = '**/api/v1'

test.describe('Account Google access', () => {
  test('hides Google Drive settings for non-beta users', async ({ page }) => {
    let googleStatusCalls = 0

    setupMockAuth(page, 'user@example.com', 'Regular User')

    await page.route(`${API_BASE}/google-drive/status`, async (route) => {
      googleStatusCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ connected: false }),
      })
    })

    await page.addInitScript(() => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            accessToken: 'pw-access-token',
            user: {
              id: 'pw-user-1',
              name: 'Regular User',
              email: 'user@example.com',
              reminderTime: '19:00:00',
              roles: ['USER'],
              canUseGoogleIntegration: false,
            },
            theme: 'light',
          },
          version: 0,
        })
      )
    })

    await page.goto('/account')

    await expect(page.getByRole('heading', { name: 'Google Drive Resumes' })).toHaveCount(0)
    await expect(page.getByText('Manage your personal information and account password')).toBeVisible()
    await expect.poll(() => googleStatusCalls).toBe(0)
  })

  test('shows Google Drive settings for beta users', async ({ page }) => {
    setupMockAuth(page, 'beta@example.com', 'Beta User', { canUseGoogleIntegration: true })

    await page.route(`${API_BASE}/google-drive/status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          connected: true,
          accountEmail: 'beta@example.com',
          baseResumes: [],
        }),
      })
    })

    await page.addInitScript(() => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            accessToken: 'pw-access-token',
            user: {
              id: 'pw-user-1',
              name: 'Beta User',
              email: 'beta@example.com',
              reminderTime: '19:00:00',
              roles: ['USER', 'BETA'],
              canUseGoogleIntegration: true,
            },
            theme: 'light',
          },
          version: 0,
        })
      )
    })

    await page.goto('/account')

    await expect(page.getByRole('heading', { name: 'Google Drive Resumes' })).toBeVisible()
    await expect(page.getByText('Manage your personal information, Google Drive resumes and account password')).toBeVisible()
  })
})
