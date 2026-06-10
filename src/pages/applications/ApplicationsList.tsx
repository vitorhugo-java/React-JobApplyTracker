import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page, PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { Select } from '@/components/ui/Field'
import { Pager } from '@/components/ui/Pager'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { CenteredSpinner, EmptyState, ErrorNote } from '@/components/ui/feedback'
import { PlusIcon, SearchIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { STATUS_OPTIONS } from '@/lib/statuses'
import { useAsync } from '@/hooks/useAsync'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useIsMobile } from '@/hooks/useIsMobile'
import {
  archiveApplication,
  deleteApplication,
  getApplications,
} from '@/api/applications'
import type { Application, ApplicationQuery } from '@/types'
import { ApplicationsTable, type SortState } from '@/components/applications/ApplicationsTable'
import { ApplicationsBoard } from '@/components/applications/ApplicationsBoard'
import { ApplicationsCards } from '@/components/applications/ApplicationsCards'

type Tab = 'active' | 'archived'
type View = 'table' | 'board'

const SORT_OPTIONS = [
  { value: 'applicationDate,desc', label: 'Sort: Applied date' },
  { value: 'nextStepDateTime,asc', label: 'Sort: Next step' },
  { value: 'status,asc', label: 'Sort: Status' },
  { value: 'vacancyName,asc', label: 'Sort: Vacancy A–Z' },
]

const PAGE_SIZE = 12

export default function ApplicationsList() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [tab, setTab] = useState<Tab>('active')
  const [view, setView] = useState<View>('table')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('applicationDate,desc')
  const [page, setPage] = useState(0)
  const [pendingArchive, setPendingArchive] = useState<Application | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Application | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)

  // On mobile viewport, always render the card view regardless of desktop selection
  const effectiveView = isMobile ? 'mobile' : view

  const query: ApplicationQuery = useMemo(
    () => ({
      archived: tab === 'archived',
      recruiterName: debouncedSearch || undefined,
      status: status || undefined,
      sort,
      page,
      size: PAGE_SIZE,
    }),
    [tab, debouncedSearch, status, sort, page],
  )

  const { data, loading, error, reload } = useAsync(
    () => getApplications(query),
    [query],
    'Could not load applications.',
  )

  const sortState: SortState = useMemo(() => {
    const [key, dir] = sort.split(',')
    return { key, dir: (dir as 'asc' | 'desc') ?? 'asc' }
  }, [sort])

  const onSortColumn = (key: string) => {
    setSort((prev) => {
      const [prevKey, prevDir] = prev.split(',')
      const dir = prevKey === key && prevDir === 'asc' ? 'desc' : 'asc'
      return `${key},${dir}`
    })
    setPage(0)
  }

  const items = data?.applications ?? []

  const confirmArchive = async () => {
    if (!pendingArchive) return
    await archiveApplication(pendingArchive.id)
    setPendingArchive(null)
    reload()
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    await deleteApplication(pendingDelete.id)
    setPendingDelete(null)
    reload()
  }

  const tabCount = data?.totalElements ?? 0

  return (
    <Page>
      <PageHeader
        title="Applications"
        sub="Track every vacancy from draft to offer"
        actions={
          <Button variant="primary" onClick={() => navigate('/applications/new')}>
            <PlusIcon /> New Application
          </Button>
        }
      />

      {/* tabs */}
      <div className="mb-4 flex gap-0.5 border-b border-mono-e5">
        {(['active', 'archived'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t)
              setPage(0)
            }}
            className={cn(
              '-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13.5px] capitalize',
              tab === t
                ? 'border-mono-0 font-semibold text-mono-0'
                : 'border-transparent text-mono-9 hover:text-mono-2',
            )}
          >
            {t}
            {tab === t && (
              <span className="rounded-full bg-mono-f5 px-[7px] py-px font-mono text-[11px] text-mono-9">
                {tabCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex min-w-[180px] max-w-[360px] flex-1 items-center gap-2 rounded border border-mono-e5 px-3 py-[7px] text-mono-9">
          <SearchIcon />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            placeholder="Search recruiter…"
            className="w-full border-0 bg-transparent text-[13.5px] text-mono-1 outline-none placeholder:text-mono-9"
          />
        </label>
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(0)
          }}
          className="w-auto min-w-[140px]"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Sort applications"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value)
            setPage(0)
          }}
          className="w-auto min-w-[140px]"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {/* view toggle — only shown on desktop */}
        {!isMobile && (
          <>
            <div className="flex-1" />
            <Segmented<View>
              aria-label="View mode"
              options={[
                { value: 'table', label: 'Table' },
                { value: 'board', label: 'Board' },
              ]}
              value={view}
              onChange={setView}
            />
          </>
        )}
      </div>

      {loading && <CenteredSpinner label="Loading applications…" />}
      {error && !loading && <ErrorNote message={error} />}

      {data && !loading && !error && (
        <>
          {items.length === 0 ? (
            <EmptyState
              title={tab === 'archived' ? 'No archived applications' : 'No applications yet'}
              description={
                tab === 'archived'
                  ? 'Applications you archive will live here, keeping your active list focused without deleting history.'
                  : 'Start tracking a vacancy you are applying to.'
              }
              action={
                <Button variant="primary" onClick={() => navigate('/applications/new')}>
                  <PlusIcon /> New Application
                </Button>
              }
            />
          ) : effectiveView === 'board' ? (
            <ApplicationsBoard items={items} />
          ) : effectiveView === 'mobile' ? (
            <ApplicationsCards items={items} />
          ) : (
            <>
              <ApplicationsTable
                items={items}
                sort={sortState}
                onSort={onSortColumn}
                onEdit={(app) => navigate(`/applications/${app.id}/edit`)}
                onArchive={setPendingArchive}
                onDelete={setPendingDelete}
                archived={tab === 'archived'}
              />
              <div className="rounded-b border-x border-b border-mono-e5">
                <Pager
                  page={data.pageNumber}
                  totalPages={data.totalPages}
                  totalElements={data.totalElements}
                  pageSize={data.pageSize}
                  onChange={setPage}
                />
              </div>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!pendingArchive}
        title="Archive application?"
        message={`"${pendingArchive?.vacancyName}" will move to your archived list. You can restore it later.`}
        confirmLabel="Archive"
        onConfirm={confirmArchive}
        onCancel={() => setPendingArchive(null)}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete application?"
        message={`"${pendingDelete?.vacancyName}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Page>
  )
}
