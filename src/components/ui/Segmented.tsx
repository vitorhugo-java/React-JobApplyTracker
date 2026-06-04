import { cn } from '@/lib/utils'

export interface SegOption<T extends string> {
  value: T
  label: string
}

interface SegmentedProps<T extends string> {
  options: SegOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label'?: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex overflow-hidden rounded border border-mono-e5 bg-mono-w"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'border-r border-mono-e5 px-[13px] py-1.5 text-[12.5px] transition-colors last:border-r-0',
              active ? 'bg-mono-0 text-white' : 'bg-mono-w text-mono-5 hover:bg-mono-f5 hover:text-mono-1',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
