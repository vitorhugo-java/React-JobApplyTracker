import { APPLICATION_STATUSES, TO_SEND_LATER_STATUS } from '../api/applications'

const DAY_IN_MS = 24 * 60 * 60 * 1000
const SOURCE_FALLBACK = 'Sem origem'
const STATUS_COLORS = [
  '#6366f1',
  '#14b8a6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#0ea5e9',
  '#f97316',
  '#84cc16',
  '#64748b',
  '#ec4899',
]
const MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  year: '2-digit',
})

const toDate = (value) => {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const normalizeText = (value) => String(value || '').trim().toLocaleLowerCase('pt-BR')

const startOfDay = (date) => {
  const normalized = toDate(date)
  if (!normalized) return null

  return new Date(normalized.getFullYear(), normalized.getMonth(), normalized.getDate(), 0, 0, 0, 0)
}

const endOfDay = (date) => {
  const normalized = toDate(date)
  if (!normalized) return null

  return new Date(normalized.getFullYear(), normalized.getMonth(), normalized.getDate(), 23, 59, 59, 999)
}

const diffInDays = (start, end) => {
  const startDate = toDate(start)
  const endDate = toDate(end)

  if (!startDate || !endDate) {
    return null
  }

  return Math.max(0, (endDate.getTime() - startDate.getTime()) / DAY_IN_MS)
}

const average = (values) => {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const round = (value) => Number(value.toFixed(1))

const createChartColors = (count) => Array.from({ length: count }, (_, index) => STATUS_COLORS[index % STATUS_COLORS.length])

export const getApplicationSource = (vacancyLink) => {
  if (!vacancyLink) {
    return SOURCE_FALLBACK
  }

  try {
    const url = new URL(vacancyLink)
    const hostname = url.hostname.replace(/^www\./i, '')

    return hostname || SOURCE_FALLBACK
  } catch {
    return SOURCE_FALLBACK
  }
}

export const getApplicationReferenceDate = (application) =>
  toDate(application.applicationDate) || toDate(application.createdAt)

export const buildSourceOptions = (applications) => {
  const uniqueSources = [...new Set(applications.map((application) => getApplicationSource(application.vacancyLink)))]
    .sort((left, right) => left.localeCompare(right, 'pt-BR'))

  return [
    { label: 'Todas as origens', value: null },
    ...uniqueSources.map((source) => ({ label: source, value: source })),
  ]
}

export const buildStatusOptions = () => [
  { label: 'Todos os status', value: null },
  { label: 'To send later', value: TO_SEND_LATER_STATUS },
  ...APPLICATION_STATUSES.map((status) => ({ label: status, value: status })),
]

export const filterApplications = (applications, filters) => {
  const startDate = startOfDay(filters.startDate)
  const endDate = endOfDay(filters.endDate)
  const normalizedSearch = normalizeText(filters.search)

  return applications.filter((application) => {
    const referenceDate = getApplicationReferenceDate(application)
    const source = getApplicationSource(application.vacancyLink)

    if (filters.status) {
      if (filters.status === TO_SEND_LATER_STATUS) {
        if (application.status != null) {
          return false
        }
      } else if (application.status !== filters.status) {
        return false
      }
    }

    if (filters.source && source !== filters.source) {
      return false
    }

    if (startDate && (!referenceDate || referenceDate < startDate)) {
      return false
    }

    if (endDate && (!referenceDate || referenceDate > endDate)) {
      return false
    }

    if (normalizedSearch) {
      const searchable = [
        application.vacancyName,
        application.organization,
        application.recruiterName,
        source,
      ]
        .map(normalizeText)
        .join(' ')

      if (!searchable.includes(normalizedSearch)) {
        return false
      }
    }

    return true
  })
}

const buildStatusDistributionChart = (applications) => {
  const counts = new Map()

  applications.forEach((application) => {
    const label = application.status || TO_SEND_LATER_STATUS
    counts.set(label, (counts.get(label) || 0) + 1)
  })

  const labels = [...counts.keys()]
  const data = labels.map((label) => counts.get(label))

  return {
    key: 'status-distribution',
    title: 'Distribuição por status',
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: createChartColors(labels.length),
          borderWidth: 0,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#64748b',
          },
        },
      },
    },
  }
}

const buildTimelineChart = (applications) => {
  const counts = new Map()

  applications.forEach((application) => {
    const referenceDate = getApplicationReferenceDate(application)
    if (!referenceDate) return

    const key = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  const entries = [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)).slice(-12)
  const labels = entries.map(([key]) => {
    const [year, month] = key.split('-').map(Number)
    return MONTH_FORMATTER.format(new Date(year, month - 1, 1))
  })
  const data = entries.map(([, count]) => count)

  return {
    key: 'timeline',
    title: 'Candidaturas por mês',
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Aplicações',
          data,
          fill: false,
          borderColor: '#6366f1',
          backgroundColor: '#6366f1',
          tension: 0.35,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#64748b',
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#64748b',
            precision: 0,
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.2)',
          },
        },
      },
    },
  }
}

const buildAverageDaysByStatusChart = (applications) => {
  const buckets = new Map()
  const now = new Date()

  applications.forEach((application) => {
    const label = application.status || TO_SEND_LATER_STATUS
    const referenceDate = getApplicationReferenceDate(application)
    const days = diffInDays(referenceDate, now)

    if (days == null) return

    const values = buckets.get(label) || []
    values.push(days)
    buckets.set(label, values)
  })

  const entries = [...buckets.entries()]
    .map(([label, values]) => ({ label, value: round(average(values)) }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 8)

  return {
    key: 'average-days-by-status',
    title: 'Tempo médio por status (dias)',
    type: 'bar',
    data: {
      labels: entries.map((entry) => entry.label),
      datasets: [
        {
          label: 'Dias médios',
          data: entries.map((entry) => entry.value),
          backgroundColor: createChartColors(entries.length),
          borderRadius: 8,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#64748b',
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#64748b',
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.2)',
          },
        },
      },
    },
  }
}

export const buildMetricsSummary = (applications) => {
  const now = new Date()
  const totalApplications = applications.length
  const interviewCount = applications.filter((application) => application.interviewScheduled).length
  const reminderCount = applications.filter((application) => application.recruiterDmReminderEnabled).length
  const rejectedCount = applications.filter((application) => application.status === 'Rejeitado').length
  const averageDaysSinceApplication = round(
    average(
      applications
        .map((application) => diffInDays(getApplicationReferenceDate(application), now))
        .filter((value) => value != null)
    )
  )
  const averageDaysToNextStep = round(
    average(
      applications
        .map((application) => diffInDays(getApplicationReferenceDate(application), application.nextStepDateTime))
        .filter((value) => value != null)
    )
  )
  const interviewRate = totalApplications === 0 ? 0 : round((interviewCount / totalApplications) * 100)
  const rejectionRate = totalApplications === 0 ? 0 : round((rejectedCount / totalApplications) * 100)
  const uniqueSources = new Set(applications.map((application) => getApplicationSource(application.vacancyLink))).size

  return {
    totalApplications,
    interviewCount,
    reminderCount,
    averageDaysSinceApplication,
    averageDaysToNextStep,
    interviewRate,
    rejectionRate,
    uniqueSources,
  }
}

export const buildMetricsDashboardModel = (applications, filters) => {
  const filteredApplications = filterApplications(applications, filters)

  return {
    filteredApplications,
    sourceOptions: buildSourceOptions(applications),
    statusOptions: buildStatusOptions(),
    summary: buildMetricsSummary(filteredApplications),
    charts: [
      buildStatusDistributionChart(filteredApplications),
      buildTimelineChart(filteredApplications),
      buildAverageDaysByStatusChart(filteredApplications),
    ],
  }
}

export const formatMetricValue = (value, format = 'integer') => {
  switch (format) {
    case 'days':
      return `${Number(value || 0).toFixed(1)} d`
    case 'percent':
      return `${Number(value || 0).toFixed(1)}%`
    default:
      return Number.isInteger(value) ? String(value) : Number(value || 0).toFixed(1)
  }
}
