import { create } from 'zustand'
import { getAchievements, getGamificationProfile } from '@/api/gamification'
import type { Achievement, GamificationProfile } from '@/types'

interface GamificationState {
  profile: GamificationProfile | null
  achievements: Achievement[]
  loaded: boolean
  loading: boolean
  load: () => Promise<void>
  reset: () => void
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  profile: null,
  achievements: [],
  loaded: false,
  loading: false,
  load: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      const [profile, achievements] = await Promise.all([
        getGamificationProfile().catch(() => null),
        getAchievements().catch(() => [] as Achievement[]),
      ])
      set({ profile, achievements, loaded: true })
    } finally {
      set({ loading: false })
    }
  },
  reset: () => set({ profile: null, achievements: [], loaded: false }),
}))
