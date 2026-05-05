import React from 'react'
import { formatMetricValue } from '../../utils/dashboardMetrics'

const toneClasses = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
}

const MetricsPanel = ({ cards }) => (
  <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
    {cards.map((card) => (
      <div
        key={card.key}
        className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
        data-testid={card.testId}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p
              className="text-3xl font-bold text-gray-900 dark:text-white mt-2"
              data-testid={card.testId && `${card.testId}-value`}
            >
              {formatMetricValue(card.value, card.format)}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${toneClasses[card.tone] || toneClasses.indigo}`}>
            {React.createElement(card.icon, { className: 'w-6 h-6 text-white' })}
          </div>
        </div>
      </div>
    ))}
  </section>
)

export default MetricsPanel
