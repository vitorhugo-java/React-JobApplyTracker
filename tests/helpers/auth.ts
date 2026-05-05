import { type Page } from '@playwright/test'

const API_V1 = '**/api/v1'
const AUTH_STORAGE_KEY = 'auth-storage'

type MockUser = {
  id: string
  name: string
  email: string
  reminderTime: string
}

const buildPersistedAuthState = (user: MockUser) => ({
  state: {
    accessToken: 'pw-access-token',
    user,
    theme: 'light',
  },
  version: 0,
})

const defaultGamificationProfile = {
  currentXp: 0,
  level: 1,
  currentLevelXp: 0,
  nextLevelXp: 100,
  xpToNextLevel: 100,
  progressPercentage: 0,
  rankTitle: 'Desempregado de Aluguel',
  streakDays: 0,
}

export function setupMockAuth(page: Page, email: string, name: string): void {
  const user = { id: 'pw-user-1', name, email, reminderTime: '19:00:00' }

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

  // Mock profile endpoints
  void page.route(`${API_V1}/auth/profile`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    })
  })

  void page.route(`${API_V1}/auth/logout`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })

  void page.route(`${API_V1}/gamification/profile`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(defaultGamificationProfile),
    })
  })

  void page.route(`${API_V1}/gamification/achievements`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })
}

async function seedAuthenticatedSession(page: Page, email: string, name: string): Promise<void> {
  const user = { id: 'pw-user-1', name, email, reminderTime: '19:00:00' }
  const persistedState = buildPersistedAuthState(user)

  setupMockAuth(page, email, name)

  await page.addInitScript(
    ({ storageKey, state }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(state))
    },
    { storageKey: AUTH_STORAGE_KEY, state: persistedState }
  )

  await page.goto('/dashboard')

  await page.evaluate(
    ({ storageKey, state }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(state))
    },
    { storageKey: AUTH_STORAGE_KEY, state: persistedState }
  )

  await page.reload()
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
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
  void password
  await seedAuthenticatedSession(page, email, name)
}

/**
 * Logs in with an existing account and lands on /dashboard.
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  void password
  await seedAuthenticatedSession(page, email, 'Test User')
}

/**
 * Generates a unique email address for test isolation.
 */
export function uniqueEmail(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@playwright.test`
}
