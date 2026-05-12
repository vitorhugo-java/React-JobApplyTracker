import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Bell, Calendar } from 'lucide-react'
import { getApplication, deleteApplication, archiveApplication } from '../../api/applications'
import { createGoogleDriveResume, getGoogleDriveSettings } from '../../api/googleDrive'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import RichLinkPreview from '../../components/ui/RichLinkPreview'
import { getVacancyLabel } from '../../utils/applicationDisplay'
import { canUseGoogleIntegration } from '../../utils/googleDriveAccess'
import { openExternalUrl } from '../../utils/externalLinks'
import { usePageTitle } from '../../hooks/usePageTitle'
import useAuthStore from '../../store/authStore'

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
    <p className="text-sm text-gray-900 dark:text-white mt-0.5">{value || '-'}</p>
  </div>
)

const createEmptyGoogleDriveState = () => ({
  configured: true,
  connected: false,
  accountEmail: '',
  accountDisplayName: '',
  connectedAt: null,
  baseFolderId: '',
  baseFolderName: '',
  baseFolderUrl: '',
  baseResumes: [],
})

const ApplicationDetail = () => {
  usePageTitle('Detalhes da Aplicação')
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useRef(null)
  const user = useAuthStore((s) => s.user)
  const googleDriveEnabled = canUseGoogleIntegration(user)

  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [googleDriveState, setGoogleDriveState] = useState(() => createEmptyGoogleDriveState())
  const [loadingGoogleDrive, setLoadingGoogleDrive] = useState(false)
  const [selectedBaseResumeId, setSelectedBaseResumeId] = useState('')
  const [copyingGoogleDriveResume, setCopyingGoogleDriveResume] = useState(false)
  const [lastCopiedResume, setLastCopiedResume] = useState(null)

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await getApplication(id)
        setApp(res.data)
      } catch (err) {
        const detail = err.response?.data?.message || 'Unable to load the application. Please try refreshing the page.'
        toast.current?.show({ severity: 'error', summary: 'Error', detail })
      } finally {
        setLoading(false)
      }
    }

    fetchApp()
  }, [id])

  const loadGoogleDriveSettings = useCallback(async () => {
    if (!googleDriveEnabled) {
      setGoogleDriveState(createEmptyGoogleDriveState())
      setSelectedBaseResumeId('')
      return
    }

    setLoadingGoogleDrive(true)

    try {
      const response = await getGoogleDriveSettings()
      setGoogleDriveState({ ...createEmptyGoogleDriveState(), ...response.data })
      setSelectedBaseResumeId((currentSelectedBaseResumeId) => {
        if (
          currentSelectedBaseResumeId &&
          response.data.baseResumes.some((resume) => resume.id === currentSelectedBaseResumeId)
        ) {
          return currentSelectedBaseResumeId
        }

        return response.data.baseResumes[0]?.id ?? ''
      })
    } catch (err) {
      if (![404, 501].includes(err.response?.status)) {
        const detail = err.response?.data?.message || 'Could not load your Google Drive settings.'
        toast.current?.show({ severity: 'error', summary: 'Error', detail })
      }
      setGoogleDriveState(createEmptyGoogleDriveState())
      setSelectedBaseResumeId('')
    } finally {
      setLoadingGoogleDrive(false)
    }
  }, [googleDriveEnabled])

  useEffect(() => {
    if (!googleDriveEnabled) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      loadGoogleDriveSettings().catch(() => null)
    }, 0)

    return () => {
      window.clearTimeout(loadTimer)
    }
  }, [googleDriveEnabled, loadGoogleDriveSettings])

  const handleArchive = () => {
    confirmDialog({
      message: 'Are you sure you want to archive this application?',
      header: 'Confirm Archive',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await archiveApplication(id)
          navigate('/applications')
        } catch (err) {
          const detail = err.response?.data?.message || 'Could not archive the application. Please try again.'
          toast.current.show({ severity: 'error', summary: 'Error', detail })
        }
      },
    })
  }

  const handleDelete = () => {
    confirmDialog({
      message: 'Are you sure you want to permanently delete this archived application?',
      header: 'Confirm Permanent Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await deleteApplication(id)
          navigate('/applications')
        } catch (err) {
          const detail = err.response?.data?.message || 'Could not delete the application. Please try again.'
          toast.current.show({ severity: 'error', summary: 'Error', detail })
        }
      },
    })
  }

  const handleCreateGoogleDriveResume = async () => {
    if (!selectedBaseResumeId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Choose a Google Docs base resume first.',
      })
      return
    }

    setCopyingGoogleDriveResume(true)

    try {
      const response = await createGoogleDriveResume({
        applicationId: id,
        baseResumeId: selectedBaseResumeId,
      })
      setLastCopiedResume(response.data)
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Google Docs resume copy created successfully.',
      })
      await loadGoogleDriveSettings().catch(() => null)
    } catch (err) {
      const detail = err.response?.data?.message || 'Could not create the Google Drive resume copy.'
      toast.current?.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setCopyingGoogleDriveResume(false)
    }
  }

  if (loading) return <LoadingSkeleton rows={6} />

  if (!app) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">Application not found.</div>
    )
  }

  const googleDriveRequirementsMet =
    googleDriveState.configured &&
    googleDriveState.connected &&
    googleDriveState.baseFolderId &&
    googleDriveState.baseResumes.length > 0

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
        <div className="flex flex-wrap justify-end gap-2 shrink-0">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            outlined
            onClick={() => navigate(`/applications/${id}/edit`)}
            disabled={Boolean(app.archived)}
          />
          {app.archived ? (
            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              onClick={handleDelete}
              label="Delete"
            />
          ) : (
            <Button
              icon="pi pi-folder"
              severity="warning"
              outlined
              onClick={handleArchive}
              label="Archive"
            />
          )}
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
        <RichLinkPreview url={app.vacancyLink} />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Recruiter Name" value={app.recruiterName} />
        <Field label="Organization" value={app.organization} />
        <Field label="Note" value={app.note} />
        <Field label="Previous Status" value={app.previousStatus} />
        <Field
          label="RH Accepted Connection"
          value={app.rhAcceptedConnection ? 'Yes' : 'No'}
        />
        <Field
          label="Interview Scheduled"
          value={app.interviewScheduled ? 'Yes' : 'No'}
        />
      </div>

      {googleDriveEnabled && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Google Drive Resume Copy</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Use one of your Google Docs base resumes to create a copy for this application.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <select
                  id="googleDriveBaseResume"
                  value={selectedBaseResumeId}
                  onChange={(e) => setSelectedBaseResumeId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  disabled={!googleDriveRequirementsMet}
              >
                <option value="">Choose a Google Docs base resume</option>
                {googleDriveState.baseResumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.documentName}
                    </option>
                ))}
              </select>
              <Button
                  type="button"
                  label="Create Google Docs Copy"
                  icon="pi pi-copy"
                  onClick={handleCreateGoogleDriveResume}
                  loading={copyingGoogleDriveResume}
                  disabled={!googleDriveRequirementsMet || !selectedBaseResumeId}
              />
            </div>

            {lastCopiedResume && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    {lastCopiedResume.copiedFileName}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                        type="button"
                        label="Open Google Doc"
                        icon="pi pi-external-link"
                        onClick={() => openExternalUrl(lastCopiedResume.googleDocUrl)}
                    />
                    <Button
                        type="button"
                        label="Open Vacancy Folder"
                        icon="pi pi-folder-open"
                        outlined
                        onClick={() => openExternalUrl(lastCopiedResume.vacancyFolderUrl)}
                    />
                  </div>
                </div>
            )}
          </section>
      )}

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
