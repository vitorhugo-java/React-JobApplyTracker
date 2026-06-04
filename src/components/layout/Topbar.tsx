import { CollapseIcon, SearchIcon } from '@/components/ui/icons'

interface TopbarProps {
  root: string
  leaf: string
  onToggleSidebar: () => void
}

export function Topbar({ root, leaf, onToggleSidebar }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3.5 border-b border-mono-e5 bg-mono-w px-5">
      <button
        type="button"
        onClick={onToggleSidebar}
        title="Toggle sidebar"
        aria-label="Toggle sidebar"
        className="grid h-[30px] w-[30px] place-items-center rounded border border-mono-e5 bg-mono-w text-mono-5 hover:bg-mono-f5 hover:text-mono-1"
      >
        <CollapseIcon />
      </button>

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-mono-9">
        <span>{root}</span>
        <span>/</span>
        <b className="font-semibold text-mono-1">{leaf}</b>
      </nav>

      <div className="ml-auto flex items-center gap-2.5">
        <label className="flex w-[210px] items-center gap-2 rounded border border-mono-e5 px-2.5 py-1.5 text-[13px] text-mono-9">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search…"
            className="w-full border-0 bg-transparent text-[13px] text-mono-1 outline-none placeholder:text-mono-9"
          />
          <span className="rounded border border-mono-e5 border-b-2 bg-[#fcfcfc] px-1.5 py-px font-mono text-[11px] text-mono-5">
            ⌘K
          </span>
        </label>
      </div>
    </header>
  )
}
