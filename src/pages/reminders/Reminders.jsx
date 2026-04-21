import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { InputSwitch } from 'primereact/inputswitch'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Calendar, Bell, Send } from 'lucide-react'
import { getUpcoming, getOverdue, patchReminder, markDmSent } from '../../api/applications'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getVacancyLabel } from '../../utils/applicationDisplay'
import { usePageTitle } from '../../hooks/usePageTitle'

const ReminderCard = ({ app, onToggle, onMarkDmSent }) => {
  const reminderAt = app.createdAt
    ? new Date(new Date(app.createdAt).getTime() + (6 * 60 * 60 * 1000))
    : null

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
      <Link to={`/applications/${app.id}`} className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{getVacancyLabel(app.vacancyName)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{app.recruiterName || 'No recruiter'}</p>
        <div className="flex items-center gap-3 mt-2">
          <StatusBadge status={app.status || 'TO_SEND_LATER'} />
          {reminderAt && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {reminderAt.toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      </Link>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <button
          onClick={() => onMarkDmSent(app)}
          className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
          title="Mark DM as sent"
        >
          <Send className="w-4 h-4" />
        </button>
        <Bell className={`w-4 h-4 ${app.recruiterDmReminderEnabled ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`} />
        <InputSwitch
          checked={app.recruiterDmReminderEnabled}
          onChange={() => onToggle(app)}
        />
      </div>
    </div>
  )
}

const Section = ({ title, items, loading, onToggle, onMarkDmSent }) => (
  <div>
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{title}</h2>
    {loading ? (
      <LoadingSkeleton rows={3} />
    ) : items.length === 0 ? (
      <EmptyState title={`No ${title.toLowerCase()}`} />
    ) : (
      <div className="space-y-3">
        {items.map((app) => (
          <ReminderCard key={app.id} app={app} onToggle={onToggle} onMarkDmSent={onMarkDmSent} />
        ))}
      </div>
    )}
  </div>
)

const Reminders = () => {
  usePageTitle('Lembretes')
  const toast = useRef(null)
  const [upcoming, setUpcoming] = useState([])
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [upRes, ovRes] = await Promise.all([getUpcoming(), getOverdue()])
        setUpcoming(upRes.data || [])
        setOverdue(ovRes.data || [])
      } catch {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load reminders.' })
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const handleToggle = async (app) => {
    const newVal = !app.recruiterDmReminderEnabled
    const update = (list) =>
      list.map((a) => (a.id === app.id ? { ...a, recruiterDmReminderEnabled: newVal } : a))
    setUpcoming(update)
    setOverdue(update)
    try {
      await patchReminder(app.id, newVal)
    } catch {
      const revert = (list) =>
        list.map((a) => (a.id === app.id ? { ...a, recruiterDmReminderEnabled: app.recruiterDmReminderEnabled } : a))
      setUpcoming(revert)
      setOverdue(revert)
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to update reminder.' })
    }
  }

  const handleMarkDmSent = async (app) => {
    confirmDialog({
      message: 'Are you sure you want to mark this DM as sent?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
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
      },
    })
  }

  return (
    <div className="space-y-8">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reminders</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage follow-up reminders for your applications</p>
      </div>
      <Section title="Upcoming" items={upcoming} loading={loading} onToggle={handleToggle} onMarkDmSent={handleMarkDmSent} />
      <Section title="Overdue" items={overdue} loading={loading} onToggle={handleToggle} onMarkDmSent={handleMarkDmSent} />
    </div>
  )
}

export default Reminders
