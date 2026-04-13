import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { Paginator } from 'primereact/paginator'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { getApplications, deleteApplication, APPLICATION_STATUSES } from '../../api/applications'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'

const ApplicationsList = () => {
  const navigate = useNavigate()
  const toast = useRef(null)

  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [filters, setFilters] = useState({ status: null, recruiterName: '', startDate: null, endDate: null })

  const fetchApps = async () => {
    setLoading(true)
    try {
      const params = { page, size }
      if (filters.status) params.status = filters.status
      if (filters.recruiterName) params.recruiterName = filters.recruiterName
      if (filters.startDate) params.startDate = filters.startDate.toISOString()
      if (filters.endDate) params.endDate = filters.endDate.toISOString()
      const res = await getApplications(params)
      const data = res.data
      setApps(Array.isArray(data) ? data : data.content || data.items || [])
      setTotal(data.total || data.totalElements || (Array.isArray(data) ? data.length : 0))
    } catch (_) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load applications.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchApps() }, [page, filters])

  const handleDelete = (id) => {
    confirmDialog({
      message: 'Are you sure you want to delete this application?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await deleteApplication(id)
          toast.current.show({ severity: 'success', summary: 'Deleted', detail: 'Application deleted.' })
          fetchApps()
        } catch (_) {
          toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete.' })
        }
      },
    })
  }

  const statusOptions = [{ label: 'All Statuses', value: null }, ...APPLICATION_STATUSES.map((s) => ({ label: s, value: s }))]

  return (
    <div className="space-y-4">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{total} total applications</p>
        </div>
        <Button
          label="New Application"
          icon="pi pi-plus"
          onClick={() => navigate('/applications/new')}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Dropdown
            value={filters.status}
            options={statusOptions}
            onChange={(e) => setFilters({ ...filters, status: e.value })}
            placeholder="Filter by status"
            className="w-full"
          />
          <InputText
            value={filters.recruiterName}
            onChange={(e) => setFilters({ ...filters, recruiterName: e.target.value })}
            placeholder="Search recruiter..."
            className="w-full"
          />
          <Calendar
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.value })}
            placeholder="Start date"
            className="w-full"
            dateFormat="mm/dd/yy"
          />
          <Calendar
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.value })}
            placeholder="End date"
            className="w-full"
            dateFormat="mm/dd/yy"
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  {['Vacancy', 'Recruiter', 'Status', 'Applied', 'Next Step', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {apps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                    onClick={() => navigate(`/applications/${app.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{app.vacancyName}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{app.recruiterName || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {app.nextStepDateTime ? new Date(app.nextStepDateTime).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/applications/${app.id}`)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/applications/${app.id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
