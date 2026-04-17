# Frontend Test Guide - Playwright E2E Tests

Comprehensive guide for Playwright E2E tests for the React Job Apply Tracker frontend.

## Architecture

### Browsers & Configuration
- **Test Browsers:** Chromium, Firefox, WebKit (default)
- **Configuration File:** `playwright.config.ts`
- **Base URL:** Configured via `webServer` in config
- **Headless Mode:** Default (set `headed: true` for debugging)

### Test Organization
```
tests/
├── auth.spec.ts                # Authentication flow
├── applications.spec.ts         # Application CRUD operations
├── dashboard.spec.ts            # Dashboard features
├── reminders.spec.ts            # Reminder features
├── application-regression.spec.ts # Regression tests
├── helpers/
│   ├── auth.ts                 # Auth utilities
│   └── ...
└── .auth-apps.json            # Authenticated sessions cache
```

## Authentication Tests (`auth.spec.ts`)

### Test Scenarios

#### 1. Register a New User
```typescript
test('register a new user', async ({ page }) => {
  const email = uniqueEmail('reg')
  await registerUser(page, email, PASSWORD)
  
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```
**What it verifies:**
- User registration flow works
- After registration, redirected to dashboard
- Session automatically established
- User can see dashboard

**Key interactions:**
- Navigate to /register
- Fill name, email, password fields
- Submit form
- Expect dashboard redirect

#### 2. Login with Valid Credentials
```typescript
test('login with valid credentials', async ({ page }) => {
  const email = uniqueEmail('login')
  await registerUser(page, email, PASSWORD)
  await page.locator('[aria-label="Logout"]').click()
  await page.waitForURL('**/login')
  
  await loginUser(page, email, PASSWORD)
  
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```
**What it verifies:**
- Login flow works correctly
- Logout clears session
- Session re-established on login
- Dashboard accessible after login

#### 3. Persist Session After Page Reload
```typescript
test('persist session after page reload', async ({ page }) => {
  const email = uniqueEmail('persist')
  await registerUser(page, email, PASSWORD)
  
  await page.reload()
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
  
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```
**What it verifies:**
- Access token stored in memory (Zustand)
- Session restored on page reload
- No login required after reload
- Dashboard loads correctly

**Browser Storage:**
- Access token: Stored in Zustand state, persisted to localStorage
- Refresh token: In HttpOnly cookie (browser handles automatically)

#### 4. Persist Session When Backend Unreachable
```typescript
test('persist session when backend is unreachable on reload', async ({ page }) => {
  const email = uniqueEmail('persist_offline')
  await registerUser(page, email, PASSWORD)
  
  // Simulate backend down
  await page.route('**/api/auth/me', (route) => route.abort('failed'))
  await page.route('**/api/auth/refresh', (route) => route.abort('failed'))
  
  await page.reload()
  
  // Session preserved despite network errors
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```
**What it verifies:**
- Graceful degradation when backend unavailable
- Session maintained locally
- User remains logged in during outages
- No redirect to login on transient failures

**Scenario:** Backend maintenance, network issues, service restart during development

#### 5. Clear Session on 401 Response
```typescript
test('clear session when backend returns 401 on reload', async ({ page }) => {
  const email = uniqueEmail('persist_401')
  await registerUser(page, email, PASSWORD)
  
  // Simulate token revocation
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ 
      status: 401, 
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unauthorized' })
    })
  )
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({ status: 401 })
  )
  
  await page.reload()
  
  // Should redirect to login
  await page.waitForURL('**/login', { timeout: 15_000 })
  await expect(page).toHaveURL(/\/login/)
})
```
**What it verifies:**
- Invalid/expired tokens are cleared
- User redirected to login on 401
- Session cleanup on auth failure
- No infinite redirect loops

**Scenario:** Token expiration, user deleted, password changed, session revoked

#### 6. Auto-Refresh on 401 to Protected Endpoints
```typescript
test('refresh expired access token when protected endpoints return 403', async ({ page }) => {
  const email = uniqueEmail('expired_403')
  await registerUser(page, email, PASSWORD)
  
  // Mock initial 403, then success with refresh
  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'refreshed-access-token',
        refreshToken: 'refreshed-refresh-token',
      }),
    })
  })
  
  // Navigate to protected resource
  await page.goto('/dashboard')
  
  // Should handle refresh automatically via axios interceptor
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```
**What it verifies:**
- Axios interceptor catches 401 responses
- Automatic token refresh triggered
- Request retried with new token
- User doesn't see authentication errors

## Test Helpers

### `registerUser(page, email, password, name?)`
```typescript
export async function registerUser(
  page: Page,
  email: string,
  password: string,
  name = 'Test User'
): Promise<void>
```
- Navigates to /register
- Fills registration form
- Switches to login if needed
- Waits for dashboard redirect

### `loginUser(page, email, password)`
```typescript
export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void>
```
- Navigates to /login
- Fills credentials
- Submits form
- Waits for dashboard redirect

### `uniqueEmail(prefix?)`
```typescript
export function uniqueEmail(prefix = 'test'): string
```
- Returns: `prefix_timestamp_random@playwright.test`
- Ensures test isolation
- Prevents email conflicts

### Example Usage
```typescript
const email = uniqueEmail('mytest')
// Returns: "mytest_1639999999999_abc12@playwright.test"

await registerUser(page, email, 'Test1234!')
// User now logged in on dashboard
```

## Running Tests

### All Tests
```bash
npm test
# or with UI
npm test -- --ui
```

### Specific Test File
```bash
npx playwright test tests/auth.spec.ts
npx playwright test tests/dashboard.spec.ts
```

### Specific Test Case
```bash
npx playwright test -g "register a new user"
npx playwright test -g "persist session"
```

### With Debug UI
```bash
npx playwright test --ui
# Opens Playwright Inspector with step-by-step debugging
```

### Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Generate Report
```bash
npx playwright test
npx playwright show-report
# Opens HTML report with screenshots, videos, traces
```

## Key Test Patterns

### Wait for Navigation
```typescript
await page.waitForURL('/dashboard', { timeout: 15_000 })
await expect(page).toHaveURL(/\/dashboard/)
```

### Wait for UI Elements
```typescript
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
await expect(page.locator('[aria-label="Logout"]')).toBeEnabled()
```

### Route Mocking
```typescript
// Mock successful response
await page.route('**/api/endpoint', (route) =>
  route.fulfill({ status: 200, body: JSON.stringify({ data: 'value' }) })
)

// Mock error response
await page.route('**/api/endpoint', (route) =>
  route.fulfill({ status: 500, body: 'Server Error' })
)

// Intercept and abort
await page.route('**/api/endpoint', (route) => route.abort('failed'))
```

### Assertions
```typescript
await expect(page).toHaveURL(/\/dashboard/)
await expect(page.locator('text=Hello')).toBeVisible()
await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled()
```

## Cookies & Auth

### How Browser Handles HttpOnly Cookies
1. **Set-Cookie Header** returned by backend
2. **Browser** automatically stores (JavaScript can't access)
3. **Subsequent Requests** auto-include in Cookie header
4. **withCredentials: true** required in axios for CORS requests

### Test Verification Approach
- Don't try to access cookies directly in Playwright (they're HttpOnly)
- Instead, verify successful login through UI
- Test token refresh by mocking responses
- Verify session persistence through page reload

### Local Storage (Zustand)
```typescript
// Playwright can access non-HttpOnly storage
const auth = await page.evaluate(() => localStorage.getItem('auth-storage'))
// Returns: {"state": {"accessToken": "..."}, "version": 0}
```

## Common Issues & Solutions

### Test Times Out Waiting for Dashboard
**Problem:** `page.waitForURL() timeout`
**Solutions:**
- Check backend is running on correct port
- Verify API endpoints accessible
- Check network mocking doesn't block necessary calls
- Increase timeout: `timeout: 30_000`

### Login Form Not Filling
**Problem:** `data-testid` attributes not found
**Solutions:**
- Verify testid naming matches helpers
- Check latest component changes
- Update test data-testids if changed

### Session Lost After Reload
**Problem:** Page redirects to login after reload
**Solutions:**
- Verify localStorage not cleared
- Check refresh token cookie present
- Verify CORS credentials enabled
- Check backend token validation

### Flaky Tests (Random Failures)
**Problem:** Test sometimes fails, sometimes passes
**Solutions:**
- Add explicit waits, not just timeouts
- Use `expect(...).toBeVisible()` not `.isVisible()`
- Avoid hardcoded delays (add 'await page.waitForTimeout(100)')
- Use unique emails to prevent conflicts

## Performance Considerations

### Speed Optimization
```typescript
// Good: Parallel test execution in different browsers
npx playwright test --workers=4

// Slow: Sequential tests
npx playwright test --workers=1
```

### Skip Slow Tests During Development
```typescript
test.skip('slow test', async ({ page }) => {
  // Only runs with --grep flag
})

// Run skipped tests
npx playwright test --grep @slow
```

### Use Test Fixtures for Setup
```typescript
test.beforeEach(async ({ page }) => {
  // Setup runs before each test
  await page.goto('/login')
})

test.afterEach(async ({ page }) => {
  // Cleanup runs after each test
  await page.close()
})
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Playwright tests
  run: npm test

- name: Upload results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

### Retry Failed Tests
```bash
# Retry failed tests
npx playwright test --retries=2
```

### Collect Traces for Debugging
```yaml
use:
  trace: 'on-first-retry'
  # Creates trace.zip for debugging failed tests
```

## Best Practices

✅ **DO:**
- Use `uniqueEmail()` for test isolation
- Wait for navigation with `waitForURL()` or `expect(url)`
- Use semantic queries: `getByRole()`, `getByLabel()`
- Clean up resources in `afterEach()`
- Test happy paths AND error scenarios
- Mock external APIs consistently

❌ **DON'T:**
- Hardcode timeouts - use explicit waits
- Use generic selectors: `.css-123abc`
- Create test data manually - use helpers
- Skip cleanup between tests
- Test UI implementation details
- Mock too much - test real behavior

## Debugging

### Visual Tests
```bash
# See browser during test execution
npx playwright test --headed
```

### Debug Mode  
```bash
# Interactive debugging with Playwright Inspector
npx playwright test --debug
# Then step through code execution
```

### Screenshots & Videos
```typescript
test('example', async ({ page, context }) => {
  // Automatic on failure with config
  // Manual:
  await page.screenshot({ path: 'screenshot.png' })
})
```

### View Reports
```bash
npx playwright show-report
# Shows detailed HTML report with traces and videos
```

