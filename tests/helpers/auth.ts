import { type Page } from '@playwright/test'

const API_V1 = '**/api/v1'
const AUTH_STORAGE_KEY = 'auth-storage'

type MockUser = {
  id: string
  name: string
  email: string
  reminderTime: string
  roles: string[]
  canUseGoogleIntegration: boolean
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

type SetupMockAuthOptions = {
  canUseGoogleIntegration?: boolean
}

type SetupMockPasskeyBrowserOptions = {
  supported?: boolean
  createErrorName?: string
  getErrorName?: string
}

const buildMockUser = (
  email: string,
  name: string,
  options: SetupMockAuthOptions = {}
): MockUser => {
  const canUseGoogleIntegration = Boolean(options.canUseGoogleIntegration)

  return {
    id: 'pw-user-1',
    name,
    email,
    reminderTime: '19:00:00',
    roles: canUseGoogleIntegration ? ['USER', 'BETA'] : ['USER'],
    canUseGoogleIntegration,
  }
}

export function setupMockAuth(page: Page, email: string, name: string, options: SetupMockAuthOptions = {}): void {
  const user = buildMockUser(email, name, options)

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

  void page.route(`${API_V1}/gamification/events`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        awardedXp: 0,
        leveledUp: false,
        newLevel: 1,
        achievementUnlocked: null,
      }),
    })
  })
}

export async function setupMockPasskeyBrowser(
  page: Page,
  options: SetupMockPasskeyBrowserOptions = {}
): Promise<void> {
  await page.addInitScript((config: SetupMockPasskeyBrowserOptions) => {
    const toBuffer = (value: string): ArrayBuffer => {
      const bytes = new TextEncoder().encode(value)
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    }

    if (config.supported === false) {
      Object.defineProperty(window, 'PublicKeyCredential', {
        configurable: true,
        writable: true,
        value: undefined,
      })

      Object.defineProperty(navigator, 'credentials', {
        configurable: true,
        value: {
          create: undefined,
          get: undefined,
        },
      })

      return
    }

    class MockPublicKeyCredential {}

    Object.defineProperty(window, 'PublicKeyCredential', {
      configurable: true,
      writable: true,
      value: MockPublicKeyCredential,
    })

    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: {
        create: async ({ publicKey }: { publicKey: PublicKeyCredentialCreationOptions }) => {
          ;(window as Window & { __mockPasskeyCreate?: unknown }).__mockPasskeyCreate = {
            challengeLength: publicKey.challenge instanceof ArrayBuffer ? publicKey.challenge.byteLength : 0,
            userIdLength: publicKey.user.id instanceof ArrayBuffer ? publicKey.user.id.byteLength : 0,
          }

          if (config.createErrorName) {
            const error = new Error(config.createErrorName)
            error.name = config.createErrorName
            throw error
          }

          return {
            id: 'created-passkey-id',
            type: 'public-key',
            rawId: toBuffer('created-passkey-raw'),
            authenticatorAttachment: 'platform',
            response: {
              attestationObject: toBuffer('attestation-object'),
              clientDataJSON: toBuffer('client-data-json'),
              getTransports: () => ['internal'],
            },
            getClientExtensionResults: () => ({ credProps: { rk: true } }),
          }
        },
        get: async ({ publicKey }: { publicKey: PublicKeyCredentialRequestOptions }) => {
          ;(window as Window & { __mockPasskeyGet?: unknown }).__mockPasskeyGet = {
            challengeLength: publicKey.challenge instanceof ArrayBuffer ? publicKey.challenge.byteLength : 0,
            allowCredentialLength:
              publicKey.allowCredentials?.[0]?.id instanceof ArrayBuffer
                ? publicKey.allowCredentials[0].id.byteLength
                : 0,
          }

          if (config.getErrorName) {
            const error = new Error(config.getErrorName)
            error.name = config.getErrorName
            throw error
          }

          return {
            id: 'login-passkey-id',
            type: 'public-key',
            rawId: toBuffer('login-passkey-raw'),
            authenticatorAttachment: 'platform',
            response: {
              authenticatorData: toBuffer('authenticator-data'),
              clientDataJSON: toBuffer('client-data-json'),
              signature: toBuffer('signature-data'),
              userHandle: toBuffer('user-handle'),
            },
            getClientExtensionResults: () => ({}),
          }
        },
      },
    })
  }, options)
}

async function seedAuthenticatedSession(
  page: Page,
  email: string,
  name: string,
  options: SetupMockAuthOptions = {}
): Promise<void> {
  const user = buildMockUser(email, name, options)
  const persistedState = buildPersistedAuthState(user)

  setupMockAuth(page, email, name, options)

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
  name = 'Test User',
  options: SetupMockAuthOptions = {}
): Promise<void> {
  void password
  await seedAuthenticatedSession(page, email, name, options)
}

/**
 * Logs in with an existing account and lands on /dashboard.
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string,
  options: SetupMockAuthOptions = {}
): Promise<void> {
  void password
  await seedAuthenticatedSession(page, email, 'Test User', options)
}

/**
 * Generates a unique email address for test isolation.
 */
export function uniqueEmail(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@playwright.test`
}
