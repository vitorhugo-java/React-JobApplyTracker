import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { Paginator } from 'primereact/paginator'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { Edit, Trash2, Check, X, Archive, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { getApplications, getApplication, updateApplication, deleteApplication, archiveApplication, APPLICATION_STATUSES, TO_SEND_LATER_STATUS } from '../../api/applications'
import StatusBadge from '../../components/ui/StatusBadge'
import JobApplicationCard from '../../components/ui/JobApplicationCard'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { getVacancyLabel } from '../../utils/applicationDisplay'
import { usePageTitle } from '../../hooks/usePageTitle'

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'createdAt,desc' },
  { label: 'Oldest first', value: 'createdAt,asc' },
  { label: 'Vacancy A-Z', value: 'vacancyName,asc' },
  { label: 'Vacancy Z-A', value: 'vacancyName,desc' },
  { label: 'Recruiter A-Z', value: 'recruiterName,asc' },
  { label: 'Recruiter Z-A', value: 'recruiterName,desc' },
  { label: 'Applied date newest', value: 'applicationDate,desc' },
  { label: 'Applied date oldest', value: 'applicationDate,asc' },
  { label: 'Next step soonest', value: 'nextStepDateTime,asc' },
  { label: 'Next step latest', value: 'nextStepDateTime,desc' },
]

const SORTABLE_COLUMNS = {
  Vacancy: 'vacancyName',
  Recruiter: 'recruiterName',
  Status: 'status',
  Applied: 'applicationDate',
  'Next Step': 'nextStepDateTime',
}

const ApplicationsList = () => {
  usePageTitle('Aplicações')
  const navigate = useNavigate()
  const toast = useRef(null)

  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [filters, setFilters] = useState({ status: null, recruiterName: '', startDate: null, endDate: null })
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [activeTab, setActiveTab] = useState('active')
  const [sort, setSort] = useState('createdAt,desc')

  const fetchApps = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, size, sort }
      params.archived = activeTab === 'archived'
      if (filters.status) params.status = filters.status
      if (filters.recruiterName) params.recruiterName = filters.recruiterName
      if (filters.startDate) params.applicationDateFrom = filters.startDate.toISOString().slice(0, 10)
      if (filters.endDate) params.applicationDateTo = filters.endDate.toISOString().slice(0, 10)
      const res = await getApplications(params)
      const data = res.data
      setApps(Array.isArray(data) ? data : data.content || data.items || [])
      setTotal(data.total || data.totalElements || (Array.isArray(data) ? data.length : 0))
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load applications.' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, filters, page, size, sort])

  useEffect(() => { fetchApps() }, [fetchApps])

  const startInlineEdit = async (app) => {
    try {
      const res = await getApplication(app.id)
      const full = res.data
      setEditDraft({
        ...full,
        vacancyName: full.vacancyName ?? '',
        recruiterName: full.recruiterName ?? '',
        status: full.status ?? TO_SEND_LATER_STATUS,
      })
      setEditingId(app.id)
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load application for editing.' })
    }
  }

  const cancelInlineEdit = () => {
    setEditingId(null)
    setEditDraft(null)
  }

  const saveInlineEdit = async () => {
    if (!editingId || !editDraft) return

    setSavingId(editingId)
    try {
      const payload = {
        ...editDraft,
        vacancyName: editDraft.vacancyName?.trim() || null,
        status: editDraft.status === TO_SEND_LATER_STATUS ? null : editDraft.status,
      }

      await updateApplication(editingId, payload)
      setApps((prev) => prev.map((app) => (app.id === editingId ? { ...app, ...payload } : app)))
      toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Application updated.' })
      cancelInlineEdit()
    } catch (err) {
      const detail = err.response?.data?.message || 'Failed to save application.'
      toast.current?.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setSavingId(null)
    }
  }

  const handleArchive = (id) => {
    confirmDialog({
      message: 'Are you sure you want to archive this application?',
      header: 'Confirm Archive',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await archiveApplication(id)
          toast.current.show({ severity: 'success', summary: 'Archived', detail: 'Application archived.' })
          fetchApps()
        } catch {
          toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to archive.' })
        }
      },
    })
  }

  const handleDelete = (id) => {
    confirmDialog({
      message: 'Are you sure you want to permanently delete this archived application?',
      header: 'Confirm Permanent Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await deleteApplication(id)
          toast.current.show({ severity: 'success', summary: 'Deleted', detail: 'Application deleted permanently.' })
          fetchApps()
        } catch {
          toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete permanently.' })
        }
      },
    })
  }

  const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'To send later', value: TO_SEND_LATER_STATUS },
    ...APPLICATION_STATUSES.map((s) => ({ label: s, value: s })),
  ]
  const editStatusOptions = [
    { label: 'To send later', value: TO_SEND_LATER_STATUS },
    ...APPLICATION_STATUSES.map((s) => ({ label: s, value: s })),
  ]
  const actionButtonBaseClass = 'inline-flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent text-gray-400 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:hover:bg-gray-700'

  const [sortField, sortDirection] = sort.split(',')

  const updateFilters = (changes) => {
    setPage(0)
    setFilters((current) => ({ ...current, ...changes }))
  }

  const handleSortByColumn = (columnLabel) => {
    const field = SORTABLE_COLUMNS[columnLabel]
    if (!field) return

    const nextDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSort(`${field},${nextDirection}`)
    setPage(0)
  }

  const renderSortIcon = (columnLabel) => {
    const field = SORTABLE_COLUMNS[columnLabel]
    if (!field) return null

    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5" />
    if (sortDirection === 'asc') return <ChevronUp className="w-3.5 h-3.5" />
    return <ChevronDown className="w-3.5 h-3.5" />
  }

  return (
    <div className="space-y-4">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{total} {activeTab === 'archived' ? 'archived' : 'active'} applications</p>
        </div>
        <Button
          label="New Application"
          icon="pi pi-plus"
          onClick={() => navigate('/applications/new')}
          className="self-start sm:self-auto"
          data-testid="new-application-btn"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          label="Ativas"
          severity={activeTab === 'active' ? undefined : 'secondary'}
          outlined={activeTab !== 'active'}
          onClick={() => {
            setActiveTab('active')
            setPage(0)
          }}
          data-testid="applications-tab-active"
        />
        <Button
          type="button"
          label="Arquivadas"
          severity={activeTab === 'archived' ? undefined : 'secondary'}
          outlined={activeTab !== 'archived'}
          onClick={() => {
            setActiveTab('archived')
            setPage(0)
          }}
          data-testid="applications-tab-archived"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <Dropdown
            value={filters.status}
            options={statusOptions}
            onChange={(e) => updateFilters({ status: e.value })}
            placeholder="Filter by status"
            className="w-full"
            pt={{ root: { 'data-testid': 'filter-status' } }}
          />
          <InputText
            value={filters.recruiterName}
            onChange={(e) => updateFilters({ recruiterName: e.target.value })}
            placeholder="Search recruiter..."
            className="w-full"
            data-testid="filter-recruiter"
          />
          <Calendar
            value={filters.startDate}
            onChange={(e) => updateFilters({ startDate: e.value })}
            placeholder="Start date"
            className="w-full"
            dateFormat="dd/mm/yy"
          />
          <Calendar
            value={filters.endDate}
            onChange={(e) => updateFilters({ endDate: e.value })}
            placeholder="End date"
            className="w-full"
            dateFormat="dd/mm/yy"
          />
          <Dropdown
            value={sort}
            options={SORT_OPTIONS}
            onChange={(e) => {
              setSort(e.value)
              setPage(0)
            }}
            placeholder="Order by"
            className="w-full"
            pt={{ root: { 'data-testid': 'applications-sort' } }}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : apps.length === 0 ? (
        <EmptyState
          title="No applications found"
          description="Start by adding your first job application."
          action={<Button label="New Application" onClick={() => navigate('/applications/new')} />}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="md:hidden">
            {apps.map((app) => (
              <JobApplicationCard
                key={app.id}
                app={app}
                editingId={editingId}
                editDraft={editDraft}
                savingId={savingId}
                editStatusOptions={editStatusOptions}
                onView={() => navigate(`/applications/${app.id}`)}
                onStartEdit={() => startInlineEdit(app)}
                onSaveEdit={saveInlineEdit}
                onCancelEdit={cancelInlineEdit}
                onArchive={() => handleArchive(app.id)}
                onDelete={() => handleDelete(app.id)}
                onEditDraftChange={(changes) => setEditDraft((prev) => ({ ...prev, ...changes }))}
                showDelete={activeTab === 'archived'}
              />
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['Vacancy', 'Recruiter', 'Status', 'Applied', 'Next Step', 'Note', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {SORTABLE_COLUMNS[h] ? (
                        <button
                          type="button"
                          onClick={() => handleSortByColumn(h)}
                          className="inline-flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                          aria-label={`Sort by ${h}`}
                        >
                          <span>{h}</span>
                          {renderSortIcon(h)}
                        </button>
                      ) : (
                        h
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {apps.map((app) => (
                  <tr
                    key={app.id}
                    data-testid="app-row"
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${editingId === app.id ? 'cursor-default' : 'cursor-pointer'}`}
                    onClick={() => {
                      if (editingId !== app.id) navigate(`/applications/${app.id}`)
                    }}
                  >
                    <td className="px-4 py-3">
                      {editingId === app.id ? (
                        <InputText
                          value={editDraft?.vacancyName ?? ''}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, vacancyName: e.target.value }))}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                          data-testid="inline-edit-vacancy"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{getVacancyLabel(app.vacancyName)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {editingId === app.id ? (
                        <InputText
                          value={editDraft?.recruiterName ?? ''}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, recruiterName: e.target.value }))}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                          data-testid="inline-edit-recruiter"
                        />
                      ) : (app.recruiterName || '-')}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === app.id ? (
                        <Dropdown
                          value={editDraft?.status ?? TO_SEND_LATER_STATUS}
                          options={editStatusOptions}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, status: e.value }))}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                          data-testid="inline-edit-status"
                        />
                      ) : (
                        <StatusBadge status={app.status || TO_SEND_LATER_STATUS} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {app.applicationDate ? new Date(app.applicationDate).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {app.nextStepDateTime ? new Date(app.nextStepDateTime).toLocaleString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={app.note || ''}>
                      {app.note || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap" onClick={(e) => e.stopPropagation()}>
                        {editingId === app.id ? (
                          <>
                            <button
                              type="button"
                              onClick={saveInlineEdit}
                              disabled={savingId === app.id}
                              className={`${actionButtonBaseClass} shrink-0 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50`}
                              aria-label="Save inline edit"
                              data-testid="inline-save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelInlineEdit}
                              disabled={savingId === app.id}
                              className={`${actionButtonBaseClass} shrink-0 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50`}
                              aria-label="Cancel inline edit"
                              data-testid="inline-cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startInlineEdit(app)}
                            className={`${actionButtonBaseClass} shrink-0 hover:text-indigo-600 dark:hover:text-indigo-400`}
                            aria-label="Edit application inline"
                            data-testid="inline-edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {activeTab === 'archived' ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(app.id)}
                            className={`${actionButtonBaseClass} shrink-0 hover:text-red-600 dark:hover:text-red-400`}
                            aria-label="Delete application"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleArchive(app.id)}
                            className={`${actionButtonBaseClass} shrink-0 hover:text-amber-600 dark:hover:text-amber-400`}
                            aria-label="Archive application"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > size && (
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2">
              <Paginator
                first={page * size}
                rows={size}
                totalRecords={total}
                onPageChange={(e) => setPage(e.page)}
                template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ApplicationsList
