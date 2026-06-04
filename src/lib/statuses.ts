import { APPLICATION_STATUSES, TO_SEND_LATER_STATUS } from '@/types'

/**
 * The backend tracks granular Portuguese status labels. The wireframe groups
 * them into six monochrome "families" that drive badge styling, the kanban
 * board, and the conversion funnel.
 */
export type StatusFamily =
  | 'draft'
  | 'sent'
  | 'replied'
  | 'interview'
  | 'offer'
  | 'rejected'

export const STATUS_FAMILY_ORDER: StatusFamily[] = [
  'draft',
  'sent',
  'replied',
  'interview',
  'offer',
  'rejected',
]

export const STATUS_FAMILY_LABEL: Record<StatusFamily, string> = {
  draft: 'Draft',
  sent: 'Sent',
  replied: 'Replied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

/** Tailwind classes per family, mirroring the wireframe badge hierarchy. */
export const STATUS_FAMILY_BADGE: Record<StatusFamily, string> = {
  draft: 'bg-mono-f5 text-mono-5',
  sent: 'bg-mono-f5 text-mono-2',
  replied: 'bg-mono-e5 text-mono-1',
  interview: 'bg-mono-2 text-mono-w',
  offer: 'bg-mono-0 text-mono-w',
  rejected: 'bg-mono-w text-mono-9 border border-mono-e5',
}

export const STATUS_FAMILY_DOT: Record<StatusFamily, string> = {
  draft: 'bg-mono-9',
  sent: 'bg-mono-5',
  replied: 'bg-mono-1',
  interview: 'bg-mono-w',
  offer: 'bg-mono-w',
  rejected: 'border-[1.5px] border-mono-9 bg-transparent',
}

const FAMILY_BY_STATUS: Record<string, StatusFamily> = {
  [TO_SEND_LATER_STATUS]: 'draft',
  RH: 'sent',
  'Fiz a RH - Aguardando Atualização': 'replied',
  'Fiz a Hiring Manager - Aguardando Atualização': 'replied',
  'Teste Técnico': 'interview',
  'Fiz teste Técnico - aguardando atualização': 'interview',
  'RH (Negociação)': 'offer',
  Rejeitado: 'rejected',
  'Tarde demais': 'rejected',
  Ghosting: 'rejected',
}

export function familyOf(status: string | null | undefined): StatusFamily {
  if (!status) return 'draft'
  return FAMILY_BY_STATUS[status] ?? 'sent'
}

/** Human label for a raw status value (kept verbatim, draft pseudo-status aside). */
export function statusLabel(status: string | null | undefined): string {
  if (!status || status === TO_SEND_LATER_STATUS) return 'To Send Later'
  return status
}

/** Options for status <select> inputs, including the draft pseudo-status. */
export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: TO_SEND_LATER_STATUS, label: 'To Send Later (draft)' },
  ...APPLICATION_STATUSES.map((s) => ({ value: s, label: s })),
]
