import { test, expect } from '@playwright/test'
import { uniqueEmail } from './helpers/auth'

test.describe('Password Validation and Feedback', () => {
  test('display password strength feedback when typing password', async ({ page }) => {
    await page.goto('/register')

    const passwordInput = page.locator('[data-testid="register-password"]')
    await passwordInput.fill('Test')

    // Should show very weak password
    await expect(page.locator('text=Very Weak')).toBeVisible()
  })

  test('update password strength to weak with 6 characters', async ({ page }) => {
    await page.goto('/register')

    const passwordInput = page.locator('[data-testid="register-password"]')
    await passwordInput.fill('testlo')

    // Should show weak password
    await expect(page.locator('text=Weak')).toBeVisible()
  })

  test('update password strength to fair with lowercase, uppercase, and number', async ({
    page,
  }) => {
    await page.goto('/register')

    const passwordInput = page.locator('[data-testid="register-password"]')
    await passwordInput.fill('Test123')

    // Should show fair password (needs at least 8 characters, but has 3/5 requirements)
    await expect(page.locator('text=Fair')).toBeVisible()
  })

  test('update password strength to good with 8 characters, uppercase, lowercase, and number', async ({
    page,
  }) => {
    await page.goto('/register')

    const passwordInput = page.locator('[data-testid="register-password"]')
    await passwordInput.fill('Test1234')

    // Should show good password
    await expect(page.locator('text=Good')).toBeVisible()
  })

  test('update password strength to strong with special character', async ({ page }) => {
    await page.goto('/register')

    const passwordInput = page.locator('[data-testid="register-password"]')
    await passwordInput.fill('Test1234!')

    // Should show strong password
    await expect(page.locator('text=Strong')).toBeVisible()
  })

  test('display all password requirements checklist', async ({ page }) => {
    await page.goto('/register')

    const passwordInput = page.locator('[data-testid="register-password"]')
    await passwordInput.fill('T')

    // All requirements should be visible
    await expect(page.locator('text=At least 8 characters')).toBeVisible()
    await expect(page.locator('text=One uppercase letter (A-Z)')).toBeVisible()
    await expect(page.locator('text=One lowercase letter (a-z)')).toBeVisible()
    await expect(page.locator('text=One number (0-9)')).toBeVisible()
    await expect(page.locator('text=One special character')).toBeVisible()
  })

  test('check off requirements as they are met', async ({ page }) => {
    await page.goto('/register')

    const passwordInput = page.locator('[data-testid="register-password"]')

    // Start with empty password
    const requirementsSection = page.locator('text=Password must include:').locator('..')

    // Fill with uppercase
    await passwordInput.fill('T')
    await expect(requirementsSection.locator('text=One uppercase letter (A-Z)')).toContainText('✓')

    // Fill with lowercase
    await passwordInput.fill('Tt')
    await expect(requirementsSection.locator('text=One lowercase letter (a-z)')).toContainText('✓')

    // Fill with number
    await passwordInput.fill('Tt1')
    await expect(requirementsSection.locator('text=One number (0-9)')).toContainText('✓')

    // Fill with special character
    await passwordInput.fill('Tt1!')
    await expect(requirementsSection.locator('text=One special character')).toContainText('✓')

    // Fill with 8 characters
    await passwordInput.fill('Tt1!abcd')
    await expect(requirementsSection.locator('text=At least 8 characters')).toContainText('✓')
  })

  test('show password mismatch error for confirm password', async ({ page }) => {
    await page.goto('/register')

    const passwordInput = page.locator('[data-testid="register-password"]')
    const confirmInput = page.locator('[data-testid="register-confirm-password"]')

    await passwordInput.fill('Test1234!')
    await confirmInput.fill('Different')

    // Should show mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('hide password mismatch error when passwords match', async ({ page }) => {
    await page.goto('/register')

    const passwordInput = page.locator('[data-testid="register-password"]')
    const confirmInput = page.locator('[data-testid="register-confirm-password"]')

    await passwordInput.fill('Test1234!')
    await confirmInput.fill('Different')

    // Initially shows error
    await expect(page.locator('text=Passwords do not match')).toBeVisible()

    // Update confirm to match
    await confirmInput.fill('Test1234!')

    // Error should be gone
    await expect(page.locator('text=Passwords do not match')).not.toBeVisible()
  })

  test('reject registration with password shorter than 8 characters', async ({ page }) => {
    await page.goto('/register')

    await page.locator('[data-testid="register-name"]').fill('Test User')
    await page.locator('[data-testid="register-email"]').fill(uniqueEmail('short-pwd'))
    await page.locator('[data-testid="register-password"]').fill('Test123')
    await page.locator('[data-testid="register-confirm-password"]').fill('Test123')

    await page.locator('[data-testid="register-submit"]').click()

    // Should show validation error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
  })

  test('show intuitive error for duplicate email registration', async ({ page }) => {
    const email = uniqueEmail('duplicate')
    const password = 'Test1234!'

    // Register once
    await page.goto('/register')
    await page.locator('[data-testid="register-name"]').fill('First User')
    await page.locator('[data-testid="register-email"]').fill(email)
    await page.locator('[data-testid="register-password"]').fill(password)
    await page.locator('[data-testid="register-confirm-password"]').fill(password)
    await page.locator('[data-testid="register-submit"]').click()

    // Wait for dashboard
    await page.waitForURL('/dashboard')

    // Try to register again with same email
    await page.goto('/register')
    await page.locator('[data-testid="register-name"]').fill('Second User')
    await page.locator('[data-testid="register-email"]').fill(email)
    await page.locator('[data-testid="register-password"]').fill(password)
    await page.locator('[data-testid="register-confirm-password"]').fill(password)
    await page.locator('[data-testid="register-submit"]').click()

    // Should show helpful error message
    const errorMsg = page.locator('.p-toast-detail')
    await expect(errorMsg).toContainText(/already registered|already in use/, { timeout: 10000 })
  })

  test('show intuitive error for mismatched passwords on submit', async ({ page }) => {
    await page.goto('/register')

    await page.locator('[data-testid="register-name"]').fill('Test User')
    await page.locator('[data-testid="register-email"]').fill(uniqueEmail('mismatch'))
    await page.locator('[data-testid="register-password"]').fill('Test1234!')
    await page.locator('[data-testid="register-confirm-password"]').fill('Test1234@')

    await page.locator('[data-testid="register-submit"]').click()

    // Should show validation error
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('password strength feedback in reset password form', async ({ page }) => {
    // This test uses a fake token since we're just testing UI
    await page.goto('/reset-password?token=fake-token')

    const passwordInput = page.locator('form input[type="password"]').first()
    await passwordInput.fill('Test1234!')

    // Should show strength feedback
    await expect(page.locator('text=Password Strength:')).toBeVisible()
    await expect(page.locator('text=Strong')).toBeVisible()
  })

  test('password requirements in reset password form', async ({ page }) => {
    await page.goto('/reset-password?token=fake-token')

    const passwordInput = page.locator('form input[type="password"]').first()
    await passwordInput.fill('T')

    // All requirements should be visible
    await expect(page.locator('text=Password must include:')).toBeVisible()
    await expect(page.locator('text=At least 8 characters')).toBeVisible()
  })

  test('show error when reset password is shorter than 8 characters', async ({ page }) => {
    await page.goto('/reset-password?token=fake-token')

    const passwordInput = page.locator('form input[type="password"]').first()
    const confirmInput = page.locator('form input[type="password"]').last()

    await passwordInput.fill('Short')
    await confirmInput.fill('Short')

    await page.locator('button:has-text("Reset Password")').click()

    // Should show validation error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
  })

  test('show error for missing reset token', async ({ page }) => {
    await page.goto('/reset-password')

    const passwordInput = page.locator('form input[type="password"]').first()
    const confirmInput = page.locator('form input[type="password"]').last()

    await passwordInput.fill('Test1234!')
    await confirmInput.fill('Test1234!')

    await page.locator('button:has-text("Reset Password")').click()

    // Should show error about missing token
    await expect(page.locator('text=/Invalid.*token|reset.*link/')).toBeVisible()
  })

  test('display password strength bar visual indicator', async ({ page }) => {
    await page.goto('/register')

    const passwordInput = page.locator('[data-testid="register-password"]')

    // Weakest - should show small bar
    await passwordInput.fill('weak')
    let strengthBar = page.locator('text=Password Strength:').locator('..').locator('div:has-text("")').first()
    await expect(strengthBar).toBeVisible()

    // Strongest - should show full bar
    await passwordInput.fill('Test1234!@#')
    strengthBar = page.locator('text=Password Strength:').locator('..').locator('div:has-text("")').first()
    await expect(strengthBar).toBeVisible()
  })
})
