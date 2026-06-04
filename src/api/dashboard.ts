import { api, unwrap } from '@/lib/api'
import type { DashboardSummary } from '@/types'

export const getDashboardSummary = () =>
  unwrap(api.get<DashboardSummary>('/dashboard/summary'))
