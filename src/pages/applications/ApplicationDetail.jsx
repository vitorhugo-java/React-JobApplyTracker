import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Dropdown } from 'primereact/dropdown'
import { SelectButton } from 'primereact/selectbutton'
import { Bell, Calendar } from 'lucide-react'
import { getApplication, deleteApplication, archiveApplication } from '../../api/applications'
import {
  createGoogleDriveResume,
  generateTemplateCv,
  getCvPlaceholders,
  getGoogleDriveSettings,
} from '../../api/googleDrive'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import RichLinkPreview from '../../components/ui/RichLinkPreview'
import RecruiterNameLink from '../../components/ui/RecruiterNameLink'
import ResumePlaceholderDialog from '../../components/ui/ResumePlaceholderDialog'
import { getVacancyLabel } from '../../utils/applicationDisplay'
import { canUseGoogleIntegration } from '../../utils/googleDriveAccess'
import { buildGoogleDriveFolderUrl, formatGoogleDriveDateTime } from '../../utils/googleDrive'
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
  const [placeholderDialogVisible, setPlaceholderDialogVisible] = useState(false)
  const [resumePlaceholders, setResumePlaceholders] = useState([])
  const [resumeInitialValues, setResumeInitialValues] = useState({})
  const [latestGeneratedResume, setLatestGeneratedResume] = useState(null)
  const [cvCopyMode, setCvCopyMode] = useState('base')

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

  const selectedBaseResume = googleDriveState.baseResumes.find((resume) => resume.id === selectedBaseResumeId)
  const templateModeEnabled = Boolean(selectedBaseResume?.templateEnabled)

  const handleCreateGoogleDriveResume = async () => {
    if (!selectedBaseResumeId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Choose a Google Docs base resume first.',
      })
      return
    }

    if (cvCopyMode === 'template' && !templateModeEnabled) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Template mode is only available for template-enabled CVs.',
      })
      return
    }

    setCopyingGoogleDriveResume(true)

    try {
      if (cvCopyMode === 'base') {
        const response = await createGoogleDriveResume({
          applicationId: id,
          baseResumeId: selectedBaseResumeId,
        })
        setLatestGeneratedResume(response.data)
        setApp((currentApp) => (
          currentApp
            ? {
                ...currentApp,
                driveVacancyFolderId: response.data?.vacancyFolderId ?? currentApp.driveVacancyFolderId,
                driveResumeFileId: response.data?.copiedFileId ?? currentApp.driveResumeFileId,
                driveResumeFileName: response.data?.copiedFileName ?? currentApp.driveResumeFileName,
                driveResumeDocumentUrl: response.data?.googleDocUrl ?? currentApp.driveResumeDocumentUrl,
                driveResumeGeneratedAt: response.data?.generatedAt ?? currentApp.driveResumeGeneratedAt,
              }
            : currentApp
        ))
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Resume copy generated successfully.',
        })
        await loadGoogleDriveSettings().catch(() => null)
        return
      }

      const response = await getCvPlaceholders(selectedBaseResumeId)
      setResumePlaceholders(response.data?.placeholders ?? [])
      setResumeInitialValues({})
      setPlaceholderDialogVisible(true)
    } catch (err) {
      const detail = err.response?.data?.message || 'Could not prepare the selected CV.'
      toast.current?.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setCopyingGoogleDriveResume(false)
    }
  }

  const handleSubmitResumePlaceholders = async (values) => {
    setCopyingGoogleDriveResume(true)

    try {
      const response = await generateTemplateCv(selectedBaseResumeId, values)
      const generatedDocumentUrl = response.data?.documentUrl
      setLatestGeneratedResume((current) => ({
        ...current,
        copiedFileName: selectedBaseResume?.documentName || current?.copiedFileName || 'Generated CV',
        googleDocUrl: generatedDocumentUrl || current?.googleDocUrl || '',
        generatedAt: current?.generatedAt ?? new Date().toISOString(),
      }))
      setPlaceholderDialogVisible(false)
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Template CV generated successfully.',
      })
      if (generatedDocumentUrl) {
        openExternalUrl(generatedDocumentUrl)
      }
    } catch (err) {
      const detail = err.response?.data?.message || 'Could not generate the template CV.'
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
  const latestResumeCopy = latestGeneratedResume?.googleDocUrl
    ? {
        copiedFileName: latestGeneratedResume.copiedFileName || 'Google Docs Resume',
        googleDocUrl: latestGeneratedResume.googleDocUrl,
        pdfUrl: latestGeneratedResume.pdfUrl ?? '',
        vacancyFolderUrl: latestGeneratedResume.vacancyFolderUrl ?? buildGoogleDriveFolderUrl(app.driveVacancyFolderId),
        generatedAt: latestGeneratedResume.generatedAt ?? app.driveResumeGeneratedAt,
      }
    : app?.driveResumeDocumentUrl
      ? {
          copiedFileName: app.driveResumeFileName || 'Google Docs Resume',
          googleDocUrl: app.driveResumeDocumentUrl,
          pdfUrl: '',
          vacancyFolderUrl: buildGoogleDriveFolderUrl(app.driveVacancyFolderId),
          generatedAt: app.driveResumeGeneratedAt,
        }
      : null
  const baseResumeOptions = googleDriveState.baseResumes.map((resume) => ({
    label: resume.documentName,
    value: resume.id,
  }))
  const cvModeOptions = [
    { label: 'Base', value: 'base' },
    { label: 'Template', value: 'template', disabled: !templateModeEnabled },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Toast ref={toast} />
      <ConfirmDialog />
      <ResumePlaceholderDialog
        visible={placeholderDialogVisible}
        placeholders={resumePlaceholders}
        initialValues={resumeInitialValues}
        onSubmit={handleSubmitResumePlaceholders}
        onClose={() => setPlaceholderDialogVisible(false)}
      />

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
        <Field
          label="Recruiter Name"
          value={<RecruiterNameLink recruiterName={app.recruiterName} className="text-sm text-gray-900 dark:text-white break-all" fallback="-" />}
        />
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
              <SelectButton
                value={cvCopyMode}
                options={cvModeOptions}
                optionLabel="label"
                optionValue="value"
                optionDisabled="disabled"
                onChange={(e) => setCvCopyMode(e.value)}
                className="w-full"
                disabled={loadingGoogleDrive || !googleDriveRequirementsMet}
              />
              <Dropdown
                  inputId="googleDriveBaseResume"
                  value={selectedBaseResumeId}
                  options={baseResumeOptions}
                  onChange={(e) => {
                    const nextBaseResume = googleDriveState.baseResumes.find((resume) => resume.id === e.value)
                    setSelectedBaseResumeId(e.value)
                    if (cvCopyMode === 'template' && !nextBaseResume?.templateEnabled) {
                      setCvCopyMode('base')
                    }
                  }}
                  className="w-full"
                  placeholder="Choose a Google Docs base resume"
                  disabled={loadingGoogleDrive || !googleDriveRequirementsMet}
              />
                    <Button
                        type="button"
                        label="Generate Resume"
                      icon="pi pi-copy"
                      onClick={handleCreateGoogleDriveResume}
                      loading={copyingGoogleDriveResume}
                       disabled={loadingGoogleDrive || !googleDriveRequirementsMet || !selectedBaseResumeId}
                   />
                  {cvCopyMode === 'template' && !templateModeEnabled && (
                    <small className="block text-amber-600 dark:text-amber-400">
                      Template mode is only available for template-enabled CVs.
                    </small>
                  )}
            </div>

            {latestResumeCopy && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                    {latestResumeCopy.copiedFileName}
                  </p>
                  {latestResumeCopy.generatedAt && (
                    <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                      Generated at {formatGoogleDriveDateTime(latestResumeCopy.generatedAt)}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                        type="button"
                        label="Open Google Doc"
                        icon="pi pi-external-link"
                        onClick={() => openExternalUrl(latestResumeCopy.googleDocUrl)}
                    />
                    {latestResumeCopy.pdfUrl && (
                      <Button
                          type="button"
                          label="Open PDF"
                          icon="pi pi-file-pdf"
                          outlined
                          onClick={() => openExternalUrl(latestResumeCopy.pdfUrl)}
                      />
                    )}
                    {latestResumeCopy.vacancyFolderUrl && (
                      <Button
                          type="button"
                          label="Open Vacancy Folder"
                          icon="pi pi-folder-open"
                          outlined
                          onClick={() => openExternalUrl(latestResumeCopy.vacancyFolderUrl)}
                      />
                    )}
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
