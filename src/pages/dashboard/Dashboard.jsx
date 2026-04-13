import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, Clock, TrendingUp, AlertTriangle, MessageCircle } from 'lucide-react'
import { getDashboardSummary } from '../../api/dashboard'
import { getUpcoming, getOverdue } from '../../api/applications'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'

const MetricCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value ?? 0}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
)

const AppRow = ({ app }) => (
  <Link
    to={`/applications/${app.id}`}
    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
  >
    <div>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{app.vacancyName}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{app.recruiterName}</p>
    </div>
    <div className="flex items-center gap-3">
      {app.nextStepDateTime && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {new Date(app.nextStepDateTime).toLocaleDateString()}
        </span>
      )}
      <StatusBadge status={app.status} />
    </div>
  </Link>
)

const Dashboard = () => {
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
      } catch (_) {
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const metrics = [
    { icon: BarChart2, label: 'Total Applications', value: summary?.totalApplications, color: 'bg-indigo-500' },
    { icon: Clock, label: 'Waiting Responses', value: summary?.waitingResponses, color: 'bg-yellow-500' },
    { icon: TrendingUp, label: 'Interviews Scheduled', value: summary?.interviewsScheduled, color: 'bg-green-500' },
    { icon: AlertTriangle, label: 'Overdue Follow-ups', value: summary?.overdueFollowUps, color: 'bg-red-500' },
    { icon: MessageCircle, label: 'DM Reminders Enabled', value: summary?.dmRemindersEnabled, color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your job search</p>
      </div>

      {loading ? (
        <LoadingSkeleton rows={2} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
              upcoming.map((app) => <AppRow key={app.id} app={app} />)
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
              overdue.map((app) => <AppRow key={app.id} app={app} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
