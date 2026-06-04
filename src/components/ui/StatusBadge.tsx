import { cn } from '@/lib/utils'
import {
  familyOf,
  statusLabel,
  STATUS_FAMILY_BADGE,
  STATUS_FAMILY_DOT,
  STATUS_FAMILY_LABEL,
  type StatusFamily,
} from '@/lib/statuses'

interface StatusBadgeProps {
  status: string | null | undefined
  /** Show the family label (Sent, Interview…) instead of the raw status text. */
  useFamilyLabel?: boolean
  className?: string
}

export function StatusBadge({ status, useFamilyLabel, className }: StatusBadgeProps) {
  const family = familyOf(status)
  const label = useFamilyLabel ? STATUS_FAMILY_LABEL[family] : statusLabel(status)
  return (
    <span
      title={statusLabel(status)}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1 text-xs leading-none',
        STATUS_FAMILY_BADGE[family],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_FAMILY_DOT[family])} />
      <span className="max-w-[180px] truncate">{label}</span>
    </span>
  )
}

export function FamilyBadge({ family, className }: { family: StatusFamily; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-xs leading-none',
        STATUS_FAMILY_BADGE[family],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_FAMILY_DOT[family])} />
      {STATUS_FAMILY_LABEL[family]}
    </span>
  )
}
