import { test, expect, setupAuthed } from './support/fixtures'

test.describe('Applications list', () => {
  test('shows applications in the table view', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications')

    await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Senior Frontend Engineer' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Priya Nayar' })).toBeVisible()
  })

  test('filters by recruiter via search', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications')

    await page.getByPlaceholder('Search every field…').fill('Marcus')
    await expect(page.getByRole('cell', { name: 'Product Designer, Growth' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Senior Frontend Engineer' })).toHaveCount(0)
  })

  test('switches to board view', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications')

    await page.getByRole('tab', { name: 'Board' }).click()
    await expect(page.getByText('Senior Frontend Engineer')).toBeVisible()
  })

  test('the archived tab lists archived applications', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications')

    await page.getByRole('button', { name: /archived/i }).click()
    await expect(page.getByRole('cell', { name: 'Platform Engineer' })).toBeVisible()
  })

  test('shows an empty state when there are no active applications', async ({ page }) => {
    await setupAuthed(page, { empty: true })
    await page.goto('/applications')

    await expect(page.getByRole('heading', { name: 'No applications yet' })).toBeVisible()
  })

  test('archiving removes a row after confirmation', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications')

    const row = page.getByRole('row', { name: /Senior Frontend Engineer/ })
    await row.getByRole('button', { name: 'Archive' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Archive' }).click()

    await expect(page.getByRole('cell', { name: 'Senior Frontend Engineer' })).toHaveCount(0)
  })
})

test.describe('Application form', () => {
  test('creates an application and returns to the list', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications')

    await page.getByRole('button', { name: 'New Application' }).click()
    await expect(page.getByRole('heading', { name: 'New Application' })).toBeVisible()

    await page.getByLabel('Vacancy Name').fill('QA Engineer')
    await page.getByLabel('Organization').fill('Playwright Inc')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page).toHaveURL(/\/applications$/)
    await expect(page.getByRole('cell', { name: 'QA Engineer' })).toBeVisible()
  })

  test('shows the unsaved-changes banner while editing', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications/new')

    await page.getByLabel('Vacancy Name').fill('Typing triggers dirty state')
    await expect(page.getByText('You have unsaved changes.')).toBeVisible()
  })

  test('requires a vacancy name', async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/applications/new')

    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Vacancy name is required')).toBeVisible()
  })
})
