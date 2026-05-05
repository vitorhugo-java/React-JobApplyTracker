import React from 'react'
import { Trophy } from 'lucide-react'

const getBadgeTone = (level) => {
  if (level >= 51) return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700'
  if (level >= 31) return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900/40 dark:text-fuchsia-200 dark:border-fuchsia-700'
  if (level >= 16) return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700'
  if (level >= 6) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700'
  return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600'
}

const LevelBadge = ({ profile, compact = false }) => {
  if (!profile) return null

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${getBadgeTone(profile.level)}`}
      data-testid="level-badge"
    >
      <Trophy className="w-4 h-4" />
      <span className="text-xs font-semibold uppercase tracking-wide">Lv. {profile.level}</span>
      {!compact && (
        <span className="hidden lg:inline text-xs opacity-90">{profile.rankTitle}</span>
      )}
    </div>
  )
}

export default LevelBadge
