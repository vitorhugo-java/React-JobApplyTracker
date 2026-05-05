import { create } from 'zustand'
import {
  GAMIFICATION_EVENT_XP,
  getGamificationAchievements,
  getGamificationProfile,
  recordGamificationEvent,
} from '../api/gamification'
import logger from '../utils/logger'

const xpForLevel = (level) => 100 * Math.max(0, level - 1) ** 2

const calculateLevel = (totalXp) => Math.floor(Math.sqrt(totalXp / 100)) + 1

const resolveRankTitle = (level) => {
  if (level >= 51) return 'Lenda das Contratacoes'
  if (level >= 31) return 'Mestre das Soft Skills'
  if (level >= 16) return 'Sobrevivente do LinkedIn'
  if (level >= 6) return 'Job Hunter Iniciante'
  return 'Desempregado de Aluguel'
}

const buildProfileSnapshot = (currentXp, streakDays = 0) => {
  const level = calculateLevel(currentXp)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const levelSpan = Math.max(1, nextLevelXp - currentLevelXp)
  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.floor(((currentXp - currentLevelXp) * 100) / levelSpan))
  )

  return {
    currentXp,
    level,
    currentLevelXp,
    nextLevelXp,
    xpToNextLevel: Math.max(0, nextLevelXp - currentXp),
    progressPercentage,
    rankTitle: resolveRankTitle(level),
    streakDays,
  }
}

const buildQueuedEventResponse = (eventType, xpAwarded, profile) => ({
  eventType,
  xpAwarded,
  leveledUp: false,
  queuedOffline: true,
  message: `+${xpAwarded} XP em fila para sincronizar quando a conexao voltar.`,
  profile,
})

const useGamificationStore = create((set, get) => ({
  profile: null,
  achievements: [],
  isLoading: false,
  hasLoaded: false,
  latestEvent: null,

  reset: () => set({
    profile: null,
    achievements: [],
    isLoading: false,
    hasLoaded: false,
    latestEvent: null,
  }),

  clearLatestEvent: () => set({ latestEvent: null }),

  loadGamification: async () => {
    set({ isLoading: true })
    try {
      const [profileRes, achievementsRes] = await Promise.all([
        getGamificationProfile(),
        getGamificationAchievements(),
      ])
      set({
        profile: profileRes.data,
        achievements: achievementsRes.data || [],
        hasLoaded: true,
      })
    } catch (error) {
      logger.warn('Failed to load gamification data', {
        message: error?.message,
        status: error?.response?.status,
      })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  refreshProfile: async () => {
    try {
      const response = await getGamificationProfile()
      set({ profile: response.data, hasLoaded: true })
      return response.data
    } catch (error) {
      logger.warn('Failed to refresh gamification profile', {
        message: error?.message,
        status: error?.response?.status,
      })
      throw error
    }
  },

  recordEvent: async (eventType, payload = {}) => {
    try {
      const response = await recordGamificationEvent(eventType, payload)

      if (response.data?.queuedOffline) {
        const xpAwarded = GAMIFICATION_EVENT_XP[eventType] ?? 0
        const currentProfile = get().profile
        const optimisticProfile = buildProfileSnapshot(
          (currentProfile?.currentXp ?? 0) + xpAwarded,
          currentProfile?.streakDays ?? 0
        )
        const queuedEvent = buildQueuedEventResponse(eventType, xpAwarded, optimisticProfile)
        set({
          profile: optimisticProfile,
          hasLoaded: true,
          latestEvent: {
            ...queuedEvent,
            timestamp: Date.now(),
          },
        })
        return queuedEvent
      }

      if (response.data?.profile) {
        set({
          profile: response.data.profile,
          hasLoaded: true,
          latestEvent: {
            ...response.data,
            timestamp: Date.now(),
          },
        })
      }

      return response.data
    } catch (error) {
      logger.warn('Failed to record gamification event', {
        eventType,
        message: error?.message,
        status: error?.response?.status,
      })
      throw error
    }
  },
}))

export default useGamificationStore
