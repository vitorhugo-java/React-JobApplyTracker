import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { FloatLabel } from 'primereact/floatlabel'
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { InputSwitch } from 'primereact/inputswitch'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'

import {
  getApplication,
  createApplication,
  updateApplication,
  markDmSent,
  APPLICATION_STATUSES,
} from '../../api/applications'
import { GAMIFICATION_EVENT_TYPES } from '../../api/gamification'
import { usePageTitle } from '../../hooks/usePageTitle'
import useGamificationStore from '../../store/gamificationStore'

const defaultForm = {
  vacancyName: '',
  recruiterName: '',
  organization: '',
  vacancyLink: '',
  applicationDate: null,
  rhAcceptedConnection: false,
  interviewScheduled: false,
  nextStepDateTime: null,
  status: APPLICATION_STATUSES[0],
  recruiterDmReminderEnabled: true,
  markDmSent: false,
  toSendLater: false,
  note: '',
}

const getDraftKey = (id) => `jobtracker:application-form-draft:${id || 'new'}`

const toStoragePayload = (form) => ({
  ...form,
  applicationDate: form.applicationDate ? form.applicationDate.toISOString() : null,
  nextStepDateTime: form.nextStepDateTime ? form.nextStepDateTime.toISOString() : null,
})

const fromStoragePayload = (raw) => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return {
      ...defaultForm,
      ...parsed,
      applicationDate: parsed.applicationDate ? new Date(parsed.applicationDate) : null,
      nextStepDateTime: parsed.nextStepDateTime ? new Date(parsed.nextStepDateTime) : null,
    }
  } catch {
    return null
  }
}

const pad2 = (value) => String(value).padStart(2, '0')

const parseDateOnlyAsLocalDate = (dateString) => {
  if (!dateString) return null
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const formatDateOnly = (date) => {
  if (!date) return null
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

const formatLocalDateTime = (date) => {
  if (!date) return null
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

const ApplicationForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useRef(null)
  const isEdit = Boolean(id)

  usePageTitle(isEdit ? 'Editar Aplicação' : 'Nova Aplicação')

  const [form, setForm] = useState(() => (
    isEdit
      ? defaultForm
      : {
          ...defaultForm,
          applicationDate: new Date(),
        }
  ))
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [draftReady, setDraftReady] = useState(false)
  const draftRef = useRef(null)
  const initialFormRef = useRef(null)
  const draftKey = getDraftKey(id)
  const recordEvent = useGamificationStore((s) => s.recordEvent)

  useEffect(() => {
    if (typeof window === 'undefined') return
    draftRef.current = fromStoragePayload(window.localStorage.getItem(draftKey))

    if (!isEdit && draftRef.current) {
      setForm(draftRef.current)
      toast.current?.show({ severity: 'info', summary: 'Draft restored', detail: 'Unsaved form data was restored.' })
    }
    setDraftReady(true)
  }, [draftKey, isEdit])

  useEffect(() => {
    if (!isEdit) return
    const fetchApp = async () => {
      try {
        const res = await getApplication(id)
        const d = res.data
        setForm({
          ...defaultForm,
          ...d,
          vacancyName: d.vacancyName ?? '',
          recruiterName: d.recruiterName ?? '',
          organization: d.organization ?? '',
          vacancyLink: d.vacancyLink ?? '',
          applicationDate: d.status == null ? null : parseDateOnlyAsLocalDate(d.applicationDate),
          nextStepDateTime: d.nextStepDateTime ? new Date(d.nextStepDateTime) : null,
          toSendLater: d.status == null,
          status: d.status ?? APPLICATION_STATUSES[0],
          note: d.note ?? '',
        })
        if (draftRef.current) {
          setForm((serverData) => ({ ...serverData, ...draftRef.current }))
          toast.current?.show({ severity: 'info', summary: 'Draft restored', detail: 'Local unsaved changes were restored.' })
        }
      } catch (err) {
        const detail = err.response?.data?.message || 'Unable to load the application. Please try refreshing the page.'
        toast.current?.show({ severity: 'error', summary: 'Error', detail })
      } finally {
        setFetching(false)
      }
    }
    fetchApp()
  }, [id, isEdit])

  // Set initial form state after all data is loaded or draft is restored
  useEffect(() => {
    if (!draftReady) return // Wait for draft to be checked
    if (isEdit && fetching) return // For edit forms, wait for server data
    if (!initialFormRef.current) {
      initialFormRef.current = { ...form }
    }
  }, [draftReady, isEdit, fetching, form])

  useEffect(() => {
    if (!draftReady || fetching || typeof window === 'undefined') return
    window.localStorage.setItem(draftKey, JSON.stringify(toStoragePayload(form)))
  }, [draftKey, draftReady, fetching, form])

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  // Helper function to compare dates handling null values
  const areDatesEqual = (date1, date2) => {
    if (!date1 && !date2) return true
    if (!date1 || !date2) return false
    return date1.getTime() === date2.getTime()
  }

  // Check if form is dirty (has unsaved changes)
  const isFormDirty = () => {
    if (!initialFormRef.current) return false

    const initial = initialFormRef.current
    return (
      form.vacancyName !== initial.vacancyName ||
      form.recruiterName !== initial.recruiterName ||
      form.organization !== initial.organization ||
      form.vacancyLink !== initial.vacancyLink ||
      form.note !== initial.note ||
      form.rhAcceptedConnection !== initial.rhAcceptedConnection ||
      form.interviewScheduled !== initial.interviewScheduled ||
      form.recruiterDmReminderEnabled !== initial.recruiterDmReminderEnabled ||
      form.markDmSent !== initial.markDmSent ||
      form.toSendLater !== initial.toSendLater ||
      form.status !== initial.status ||
      !areDatesEqual(form.applicationDate, initial.applicationDate) ||
      !areDatesEqual(form.nextStepDateTime, initial.nextStepDateTime)
    )
  }

  const handleCancel = () => {
    if (isFormDirty()) {
      confirmDialog({
        message: 'You have unsaved changes. Are you sure you want to discard them?',
        header: 'Discard Changes',
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        accept: () => {
          window.localStorage.removeItem(draftKey)
          navigate(isEdit ? `/applications/${id}` : '/applications')
        },
        reject: () => {
          // User cancelled, stay on form
        },
      })
    } else {
      navigate(isEdit ? `/applications/${id}` : '/applications')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validation: require applicationDate when not sending later
    if (!form.toSendLater && !form.applicationDate) {
      toast.current?.show({ severity: 'error', summary: 'Validation', detail: 'Application date is required unless "To send later" is enabled.' })
      setLoading(false)
      return
    }

    try {
      const previousForm = initialFormRef.current
      const payload = {
        ...form,
        vacancyName: form.vacancyName.trim() || null,
        applicationDate: form.toSendLater ? null : formatDateOnly(form.applicationDate),
        nextStepDateTime: formatLocalDateTime(form.nextStepDateTime),
        status: form.toSendLater ? null : form.status,
        note: form.note?.trim() || null,
      }
      // Remove markDmSent from payload as it's not a backend field
      delete payload.markDmSent
      
      if (isEdit) {
        const response = await updateApplication(id, payload)
        window.localStorage.removeItem(draftKey)
        
        // If markDmSent is true, call the API
        if (form.markDmSent) {
          try {
            await markDmSent(id)
            await recordEvent(GAMIFICATION_EVENT_TYPES.RECRUITER_DM_SENT, {
              applicationId: id,
            })
          } catch (err) {
            const detail = err.response?.data?.message || 'Added the application, but could not mark the DM as sent. You can do this later.'
            toast.current.show({ severity: 'error', summary: 'Partial Success', detail })
          }
        }

        if (!previousForm?.note && payload.note) {
          try {
            await recordEvent(GAMIFICATION_EVENT_TYPES.NOTE_ADDED, {
              applicationId: id,
            })
          } catch (err) {
            const detail = err.response?.data?.message || 'Application saved, but the XP event for note tracking could not be recorded.'
            toast.current.show({ severity: 'warn', summary: 'Gamification pending', detail })
          }
        }

        if (!previousForm?.interviewScheduled && payload.interviewScheduled) {
          try {
            await recordEvent(GAMIFICATION_EVENT_TYPES.INTERVIEW_PROGRESS, {
              applicationId: id,
            })
          } catch (err) {
            const detail = err.response?.data?.message || 'Application saved, but the XP event for interview progress could not be recorded.'
            toast.current.show({ severity: 'warn', summary: 'Gamification pending', detail })
          }
        }
        
        if (response.data?.queuedOffline) {
          toast.current.show({
            severity: 'info',
            summary: 'Saved offline',
            detail: 'No internet. Changes were queued and will sync automatically when online.',
          })
        }
        navigate(`/applications/${id}`)
      } else {
        const response = await createApplication(payload)
        window.localStorage.removeItem(draftKey)
        try {
          await recordEvent(GAMIFICATION_EVENT_TYPES.APPLICATION_CREATED, {
            applicationId: response.data?.id,
          })
        } catch (eventError) {
          const detail = eventError.response?.data?.message || 'Application saved, but the XP event could not be recorded.'
          toast.current.show({ severity: 'warn', summary: 'Gamification pending', detail })
        }

        if (payload.note) {
          try {
            await recordEvent(GAMIFICATION_EVENT_TYPES.NOTE_ADDED, {
              applicationId: response.data?.id,
            })
          } catch (eventError) {
            const detail = eventError.response?.data?.message || 'Application saved, but the XP event for note tracking could not be recorded.'
            toast.current.show({ severity: 'warn', summary: 'Gamification pending', detail })
          }
        }

        if (payload.interviewScheduled) {
          try {
            await recordEvent(GAMIFICATION_EVENT_TYPES.INTERVIEW_PROGRESS, {
              applicationId: response.data?.id,
            })
          } catch (eventError) {
            const detail = eventError.response?.data?.message || 'Application saved, but the XP event for interview progress could not be recorded.'
            toast.current.show({ severity: 'warn', summary: 'Gamification pending', detail })
          }
        }

        if (response.data?.queuedOffline) {
          toast.current.show({
            severity: 'info',
            summary: 'Saved offline',
            detail: 'No internet. Creation was queued and will sync automatically when online.',
          })
        }
        navigate('/applications')
      }
    } catch (err) {
      const detail = err.response?.data?.message || 'Could not save the application. Please check your information and try again.'
      toast.current.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = APPLICATION_STATUSES.map((s) => ({ label: s, value: s }))

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="pi pi-spin pi-spinner text-indigo-600" style={{ fontSize: '2rem' }} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Application' : 'New Application'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {isEdit ? 'Update the application details' : 'Add a new job application'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 pt-2">
            <FloatLabel className="w-full">
              <InputText inputId="vacancyName" value={form.vacancyName} onChange={(e) => setField('vacancyName', e.target.value)} maxLength={255} className="w-full" data-testid="app-vacancy-name" />
              <label htmlFor="vacancyName">Vacancy Name</label>
            </FloatLabel>
          </div>

          <div className="pt-2">
            <FloatLabel className="w-full">
              <InputText inputId="recruiterName" value={form.recruiterName} onChange={(e) => setField('recruiterName', e.target.value)} maxLength={255} className="w-full" data-testid="app-recruiter-name" />
              <label htmlFor="recruiterName">Recruiter Name</label>
            </FloatLabel>
          </div>

          <div className="pt-2">
            <FloatLabel className="w-full">
              <InputText inputId="organization" value={form.organization} onChange={(e) => setField('organization', e.target.value)} maxLength={255} className="w-full" data-testid="app-organization" />
              <label htmlFor="organization">Organization</label>
            </FloatLabel>
          </div>

          <div className="sm:col-span-2 pt-2">
            <FloatLabel className="w-full">
              <InputText inputId="vacancyLink" value={form.vacancyLink} onChange={(e) => setField('vacancyLink', e.target.value)} maxLength={2048} className="w-full" type="url" data-testid="app-vacancy-link" />
              <label htmlFor="vacancyLink">Vacancy Link</label>
            </FloatLabel>
          </div>

          <div className="pt-2">
            <FloatLabel className="w-full">
              <Calendar inputId="applicationDate" value={form.applicationDate} onChange={(e) => setField('applicationDate', e.value)} className="w-full" dateFormat="dd/mm/yy" pt={{ input: { 'data-testid': 'app-application-date' } }} />
              <label htmlFor="applicationDate">Application Date</label>
            </FloatLabel>
          </div>

          <div className="pt-2">
            <FloatLabel className="w-full">
              <Calendar inputId="nextStepDateTime" value={form.nextStepDateTime} onChange={(e) => setField('nextStepDateTime', e.value)} className="w-full" showTime dateFormat="dd/mm/yy" />
              <label htmlFor="nextStepDateTime">Next Step Date &amp; Time</label>
            </FloatLabel>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:col-span-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-white">To send later</label>
              <p className="text-xs text-gray-400 dark:text-gray-300">Marks this application as pending and keeps status empty</p>
            </div>
            <InputSwitch
              checked={form.toSendLater}
              onChange={(e) => {
                setField('toSendLater', e.value)
                if (e.value) {
                  setField('applicationDate', null)
                } else if (!form.applicationDate) {
                  setField('applicationDate', new Date())
                }
              }}
              data-testid="app-to-send-later"
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <FloatLabel className="w-full">
              <Dropdown inputId="status" value={form.status} options={statusOptions} onChange={(e) => setField('status', e.value)} className="w-full" disabled={form.toSendLater} pt={{ root: { 'data-testid': 'app-status' } }} />
              <label htmlFor="status">Status</label>
            </FloatLabel>
          </div>

          <div className="sm:col-span-2 pt-2">
            <FloatLabel className="w-full">
              <InputTextarea
                inputId="note"
                value={form.note}
                onChange={(e) => setField('note', e.target.value)}
                rows={4}
                maxLength={5000}
                className="w-full"
                autoResize
                data-testid="app-note"
              />
              <label htmlFor="note">Note</label>
            </FloatLabel>
            <div className="flex justify-between items-center mt-2 px-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Character count: <span className={form.note.length >= 4500 ? 'text-orange-600 dark:text-orange-400 font-semibold' : ''}>{form.note.length}</span> / 5000
              </p>
              {form.note.length >= 4500 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">⚠️ Approaching limit</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">RH Accepted Connection</label>
            <InputSwitch checked={form.rhAcceptedConnection} onChange={(e) => setField('rhAcceptedConnection', e.value)} />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Interview Scheduled</label>
            <InputSwitch checked={form.interviewScheduled} onChange={(e) => setField('interviewScheduled', e.value)} />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-white">Recruiter DM Reminder</label>
              <p className="text-xs text-gray-400 dark:text-gray-500">Enable reminder to send DM</p>
            </div>
            <InputSwitch checked={form.recruiterDmReminderEnabled} onChange={(e) => setField('recruiterDmReminderEnabled', e.value)} />
          </div>

          {isEdit && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-white">Mark to DM Sent</label>
                <p className="text-xs text-gray-400 dark:text-gray-500">Mark this DM as sent to recruiter</p>
              </div>
              <InputSwitch checked={form.markDmSent} onChange={(e) => setField('markDmSent', e.value)} />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" label={isEdit ? 'Save Changes' : 'Create Application'} loading={loading} data-testid="app-submit" />
          <Button type="button" label="Cancel" outlined onClick={handleCancel} />
        </div>
      </form>
    </div>
  )
}

export default ApplicationForm
