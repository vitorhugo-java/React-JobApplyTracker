import { api, unwrap } from '@/lib/api'
import type {
  Application,
  ApplicationPage,
  ApplicationQuery,
  ApplicationRequest,
  LinkMetadata,
} from '@/types'

export const getApplications = (params?: ApplicationQuery) =>
  unwrap(api.get<ApplicationPage>('/applications', { params }))

export const getApplication = (id: string) =>
  unwrap(api.get<Application>(`/applications/${id}`))

export const createApplication = (data: ApplicationRequest) =>
  unwrap(api.post<Application>('/applications', data))

export const updateApplication = (id: string, data: ApplicationRequest) =>
  unwrap(api.put<Application>(`/applications/${id}`, data))

export const updateStatus = (id: string, status: string) =>
  unwrap(api.patch<Application>(`/applications/${id}/status`, { status }))

export const updateReminder = (id: string, recruiterDmReminderEnabled: boolean) =>
  unwrap(api.patch<Application>(`/applications/${id}/reminder`, { recruiterDmReminderEnabled }))

export const markDmSent = (id: string) =>
  unwrap(api.patch<Application>(`/applications/${id}/mark-dm-sent`, {}))

export const archiveApplication = (id: string) =>
  unwrap(api.patch<Application>(`/applications/${id}/archive`, {}))

export const deleteApplication = (id: string) =>
  unwrap(api.delete(`/applications/${id}`))

export const getUpcoming = () =>
  unwrap(api.get<Application[]>('/applications/upcoming'))

export const getOverdue = () =>
  unwrap(api.get<Application[]>('/applications/overdue'))

export const getLinkMetadata = (url: string) =>
  unwrap(api.get<LinkMetadata>('/applications/link-metadata', { params: { url } }))
