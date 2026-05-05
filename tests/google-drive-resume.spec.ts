import { test, expect, type Page } from '@playwright/test'
import { setupMockApplicationsApi } from './helpers/appApi'
import { setupMockAuth } from './helpers/auth'

const API_BASE = '**/api/v1'

type BaseResume = {
  id: string | null
  name: string
  documentId: string
  isDefault?: boolean
}

type GoogleDriveStatusPayload = {
  connected: boolean
  baseFolderId?: string
  baseResumes?: BaseResume[]
}

function setupPage(page: Page): Promise<void> {
  setupMockAuth(page, 'test@example.com', 'Test User')
  setupMockApplicationsApi(page)
  return page.addInitScript(() => {
    window.localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          accessToken: 'pw-access-token',
          user: { id: 'pw-user-1', name: 'Test User', email: 'test@example.com' },
          theme: 'light',
        },
        version: 0,
      })
    )
  })
}

function mockGoogleDriveStatus(page: Page, payload: GoogleDriveStatusPayload): Promise<void> {
  return page.route(`${API_BASE}/google-drive/status`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })
  })
}

function mockGamificationEvents(page: Page): Promise<void> {
  return page.route(`${API_BASE}/gamification/events`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ eventType: 'APPLICATION_CREATED', xpAwarded: 10 }),
    })
  })
}

/** Intercept window.open to return a fake window object, preventing real popups. */
function mockWindowOpen(page: Page): Promise<void> {
  return page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).open = () => ({
      location: { href: 'about:blank', replace: () => {} },
      closed: false,
      close: () => {},
      opener: null,
    })
  })
}

const connectedSettings: GoogleDriveStatusPayload = {
  connected: true,
  baseFolderId: 'folder-123',
  baseResumes: [
    { id: 'resume-abc', name: 'Base Resume', documentId: 'doc-abc', isDefault: true },
  ],
}

test.describe('Google Drive Resume Workflow', () => {
  test('Create Resume button is disabled when Google Drive is not connected', async ({ page }) => {
    await setupPage(page)
    await mockGoogleDriveStatus(page, { connected: false, baseFolderId: '', baseResumes: [] })
    await page.goto('/applications/new')

    const createResumeBtn = page.getByRole('button', { name: 'Create Resume' })
    await expect(createResumeBtn).toBeVisible({ timeout: 10_000 })
    await expect(createResumeBtn).toBeDisabled()
  })

  test('Create Resume button is disabled while Google Drive settings are loading', async ({ page }) => {
    await setupPage(page)
    await page.route(`${API_BASE}/google-drive/status`, async (route) => {
      // Introduce a long delay so the button is checked while settings are still loading
      await new Promise<void>((resolve) => setTimeout(resolve, 3_000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(connectedSettings),
      })
    })
    await page.goto('/applications/new')

    const createResumeBtn = page.getByRole('button', { name: 'Create Resume' })
    await expect(createResumeBtn).toBeVisible({ timeout: 5_000 })
    // Settings have not yet returned, so the button should still be disabled
    await expect(createResumeBtn).toBeDisabled()
  })

  test('Create Resume button is enabled once Google Drive is connected with settings', async ({ page }) => {
    await setupPage(page)
    await mockGoogleDriveStatus(page, connectedSettings)
    await page.goto('/applications/new')

    const createResumeBtn = page.getByRole('button', { name: 'Create Resume' })
    await expect(createResumeBtn).toBeEnabled({ timeout: 10_000 })
  })

  test('sends resume creation request with the selected base resume id', async ({ page }) => {
    const baseResumeId = 'resume-abc'

    await mockWindowOpen(page)
    await setupPage(page)
    await mockGoogleDriveStatus(page, connectedSettings)
    await mockGamificationEvents(page)

    let resumeCopyBody: Record<string, unknown> | null = null
    await page.route(`${API_BASE}/google-drive/applications/*/resume-copies`, async (route) => {
      resumeCopyBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          googleDocUrl: 'https://docs.google.com/document/d/copied-doc-id/edit',
        }),
      })
    })

    await page.goto('/applications/new')

    // Fill required vacancy name so the application can be created
    await page.locator('[data-testid="app-vacancy-name"]').fill('Test Vacancy')

    const createResumeBtn = page.getByRole('button', { name: 'Create Resume' })
    await expect(createResumeBtn).toBeEnabled({ timeout: 10_000 })
    await createResumeBtn.click()

    // Wait until the resume-copies endpoint was called
    await expect.poll(() => resumeCopyBody, { timeout: 10_000 }).not.toBeNull()
    expect(resumeCopyBody?.baseResumeId).toBe(baseResumeId)
  })

  test('shows an error toast when the application cannot be saved online before creating a resume', async ({ page }) => {
    await mockWindowOpen(page)
    await setupPage(page)
    await mockGoogleDriveStatus(page, connectedSettings)

    // Override the POST /applications route to simulate an offline-queued response
    await page.route(`${API_BASE}/applications`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ queuedOffline: true }),
        })
        return
      }
      await route.continue()
    })

    await page.goto('/applications/new')
    await page.locator('[data-testid="app-vacancy-name"]').fill('Test Vacancy')

    const createResumeBtn = page.getByRole('button', { name: 'Create Resume' })
    await expect(createResumeBtn).toBeEnabled({ timeout: 10_000 })
    await createResumeBtn.click()

    await expect(page.locator('.p-toast')).toContainText(
      'The application must be saved online before creating a Google Docs resume.',
      { timeout: 10_000 }
    )
  })
})
