import { test, expect, setupAuthed } from './support/fixtures'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/dashboard')
  })

  test('renders metric cards from the summary endpoint', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Total Applications')).toBeVisible()
    await expect(page.getByText('36', { exact: true })).toBeVisible()
    await expect(page.getByText('Waiting Responses')).toBeVisible()
  })

  test('shows achievements and follow-up panels', async ({ page }) => {
    await expect(page.getByText('First Contact')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'To Send Later' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Overdue Follow-ups' })).toBeVisible()
  })

  test('the gamified variant reveals the level hero card', async ({ page }) => {
    await page.getByRole('tab', { name: 'Gamified' }).click()
    await expect(page.getByText('Current rank')).toBeVisible()
    await expect(page.getByText('Day streak')).toBeVisible()
  })

  test('the sidebar shows the XP/level indicator', async ({ page }) => {
    await expect(page.getByText('Level 7')).toBeVisible()
  })
})
