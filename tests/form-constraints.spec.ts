import { test, expect, type Page } from '@playwright/test'
import { loginUser, registerUser, uniqueEmail } from './helpers/auth'
import { setupMockApplicationsApi } from './helpers/appApi'

const PASSWORD = 'Test1234!'

test.describe('Application Form Field Constraints', () => {
  let sharedEmail: string

  test.beforeAll(async ({ browser }) => {
    sharedEmail = uniqueEmail('form-constraints')
    const page = await browser.newPage()
    await registerUser(page, sharedEmail, PASSWORD)
    await page.context().storageState({ path: 'tests/.auth-form-constraints.json' })
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    setupMockApplicationsApi(page)
    await loginUser(page, sharedEmail, PASSWORD)
    await page.goto('/applications/new')
    await page.waitForURL('**/applications/new', { timeout: 10_000 })
  })

  test('text fields have maxlength attributes', async ({ page }) => {
    // Vacancy name: maxlength=255
    const vacancyInput = page.getByTestId('app-vacancy-name')
    expect(await vacancyInput.getAttribute('maxlength')).toBe('255')

    // Recruiter name: maxlength=255
    const recruiterInput = page.getByTestId('app-recruiter-name')
    expect(await recruiterInput.getAttribute('maxlength')).toBe('255')

    // Organization: maxlength=255
    const orgInput = page.getByTestId('app-organization')
    expect(await orgInput.getAttribute('maxlength')).toBe('255')

    // Vacancy link: maxlength=2048
    const linkInput = page.getByTestId('app-vacancy-link')
    expect(await linkInput.getAttribute('maxlength')).toBe('2048')

    // Note: maxlength=5000
    const noteInput = page.getByTestId('app-note')
    expect(await noteInput.getAttribute('maxlength')).toBe('5000')
  })

  test('note field displays character counter', async ({ page }) => {
    const noteInput = page.getByTestId('app-note')
    // Look for text containing "Character count"
    const counterText = page.getByText('Character count', { exact: false })
    
    await expect(counterText).toBeVisible()
    // Check initial state shows 0 / 5000
    await expect(counterText).toContainText('5000')
  })

  test('character counter updates when typing', async ({ page }) => {
    const noteInput = page.getByTestId('app-note')
    
    // Type some text
    await noteInput.fill('Test note content')
    
    // Verify the input has the text value
    await expect(noteInput).toHaveValue('Test note content')
    
    // The counter should show character count - look for pattern like "17 / 5000"
    const pageText = await page.textContent('body')
    expect(pageText).toMatch(/17\s*\/\s*5000/) // "Test note content" = 17 characters
  })

  test('warning appears near character limit', async ({ page }) => {
    const noteInput = page.getByTestId('app-note')
    
    // Fill with text near the limit (4500+ characters)
    const longText = 'a'.repeat(4500)
    await noteInput.fill(longText)
    
    // Check for warning text on page
    const pageText = await page.content()
    expect(pageText).toContain('⚠️ Approaching limit')
  })

  test('note field respects maxlength constraint', async ({ page }) => {
    const noteInput = page.getByTestId('app-note')
    
    // Attempt to fill with text exceeding maxlength
    const excessiveText = 'a'.repeat(6000)
    await noteInput.fill(excessiveText)
    
    // Verify actual value is within limit
    const actualValue = await noteInput.inputValue()
    expect(actualValue.length).toBeLessThanOrEqual(5000)
  })
})
