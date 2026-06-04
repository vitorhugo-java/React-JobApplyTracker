/**
 * Domain types mirroring the SpringBoot-JobApplyTracker OpenAPI contract.
 * @see https://jobapply-api.hugojava.dev/v3/api-docs
 */

export interface User {
  id: string
  name: string
  email: string
  reminderTime?: string | null
  roles: string[]
  canUseGoogleIntegration: boolean
}

export interface AuthResponse {
  accessToken: string
  user: User
}

/** Canonical application status values accepted by the backend. */
export const APPLICATION_STATUSES = [
  'RH',
  'Entrevista marcada',
  'Fiz a RH - Aguardando Atualização',
  'Fiz a Hiring Manager - Aguardando Atualização',
  'Teste Técnico',
  'Fiz teste Técnico - aguardando atualização',
  'RH (Negociação)',
  'Rejeitado',
  'Tarde demais',
  'Ghosting',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

/** Pseudo-status the backend uses for drafts queued to send later. */
export const TO_SEND_LATER_STATUS = 'TO_SEND_LATER'

export interface Application {
  id: string
  vacancyName: string
  recruiterName?: string | null
  organization?: string | null
  vacancyLink?: string | null
  applicationDate?: string | null
  rhAcceptedConnection?: boolean
  interviewScheduled?: boolean
  nextStepDateTime?: string | null
  status: string
  previousStatus?: string | null
  recruiterDmReminderEnabled?: boolean
  recruiterDmSentAt?: string | null
  note?: string | null
  archived?: boolean
  archivedAt?: string | null
  driveResumeFileId?: string | null
  driveResumeFileName?: string | null
  driveResumeDocumentUrl?: string | null
  driveResumeGeneratedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ApplicationRequest {
  vacancyName: string
  recruiterName?: string
  organization?: string
  vacancyLink?: string
  applicationDate?: string | null
  interviewScheduled?: boolean
  nextStepDateTime?: string | null
  status: string
  recruiterDmReminderEnabled?: boolean
  note?: string
}

export interface ApplicationPage {
  content: Application[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}

export interface ApplicationQuery {
  status?: string
  recruiterName?: string
  applicationDateFrom?: string
  applicationDateTo?: string
  interviewScheduled?: boolean
  recruiterDmReminderEnabled?: boolean
  archived?: boolean
  page?: number
  size?: number
  sort?: string
}

export interface DashboardSummary {
  totalApplications: number
  waitingResponses: number
  interviewsScheduled: number
  interviewCount: number
  overdueFollowUps: number
  dmRemindersEnabled: number
  toSendLater: number
  rejectedCount: number
  ghostingCount: number
  averageDailyApplications: number
  averageWeeklyApplications: number
  averageMonthlyApplications: number
}

export interface GamificationProfile {
  currentXp: number
  level: number
  currentLevelXp: number
  nextLevelXp: number
  xpToNextLevel: number
  progressPercentage: number
  rankTitle: string
  streakDays: number
}

export interface Achievement {
  code: string
  name: string
  description: string
  icon?: string
  unlocked: boolean
  achievedAt?: string | null
}

export interface BaseResume {
  id: string
  name: string
  language?: string
  template?: boolean
  createdAt?: string
}

export interface LinkMetadata {
  title?: string
  description?: string
  image?: string
  domain?: string
}
