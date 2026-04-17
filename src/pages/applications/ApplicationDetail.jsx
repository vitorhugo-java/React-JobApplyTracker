import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Edit, Trash2, ExternalLink, Bell, Calendar } from 'lucide-react'
import { getApplication, deleteApplication } from '../../api/applications'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import { getVacancyLabel } from '../../utils/applicationDisplay'
import { usePageTitle } from '../../hooks/usePageTitle'

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
    <p className="text-sm text-gray-900 dark:text-white mt-0.5">{value || '-'}</p>
  </div>
)

const ApplicationDetail = () => {
  usePageTitle('Detalhes da Aplicação')
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useRef(null)

  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await getApplication(id)
        setApp(res.data)
      } catch {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load application.' })
      } finally {
        setLoading(false)
      }
    }
    fetchApp()
  }, [id])

  const handleDelete = () => {
    confirmDialog({
      message: 'Are you sure you want to delete this application?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await deleteApplication(id)
          navigate('/applications')
        } catch {
          toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete application.' })
        }
      },
    })
  }

  if (loading) return <LoadingSkeleton rows={6} />

  if (!app) return (
    <div className="text-center py-16 text-gray-500 dark:text-gray-400">Application not found.</div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getVacancyLabel(app.vacancyName)}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={app.status || 'TO_SEND_LATER'} />
            {app.applicationDate && (
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Applied {new Date(app.applicationDate).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            outlined
            onClick={() => navigate(`/applications/${id}/edit`)}
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            outlined
            onClick={handleDelete}
            label="Delete"
          />
        </div>
      </div>

      {app.nextStepDateTime && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Next Step</p>
            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
              {new Date(app.nextStepDateTime).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      )}

      {app.vacancyLink && (
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vacancy Link</p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 truncate">{app.vacancyLink}</p>
            </div>
            <a
              href={app.vacancyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </a>
          </div>
          <iframe
            title="Vacancy preview"
            src={app.vacancyLink}
            className="w-full h-72 rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Recruiter Name" value={app.recruiterName} />
        <Field label="Organization" value={app.organization} />
        <Field
          label="RH Accepted Connection"
          value={app.rhAcceptedConnection ? 'Yes' : 'No'}
        />
        <Field
          label="Interview Scheduled"
          value={app.interviewScheduled ? 'Yes' : 'No'}
        />
      </div>

      {app.recruiterName && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          app.recruiterDmReminderEnabled
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
        }`}>
          <Bell className={`w-5 h-5 ${app.recruiterDmReminderEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Recruiter DM Reminder</p>
            <p className={`text-xs ${app.recruiterDmReminderEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {app.recruiterDmReminderEnabled ? 'Enabled — reminder is active' : 'Disabled'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicationDetail
