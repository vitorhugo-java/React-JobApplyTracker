import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PanelProps {
  className?: string
  children: ReactNode
}

export function Panel({ className, children }: PanelProps) {
  return <section className={cn('panel', className)}>{children}</section>
}

interface PanelHeadProps {
  title: ReactNode
  count?: ReactNode
  right?: ReactNode
}

export function PanelHead({ title, count, right }: PanelHeadProps) {
  return (
    <div className="flex items-center gap-2.5 border-b border-mono-e5 px-4 py-[13px]">
      <h3 className="text-[13.5px] font-semibold">{title}</h3>
      {count != null && <span className="font-mono text-[11px] text-mono-9">{count}</span>}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  )
}
