import { test, expect, setupAuthed } from './support/fixtures'

test.describe('Metrics', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthed(page)
    await page.goto('/metrics')
  })

  test('renders the monochrome chart panels', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Metrics' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Conversion Funnel' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Applications by Status' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Weekly Application Volume' })).toBeVisible()
  })

  test('the funnel lists each pipeline stage', async ({ page }) => {
    const funnel = page.locator('section', {
      has: page.getByRole('heading', { name: 'Conversion Funnel' }),
    })
    await expect(funnel.getByText('Applied', { exact: true })).toBeVisible()
    await expect(funnel.getByText('Interview', { exact: true })).toBeVisible()
    await expect(funnel.getByText('Offer', { exact: true })).toBeVisible()
  })
})
