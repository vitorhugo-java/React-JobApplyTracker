import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, Clock, TrendingUp, AlertTriangle, MessageCircle, Send, XCircle, Ghost, CalendarDays, CalendarRange, CalendarClock } from 'lucide-react'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Button } from 'primereact/button'
import { Paginator } from 'primereact/paginator'
import { getDashboardSummary } from '../../api/dashboard'
import { getApplications, getOverdue, markDmSent } from '../../api/applications'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getVacancyLabel } from '../../utils/applicationDisplay'
import { usePageTitle } from '../../hooks/usePageTitle'

const DASHBOARD_PAGE_SIZE = 5

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
        <Button
          rounded
          text
          icon={() => <Send className="w-4 h-4" />}
          onClick={(e) => {
            e.preventDefault()
            onMarkDmSent(app)
          }}
          title="Mark DM as sent"
          className="p-button-sm"
        />
      )}
    </div>
  </div>
)

const Dashboard = () => {
  usePageTitle('Painel')
  const toast = useRef(null)
  const [summary, setSummary] = useState(null)
  const [toSendLater, setToSendLater] = useState([])
  const [toSendLaterTotal, setToSendLaterTotal] = useState(0)
  const [toSendLaterPage, setToSendLaterPage] = useState(0)
  const [overdue, setOverdue] = useState([])
  const [overduePage, setOverduePage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, toSendLaterRes, overdueRes] = await Promise.all([
          getDashboardSummary(),
          getApplications({
            archived: false,
            status: 'TO_SEND_LATER',
            sort: 'createdAt,asc',
            page: toSendLaterPage,
            size: DASHBOARD_PAGE_SIZE,
          }),
          getOverdue(),
        ])
        setSummary(summaryRes.data)
        setToSendLater(toSendLaterRes.data?.content || toSendLaterRes.data?.items || [])
        setToSendLaterTotal(toSendLaterRes.data?.totalElements || toSendLaterRes.data?.total || 0)
        setOverdue(overdueRes.data || [])
      } catch {
        // Keep dashboard shell visible even when summary endpoints are temporarily unavailable.
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [toSendLaterPage])

  const handleMarkDmSent = async (app) => {
    confirmDialog({
      message: 'Are you sure you want to mark this DM as sent?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        const removeApp = (list) => list.filter((a) => a.id !== app.id)
        setOverdue(removeApp)
        try {
          await markDmSent(app.id)
          toast.current?.show({ severity: 'success', summary: 'Success', detail: 'DM marked as sent!' })
        } catch {
          setOverdue((prev) => [...prev, app])
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to mark DM as sent.' })
        }
      },
    })
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
    { icon: CalendarDays, label: 'Média diária', value: summary?.averageDailyApplications, color: 'bg-cyan-500', testId: 'metric-average-daily' },
    { icon: CalendarRange, label: 'Média semanal', value: summary?.averageWeeklyApplications, color: 'bg-sky-500', testId: 'metric-average-weekly' },
    { icon: CalendarClock, label: 'Média mensal', value: summary?.averageMonthlyApplications, color: 'bg-blue-500', testId: 'metric-average-monthly' },
  ]

  const overduePageItems = overdue.slice(
    overduePage * DASHBOARD_PAGE_SIZE,
    (overduePage + 1) * DASHBOARD_PAGE_SIZE
  )

  return (
    <div className="space-y-6">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your job search</p>
      </div>

      {loading ? (
        <LoadingSkeleton rows={2} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-8 gap-4">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">To send later</h2>
          </div>
          <div className="p-2">
            {loading ? (
              <LoadingSkeleton rows={3} className="p-2" />
            ) : toSendLater.length === 0 ? (
              <EmptyState title="Nothing to send later" description="All pending applications are already handled." />
            ) : (
              toSendLater.map((app) => <AppRow key={app.id} app={app} />)
            )}
          </div>
          {!loading && toSendLaterTotal > DASHBOARD_PAGE_SIZE && (
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2">
              <Paginator
                first={toSendLaterPage * DASHBOARD_PAGE_SIZE}
                rows={DASHBOARD_PAGE_SIZE}
                totalRecords={toSendLaterTotal}
                onPageChange={(event) => setToSendLaterPage(event.page)}
                template="PrevPageLink CurrentPageReport NextPageLink"
                currentPageReportTemplate="{first} - {last} of {totalRecords}"
              />
            </div>
          )}
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
              overduePageItems.map((app) => <AppRow key={app.id} app={app} onMarkDmSent={handleMarkDmSent} />)
            )}
          </div>
          {!loading && overdue.length > DASHBOARD_PAGE_SIZE && (
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2">
              <Paginator
                first={overduePage * DASHBOARD_PAGE_SIZE}
                rows={DASHBOARD_PAGE_SIZE}
                totalRecords={overdue.length}
                onPageChange={(event) => setOverduePage(event.page)}
                template="PrevPageLink CurrentPageReport NextPageLink"
                currentPageReportTemplate="{first} - {last} of {totalRecords}"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
