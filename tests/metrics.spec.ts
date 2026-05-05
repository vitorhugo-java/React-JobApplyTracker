import { test, expect } from '@playwright/test'
import { loginUser, uniqueEmail } from './helpers/auth'
import { setupMockApplicationsApi } from './helpers/appApi'

const PASSWORD = 'Test1234!'
const METRICS_TEST_DATA_KEY = 'jobtracker:e2e-metrics-applications'

const seededApplications = [
  {
    id: 1,
    vacancyName: 'Frontend Engineer',
    recruiterName: 'Ana',
    organization: 'Acme',
    vacancyLink: 'https://linkedin.com/jobs/view/1',
    applicationDate: '2026-04-10',
    nextStepDateTime: '2026-04-18T10:00:00',
    status: 'RH',
    recruiterDmReminderEnabled: true,
    interviewScheduled: true,
    archived: false,
    createdAt: '2026-04-10T09:00:00',
  },
  {
    id: 2,
    vacancyName: 'Data Analyst',
    recruiterName: 'Bruno',
    organization: 'Beta Corp',
    vacancyLink: 'https://github.com/jobs/2',
    applicationDate: '2026-03-02',
    nextStepDateTime: '2026-03-08T14:00:00',
    status: 'Rejeitado',
    recruiterDmReminderEnabled: false,
    interviewScheduled: false,
    archived: false,
    createdAt: '2026-03-02T11:30:00',
  },
  {
    id: 3,
    vacancyName: 'Backend Engineer',
    recruiterName: 'Carla',
    organization: 'Acme',
    vacancyLink: 'https://linkedin.com/jobs/view/3',
    applicationDate: '2026-04-22',
    nextStepDateTime: '2026-04-28T09:00:00',
    status: 'Teste Técnico',
    recruiterDmReminderEnabled: true,
    interviewScheduled: false,
    archived: false,
    createdAt: '2026-04-22T13:00:00',
  },
]

test.describe('Metrics page', () => {
  test.beforeEach(async ({ page }) => {
    const email = uniqueEmail('metrics')
    setupMockApplicationsApi(page, seededApplications)
    await page.addInitScript(
      ({ storageKey, applications }) => {
        window.sessionStorage.setItem(storageKey, JSON.stringify(applications))
      },
      { storageKey: METRICS_TEST_DATA_KEY, applications: seededApplications }
    )
    await loginUser(page, email, PASSWORD)
  })

  test('shows the new menu entry and renders the metrics page', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: 'Métricas' })).toBeVisible()

    await page.getByRole('link', { name: 'Métricas' }).click()
    await page.waitForURL('**/metrics')

    await expect(page.getByRole('heading', { name: 'Métricas personalizadas' })).toBeVisible()
    await expect(page.locator('[data-testid="metrics-card-total-value"]')).toHaveText('3')
    await expect(page.locator('[data-testid="metrics-chart-status-distribution"]')).toBeVisible()
  })

  test('applies status and source filters to the metrics snapshot', async ({ page }) => {
    await page.goto('/metrics')
    await page.waitForURL('**/metrics')

    await page.locator('[data-testid="metrics-filter-status"]').click()
    await page.getByRole('option', { name: 'RH', exact: true }).click()
    await expect(page.locator('[data-testid="metrics-card-total-value"]')).toHaveText('1')

    await page.locator('[data-testid="metrics-clear-filters"]').click()
    await page.locator('[data-testid="metrics-filter-source"]').click()
    await page.getByRole('option', { name: 'linkedin.com' }).click()

    await expect(page.locator('[data-testid="metrics-card-total-value"]')).toHaveText('2')
    await expect(page.locator('[data-testid="metrics-card-sources-value"]')).toHaveText('1')
  })
})
