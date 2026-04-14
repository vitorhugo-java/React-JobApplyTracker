import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { InputSwitch } from 'primereact/inputswitch'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import {
  getApplication,
  createApplication,
  updateApplication,
  APPLICATION_STATUSES,
} from '../../api/applications'

const defaultForm = {
  vacancyName: '',
  recruiterName: '',
  vacancyOpenedBy: '',
  vacancyLink: '',
  applicationDate: null,
  rhAcceptedConnection: false,
  interviewScheduled: false,
  nextStepDateTime: null,
  status: APPLICATION_STATUSES[0],
  recruiterDmReminderEnabled: false,
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

  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    const fetchApp = async () => {
      try {
        const res = await getApplication(id)
        const d = res.data
        setForm({
          ...d,
          applicationDate: d.applicationDate ? new Date(d.applicationDate) : null,
          nextStepDateTime: d.nextStepDateTime ? new Date(d.nextStepDateTime) : null,
        })
      } catch (_) {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load application.' })
      } finally {
        setFetching(false)
      }
    }
    fetchApp()
  }, [id, isEdit])

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.vacancyName.trim()) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Vacancy name is required.' })
      return
    }
    if (!form.applicationDate) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Application date is required.' })
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        applicationDate: form.applicationDate?.toISOString(),
        nextStepDateTime: form.nextStepDateTime?.toISOString() || null,
      }
      if (isEdit) {
        await updateApplication(id, payload)
        navigate(`/applications/${id}`)
      } else {
        await createApplication(payload)
        navigate('/applications')
      }
    } catch (err) {
      const detail = err.response?.data?.message || 'Failed to save application.'
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
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vacancy Name *</label>
            <InputText value={form.vacancyName} onChange={(e) => setField('vacancyName', e.target.value)} className="w-full" placeholder="e.g. Frontend Engineer" data-testid="app-vacancy-name" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Recruiter Name</label>
            <InputText value={form.recruiterName} onChange={(e) => setField('recruiterName', e.target.value)} className="w-full" placeholder="Jane Smith" data-testid="app-recruiter-name" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vacancy Opened By</label>
            <InputText value={form.vacancyOpenedBy} onChange={(e) => setField('vacancyOpenedBy', e.target.value)} className="w-full" placeholder="Company name or recruiter" />
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vacancy Link</label>
            <InputText value={form.vacancyLink} onChange={(e) => setField('vacancyLink', e.target.value)} className="w-full" placeholder="https://..." type="url" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Application Date *</label>
            <Calendar value={form.applicationDate} onChange={(e) => setField('applicationDate', e.value)} className="w-full" dateFormat="mm/dd/yy" placeholder="Select date" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Next Step Date &amp; Time</label>
            <Calendar value={form.nextStepDateTime} onChange={(e) => setField('nextStepDateTime', e.value)} className="w-full" showTime dateFormat="mm/dd/yy" placeholder="Select date &amp; time" />
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <Dropdown value={form.status} options={statusOptions} onChange={(e) => setField('status', e.value)} className="w-full" pt={{ root: { 'data-testid': 'app-status' } }} />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">RH Accepted Connection</label>
            <InputSwitch checked={form.rhAcceptedConnection} onChange={(e) => setField('rhAcceptedConnection', e.value)} />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Interview Scheduled</label>
            <InputSwitch checked={form.interviewScheduled} onChange={(e) => setField('interviewScheduled', e.value)} />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:col-span-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Recruiter DM Reminder</label>
              <p className="text-xs text-gray-400 dark:text-gray-500">Enable reminder to send DM to recruiter</p>
            </div>
            <InputSwitch checked={form.recruiterDmReminderEnabled} onChange={(e) => setField('recruiterDmReminderEnabled', e.value)} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" label={isEdit ? 'Save Changes' : 'Create Application'} loading={loading} data-testid="app-submit" />
          <Button type="button" label="Cancel" outlined onClick={() => navigate(isEdit ? `/applications/${id}` : '/applications')} />
        </div>
      </form>
    </div>
  )
}

export default ApplicationForm
