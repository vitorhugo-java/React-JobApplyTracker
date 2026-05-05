import React from 'react'
import { Medal } from 'lucide-react'

const AchievementsList = ({ achievements = [] }) => {
  if (!achievements.length) return null

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
      data-testid="achievements-list"
    >
      <div className="flex items-center gap-2 mb-4">
        <Medal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Achievements</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.code}
            className={`rounded-xl border p-4 transition-colors ${
              achievement.unlocked
                ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{achievement.name}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{achievement.description}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  achievement.unlocked
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800/60 dark:text-indigo-100'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {achievement.unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AchievementsList
