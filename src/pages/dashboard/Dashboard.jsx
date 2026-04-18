import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, Clock, TrendingUp, AlertTriangle, MessageCircle, Send, XCircle, Ghost } from 'lucide-react'
import { Toast } from 'primereact/toast'
import { getDashboardSummary } from '../../api/dashboard'
import { getUpcoming, getOverdue, markDmSent } from '../../api/applications'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getVacancyLabel } from '../../utils/applicationDisplay'
import { usePageTitle } from '../../hooks/usePageTitle'

const MetricCard = ({ icon, label, value, color, testId }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700" data-testid={testId}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1" data-testid={testId && `${testId}-value`}>{value ?? 0}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {React.createElement(icon, { className: 'w-6 h-6 text-white' })}
      </div>
    </div>
  </div>
)

const AppRow = ({ app, onMarkDmSent }) => (
  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
    <Link
      to={`/applications/${app.id}`}
      className="flex-1"
    >
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{getVacancyLabel(app.vacancyName)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{app.recruiterName}</p>
      </div>
    </Link>
    <div className="flex items-center gap-3">
      {app.nextStepDateTime && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {new Date(app.nextStepDateTime).toLocaleDateString('pt-BR')}
        </span>
      )}
      <StatusBadge status={app.status || 'TO_SEND_LATER'} />
      {onMarkDmSent && (
        <button
          onClick={(e) => {
            e.preventDefault()
            onMarkDmSent(app)
          }}
          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
          title="Mark DM as sent"
        >
          <Send className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
)

const Dashboard = () => {
  usePageTitle('Painel')
  const toast = useRef(null)
  const [summary, setSummary] = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, upcomingRes, overdueRes] = await Promise.all([
          getDashboardSummary(),
          getUpcoming(),
          getOverdue(),
        ])
        setSummary(summaryRes.data)
        setUpcoming(upcomingRes.data || [])
        setOverdue(overdueRes.data || [])
      } catch {
        // Keep dashboard shell visible even when summary endpoints are temporarily unavailable.
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const handleMarkDmSent = async (app) => {
    // Optimistically remove the app from both lists
    const removeApp = (list) => list.filter((a) => a.id !== app.id)
    setUpcoming(removeApp)
    setOverdue(removeApp)
    try {
      await markDmSent(app.id)
      toast.current?.show({ severity: 'success', summary: 'Success', detail: 'DM marked as sent!' })
    } catch {
      // Restore the app if the request fails
      setUpcoming((prev) => [...prev, app])
      setOverdue((prev) => [...prev, app])
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to mark DM as sent.' })
    }
  }

  const metrics = [
    { icon: BarChart2, label: 'Total Applications', value: summary?.totalApplications, color: 'bg-indigo-500', testId: 'metric-total' },
    { icon: Clock, label: 'Waiting Responses', value: summary?.waitingResponses, color: 'bg-yellow-500', testId: 'metric-waiting' },
    { icon: TrendingUp, label: 'Interviews Scheduled', value: summary?.interviewsScheduled, color: 'bg-green-500', testId: 'metric-interviews' },
    { icon: AlertTriangle, label: 'Overdue Follow-ups', value: summary?.overdueFollowUps, color: 'bg-red-500', testId: 'metric-overdue' },
    { icon: MessageCircle, label: 'DM Reminders Enabled', value: summary?.dmRemindersEnabled, color: 'bg-purple-500', testId: 'metric-reminders' },
    { icon: Send, label: 'To Send Later', value: summary?.toSendLater, color: 'bg-slate-500', testId: 'metric-to-send-later' },
    { icon: XCircle, label: 'Rejeitado', value: summary?.rejectedCount, color: 'bg-rose-500', testId: 'metric-rejected' },
    { icon: Ghost, label: 'Ghosting', value: summary?.ghostingCount, color: 'bg-zinc-500', testId: 'metric-ghosting' },
  ]

  return (
    <div className="space-y-6">
      <Toast ref={toast} />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your job search</p>
      </div>

      {loading ? (
        <LoadingSkeleton rows={2} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Upcoming Steps</h2>
          </div>
          <div className="p-2">
            {loading ? (
              <LoadingSkeleton rows={3} className="p-2" />
            ) : upcoming.length === 0 ? (
              <EmptyState title="No upcoming steps" description="All caught up!" />
            ) : (
              upcoming.map((app) => <AppRow key={app.id} app={app} onMarkDmSent={handleMarkDmSent} />)
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Overdue Follow-ups</h2>
          </div>
          <div className="p-2">
            {loading ? (
              <LoadingSkeleton rows={3} className="p-2" />
            ) : overdue.length === 0 ? (
              <EmptyState title="No overdue follow-ups" description="Great job staying on top of things!" />
            ) : (
              overdue.map((app) => <AppRow key={app.id} app={app} onMarkDmSent={handleMarkDmSent} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
