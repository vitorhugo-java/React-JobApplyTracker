import { api, unwrap } from '@/lib/api'
import type { Achievement, GamificationProfile } from '@/types'

export const getGamificationProfile = () =>
  unwrap(api.get<GamificationProfile>('/gamification/profile'))

export const getAchievements = () =>
  unwrap(api.get<Achievement[]>('/gamification/achievements'))
