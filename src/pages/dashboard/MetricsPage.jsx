import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, CalendarClock, Clock3, Globe, MessageCircle, Percent } from 'lucide-react'
import { Toast } from 'primereact/toast'
import { getMetricsApplications } from '../../api/dashboard'
import MetricsCharts from '../../components/ui/MetricsCharts'
import MetricsFiltersPanel from '../../components/ui/MetricsFiltersPanel'
import MetricsPanel from '../../components/ui/MetricsPanel'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import { usePageTitle } from '../../hooks/usePageTitle'
import { buildMetricsDashboardModel } from '../../utils/dashboardMetrics'

const defaultFilters = {
  startDate: null,
  endDate: null,
  status: null,
  source: null,
  search: '',
}

const MetricsPage = () => {
  usePageTitle('Métricas')

  const toast = useRef(null)
  const [applications, setApplications] = useState([])
  const [filters, setFilters] = useState({ ...defaultFilters })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const items = await getMetricsApplications()
        setApplications(items)
      } catch {
        toast.current?.show({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar as aplicações para montar as métricas.',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const model = useMemo(
    () => buildMetricsDashboardModel(applications, filters),
    [applications, filters]
  )

  const cards = useMemo(
    () => [
      {
        key: 'total',
        label: 'Aplicações filtradas',
        value: model.summary.totalApplications,
        format: 'integer',
        tone: 'indigo',
        icon: BarChart3,
        testId: 'metrics-card-total',
      },
      {
        key: 'interviews',
        label: 'Entrevistas agendadas',
        value: model.summary.interviewCount,
        format: 'integer',
        tone: 'emerald',
        icon: CalendarClock,
        testId: 'metrics-card-interviews',
      },
      {
        key: 'days-open',
        label: 'Tempo médio desde a candidatura',
        value: model.summary.averageDaysSinceApplication,
        format: 'days',
        tone: 'amber',
        icon: Clock3,
        testId: 'metrics-card-average-age',
      },
      {
        key: 'days-next-step',
        label: 'Tempo médio até a próxima etapa',
        value: model.summary.averageDaysToNextStep,
        format: 'days',
        tone: 'sky',
        icon: BarChart3,
        testId: 'metrics-card-average-next-step',
      },
      {
        key: 'reminders',
        label: 'Lembretes de DM ativos',
        value: model.summary.reminderCount,
        format: 'integer',
        tone: 'violet',
        icon: MessageCircle,
        testId: 'metrics-card-reminders',
      },
      {
        key: 'interview-rate',
        label: 'Taxa de entrevista',
        value: model.summary.interviewRate,
        format: 'percent',
        tone: 'rose',
        icon: Percent,
        testId: 'metrics-card-interview-rate',
      },
      {
        key: 'rejection-rate',
        label: 'Taxa de rejeição',
        value: model.summary.rejectionRate,
        format: 'percent',
        tone: 'rose',
        icon: Percent,
        testId: 'metrics-card-rejection-rate',
      },
      {
        key: 'sources',
        label: 'Origens únicas',
        value: model.summary.uniqueSources,
        format: 'integer',
        tone: 'indigo',
        icon: Globe,
        testId: 'metrics-card-sources',
      },
    ],
    [model.summary]
  )

  return (
    <div className="space-y-6">
      <Toast ref={toast} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Métricas personalizadas</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Analise sua busca com filtros por período, status, texto e origem.
        </p>
      </div>

      <MetricsFiltersPanel
        filters={filters}
        onChange={(changes) => setFilters((current) => ({ ...current, ...changes }))}
        onClear={() => setFilters({ ...defaultFilters })}
        statusOptions={model.statusOptions}
        sourceOptions={model.sourceOptions}
        totalCount={applications.length}
        filteredCount={model.filteredApplications.length}
      />

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : applications.length === 0 ? (
        <EmptyState
          title="Sem aplicações para analisar"
          description="Cadastre algumas aplicações para liberar métricas, filtros e gráficos."
        />
      ) : (
        <>
          <MetricsPanel cards={cards} />
          <MetricsCharts charts={model.charts} />
        </>
      )}
    </div>
  )
}

export default MetricsPage
