import { test, expect, setupAuthed } from './support/fixtures'

test.describe('Account settings', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/account')
  })

  test('renders all settings sections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Account Settings' })).toBeVisible()
    await expect(page.getByText('Profile', { exact: true })).toBeVisible()
    await expect(page.getByText('Change Password')).toBeVisible()
    await expect(page.getByText('Danger Zone')).toBeVisible()
  })

  test('shows the current user email read-only', async ({ page }) => {
    await expect(page.getByLabel('Email')).toHaveValue('jordan@diaz.dev')
  })

  test('saves a profile change', async ({ page }) => {
    await page.getByLabel('Full name').fill('Jordan D. Updated')
    await page.getByRole('button', { name: 'Save profile' }).click()
    await expect(page.getByText('Saved ✓')).toBeVisible()
  })
})

test.describe('Developer tools', () => {
  test('renders the API access panel', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/developer')

    await expect(page.getByRole('heading', { name: 'Developer Tools' })).toBeVisible()
    await expect(page.getByText('API base URL')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible()
  })
})
