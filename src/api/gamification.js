import api from './axios'

export const GAMIFICATION_EVENT_TYPES = {
  APPLICATION_CREATED: 'APPLICATION_CREATED',
  RECRUITER_DM_SENT: 'RECRUITER_DM_SENT',
  INTERVIEW_PROGRESS: 'INTERVIEW_PROGRESS',
  NOTE_ADDED: 'NOTE_ADDED',
  OFFER_WON: 'OFFER_WON',
}

export const GAMIFICATION_EVENT_XP = {
  [GAMIFICATION_EVENT_TYPES.APPLICATION_CREATED]: 10,
  [GAMIFICATION_EVENT_TYPES.RECRUITER_DM_SENT]: 15,
  [GAMIFICATION_EVENT_TYPES.INTERVIEW_PROGRESS]: 50,
  [GAMIFICATION_EVENT_TYPES.NOTE_ADDED]: 5,
  [GAMIFICATION_EVENT_TYPES.OFFER_WON]: 500,
}

export const getGamificationProfile = () => api.get('/gamification/profile')

export const getGamificationAchievements = () => api.get('/gamification/achievements')

export const recordGamificationEvent = (eventType, payload = {}) =>
  api.post('/gamification/events', {
    eventType,
    ...payload,
  })
