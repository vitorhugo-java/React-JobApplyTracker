import { useNavigate } from 'react-router-dom'
import { FamilyBadge } from '@/components/ui/StatusBadge'
import { NoteIcon } from '@/components/ui/icons'
import { formatDate } from '@/lib/format'
import { familyOf, STATUS_FAMILY_ORDER } from '@/lib/statuses'
import type { Application } from '@/types'

export function ApplicationsBoard({ items }: { items: Application[] }) {
  const navigate = useNavigate()

  return (
    <div className="grid auto-cols-[minmax(220px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
      {STATUS_FAMILY_ORDER.map((family) => {
        const cards = items.filter((a) => familyOf(a.status) === family)
        return (
          <div key={family} className="flex min-h-[200px] flex-col rounded border border-mono-e5 bg-[#fcfcfc]">
            <div className="flex items-center gap-2 border-b border-mono-e5 px-3 py-[11px]">
              <FamilyBadge family={family} />
              <span className="ml-auto font-mono text-[11px] text-mono-9">{cards.length}</span>
            </div>
            <div className="flex flex-col gap-2 p-2.5">
              {cards.length === 0 ? (
                <div className="p-2 text-center font-mono text-[11px] text-mono-c">empty</div>
              ) : (
                cards.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => navigate(`/applications/${app.id}/edit`)}
                    className="rounded border border-mono-e5 bg-mono-w p-[11px] text-left hover:border-mono-c"
                  >
                    <div className="text-[13px] font-semibold leading-tight">{app.vacancyName}</div>
                    <div className="mt-0.5 text-[11.5px] text-mono-9">
                      {[app.organization, app.recruiterName].filter(Boolean).join(' · ') || '—'}
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      {app.note && (
                        <span className="text-mono-5">
                          <NoteIcon />
                        </span>
                      )}
                      <span className="ml-auto font-mono text-[10.5px] text-mono-9">
                        {formatDate(app.applicationDate)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
