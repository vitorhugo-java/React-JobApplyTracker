import { cn } from '@/lib/utils'

interface PagerProps {
  page: number // 0-based
  totalPages: number
  totalElements: number
  pageSize: number
  onChange: (page: number) => void
}

export function Pager({ page, totalPages, totalElements, pageSize, onChange }: PagerProps) {
  if (totalElements === 0) return null
  const from = page * pageSize + 1
  const to = Math.min(totalElements, (page + 1) * pageSize)

  const pages = Array.from({ length: totalPages }, (_, i) => i).filter((p) => {
    return p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1
  })

  return (
    <div className="flex items-center gap-2 border-t border-mono-e5 px-3.5 py-[11px] text-[12.5px] text-mono-9">
      <span>
        Showing {from}–{to} of {totalElements}
      </span>
      <div className="ml-auto flex gap-1">
        <PageBtn disabled={page === 0} onClick={() => onChange(page - 1)}>
          ‹
        </PageBtn>
        {pages.map((p, i) => {
          const prev = pages[i - 1]
          const gap = prev != null && p - prev > 1
          return (
            <span key={p} className="flex gap-1">
              {gap && <span className="px-1 text-mono-c">…</span>}
              <PageBtn active={p === page} onClick={() => onChange(p)}>
                {p + 1}
              </PageBtn>
            </span>
          )
        })}
        <PageBtn disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
          ›
        </PageBtn>
      </div>
    </div>
  )
}

function PageBtn({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid h-[26px] min-w-[26px] place-items-center rounded border px-1.5 font-mono text-[12px]',
        active
          ? 'border-mono-0 bg-mono-0 text-white'
          : 'border-mono-e5 bg-mono-w text-mono-5 hover:bg-mono-f5',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-mono-w',
      )}
    >
      {children}
    </button>
  )
}
