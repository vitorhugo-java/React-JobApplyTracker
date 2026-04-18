import api from './axios'

export const APPLICATION_STATUSES = [
  'RH',
  'Fiz a RH - Aguardando Atualização',
  'Fiz a Hiring Manager - Aguardando Atualização',
  'Teste Técnico',
  'Fiz teste Técnico - aguardando atualização',
  'RH (Negociação)',
  'Rejeitado',
  'Tarde demais',
  'Ghosting',
]

export const TO_SEND_LATER_STATUS = 'TO_SEND_LATER'

export const getApplications = (params) =>
  api.get('/applications', { params })

export const getApplication = (id) => api.get(`/applications/${id}`)

export const createApplication = (data) => api.post('/applications', data)

export const updateApplication = (id, data) =>
  api.put(`/applications/${id}`, data)

export const patchStatus = (id, status) =>
  api.patch(`/applications/${id}/status`, { status })

export const patchReminder = (id, recruiterDmReminderEnabled) =>
  api.patch(`/applications/${id}/reminder`, { recruiterDmReminderEnabled })

export const markDmSent = (id) =>
  api.patch(`/applications/${id}/mark-dm-sent`, {})

export const deleteApplication = (id) => api.delete(`/applications/${id}`)

export const getUpcoming = () => api.get('/applications/upcoming')

export const getOverdue = () => api.get('/applications/overdue')
