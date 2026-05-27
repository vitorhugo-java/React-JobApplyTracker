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
    source: 'linkedin.com',
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
    source: 'github.com',
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
    source: 'linkedin.com',
    status: 'Teste Técnico',
    recruiterDmReminderEnabled: true,
    interviewScheduled: false,
    archived: false,
    createdAt: '2026-04-22T13:00:00',
  },
]

test.beforeEach(async ({ page }) => {
    page.on('pageerror', (error) => {
        console.log('PAGE ERROR:', error.message)
    })

    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text())
        }
    })
})

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
      await page.route(
          '**/applications/overdue',
          route => route.fulfill({
              status:200,
              body:'[]'
          })
      )

      await loginUser(page, email, PASSWORD)
  })

    test(
        'applies status and source filters',
        async ({ page }) => {

            await page.goto('/metrics')

            await expect(
                page.locator(
                    '[data-testid="metrics-page"]'
                )
            ).toBeVisible()

            await page.locator(
                '[data-testid="metrics-filter-status"]'
            ).click()

            await page.getByText(
                'RH',
                { exact:true }
            ).click()

            await expect(
                page.locator(
                    '[data-testid="metrics-card-total-value"]'
                )
            ).toHaveText('1')
        }
    )

  test(
      'shows the new menu entry and renders the metrics page',
      async ({ page }) => {

        await page.goto('/metrics')

        await expect(
            page.getByRole(
                'heading',
                { name:'Métricas personalizadas' }
            )
        ).toBeVisible()

        await expect(
            page.locator(
                '[data-testid="metrics-card-total-value"]'
            )
        ).toHaveText('3')

        await expect(
            page.locator(
                '[data-testid="metrics-chart-status-distribution"]'
            )
        ).toBeVisible()
      })

  test('applies status and source filters to the metrics snapshot', async ({ page }) => {
    await page.goto('/metrics')
    await page.waitForURL('**/metrics')

    await page.locator(
        '[data-testid="metrics-filter-status"]'
    ).click()
    await page.getByText(
        'RH',
        { exact:true }
    ).click()
    await expect(page.locator('[data-testid="metrics-card-total-value"]')).toHaveText('1')

    await page.locator('[data-testid="metrics-clear-filters"]').click()
    await page.locator('[data-testid="metrics-filter-source"]').click()
    await page.getByRole('option', { name: 'linkedin.com' }).click()

    await expect(page.locator('[data-testid="metrics-card-total-value"]')).toHaveText('2')
    await expect(page.locator('[data-testid="metrics-card-sources-value"]')).toHaveText('1')
  })
})
