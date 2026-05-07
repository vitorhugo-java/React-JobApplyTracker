import React from 'react'

const XPBar = ({ profile }) => {
  if (!profile) return null

  const progressPercentage = Number.isFinite(profile.progressPercentage)
    ? Math.min(100, Math.max(0, profile.progressPercentage))
    : 0

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
      data-testid="xp-bar"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Job Hunter Quest</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nivel {profile.level} - {profile.rankTitle}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {profile.currentXp} XP total • faltam {profile.xpToNextLevel} XP para o proximo nivel
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-white">{profile.currentLevelXp}</span>
          <span> / </span>
          <span className="font-semibold text-gray-900 dark:text-white">{profile.nextLevelXp}</span>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{
              width: `${progressPercentage}%`,
              minWidth: progressPercentage > 0 ? '0.75rem' : 0,
              backgroundImage: 'linear-gradient(90deg, rgb(99 102 241), rgb(139 92 246), rgb(217 70 239))',
            }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{progressPercentage}% do nivel atual</span>
          <span>Streak: {profile.streakDays} dia(s)</span>
        </div>
      </div>
    </div>
  )
}

export default XPBar
