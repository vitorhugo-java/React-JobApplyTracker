import React from 'react'
import { Chart } from 'primereact/chart'

const hasChartData = (chart) => {
  const firstDataset = chart?.data?.datasets?.[0]

  return Boolean(chart?.data?.labels?.length && firstDataset?.data?.length)
}

const MetricsCharts = ({ charts }) => (
  <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
    {charts.map((chart) => (
      <div
        key={chart.key}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4"
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{chart.title}</h2>
        </div>
        {hasChartData(chart) ? (
          <div className="h-80" data-testid={`metrics-chart-${chart.key}`}>
            <Chart type={chart.type} data={chart.data} options={chart.options} className="h-full" />
          </div>
        ) : (
          <div className="h-80 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center px-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Nenhum dado disponível para este gráfico com os filtros atuais.
          </div>
        )}
      </div>
    ))}
  </section>
)

export default MetricsCharts
