import { test, expect, type Page } from '@playwright/test'
import { setupMockAuth, setupMockPasskeyBrowser } from './helpers/auth'

const API_BASE = '**/api/v1'

async function seedAuthenticatedStorage(page: Page, email: string, name: string): Promise<void> {
  await page.addInitScript(
    ({ userEmail, userName }) => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            accessToken: 'pw-access-token',
            user: {
              id: 'pw-user-1',
              name: userName,
              email: userEmail,
              reminderTime: '19:00:00',
              roles: ['USER'],
              canUseGoogleIntegration: false,
            },
            theme: 'light',
          },
          version: 0,
        })
      )
    },
    { userEmail: email, userName: name }
  )
}

test.describe('Passkey auth flow', () => {
  test('signs in with a passkey from the login screen', async ({ page }) => {
    const email = 'passkey-login@example.com'
    const name = 'Passkey Login User'
    let loginVerificationBody: Record<string, unknown> | null = null

    setupMockAuth(page, email, name)
    await setupMockPasskeyBrowser(page)

    await page.route(`${API_BASE}/auth/passkey/login/options`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challenge: 'bG9naW4tY2hhbGxlbmdl',
          rpId: 'localhost',
          userVerification: 'preferred',
          allowCredentials: [{ id: 'bG9naW4tY3JlZGVudGlhbA', type: 'public-key', transports: ['internal'] }],
        }),
      })
    })

    await page.route(`${API_BASE}/auth/passkey/login/verify`, async (route) => {
      loginVerificationBody = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'pw-passkey-token',
          user: {
            id: 'pw-user-1',
            name,
            email,
            reminderTime: '19:00:00',
            roles: ['USER'],
            canUseGoogleIntegration: false,
          },
        }),
      })
    })

    await page.goto('/login')
    await page.getByTestId('login-passkey-submit').click()

    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    const browserPayload = await page.evaluate(
      () => (window as Window & { __mockPasskeyGet?: unknown }).__mockPasskeyGet
    )
    expect(browserPayload).toMatchObject({ challengeLength: 15, allowCredentialLength: 16 })
    expect(loginVerificationBody).toMatchObject({
      id: 'login-passkey-id',
      type: 'public-key',
      rawId: expect.any(String),
      response: {
        authenticatorData: expect.any(String),
        clientDataJSON: expect.any(String),
        signature: expect.any(String),
        userHandle: expect.any(String),
      },
    })
  })

  test('shows helpful feedback when passkeys are not supported on login', async ({ page }) => {
    await setupMockPasskeyBrowser(page, { supported: false })

    await page.goto('/login')
    await page.getByTestId('login-passkey-submit').click()

    await expect(page.getByText('Passkeys are not available in this browser. Use a supported browser or continue with your password.')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('registers a passkey from account settings', async ({ page }) => {
    const email = 'passkey-account@example.com'
    const name = 'Passkey Account User'
    let registrationVerificationBody: Record<string, unknown> | null = null

    setupMockAuth(page, email, name)
    await setupMockPasskeyBrowser(page)
    await seedAuthenticatedStorage(page, email, name)

    await page.route(`${API_BASE}/auth/passkey/register/options`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challenge: 'cmVnaXN0ZXItY2hhbGxlbmdl',
          rp: { name: 'Job Apply Tracker', id: 'localhost' },
          user: {
            id: 'cHctdXNlci0x',
            name: email,
            displayName: name,
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          timeout: 60000,
        }),
      })
    })

    await page.route(`${API_BASE}/auth/passkey/register/verify`, async (route) => {
      registrationVerificationBody = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Passkey registered successfully.' }),
      })
    })

    await page.goto('/account')
    await page.getByTestId('register-passkey-btn').click()

    await expect(page.getByText('Passkey registered successfully.')).toBeVisible()

    const browserPayload = await page.evaluate(
      () => (window as Window & { __mockPasskeyCreate?: unknown }).__mockPasskeyCreate
    )
    expect(browserPayload).toMatchObject({ challengeLength: 18, userIdLength: 9 })
    expect(registrationVerificationBody).toMatchObject({
      id: 'created-passkey-id',
      type: 'public-key',
      rawId: expect.any(String),
      response: {
        attestationObject: expect.any(String),
        clientDataJSON: expect.any(String),
        transports: ['internal'],
      },
    })
  })

  test('shows helpful feedback when the passkey registration prompt is canceled', async ({ page }) => {
    const email = 'passkey-cancel@example.com'
    const name = 'Passkey Cancel User'
    let verifyCalled = false

    setupMockAuth(page, email, name)
    await setupMockPasskeyBrowser(page, { createErrorName: 'NotAllowedError' })
    await seedAuthenticatedStorage(page, email, name)

    await page.route(`${API_BASE}/auth/passkey/register/options`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challenge: 'cmVnaXN0ZXItY2hhbGxlbmdl',
          rp: { name: 'Job Apply Tracker', id: 'localhost' },
          user: {
            id: 'cHctdXNlci0x',
            name: email,
            displayName: name,
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        }),
      })
    })

    await page.route(`${API_BASE}/auth/passkey/register/verify`, async (route) => {
      verifyCalled = true
      await route.abort()
    })

    await page.goto('/account')
    await page.getByTestId('register-passkey-btn').click()

    await expect(page.getByText('The passkey prompt was canceled or timed out. Please try again.')).toBeVisible()
    expect(verifyCalled).toBe(false)
  })
})
