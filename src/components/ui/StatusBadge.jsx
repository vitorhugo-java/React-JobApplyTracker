import React from 'react'

const STATUS_COLORS = {
  'RH': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Fiz a RH - Aguardando Atualização': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Fiz a Hiring Manager - Aguardando Atualização': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Teste Técnico': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Fiz teste Técnico - aguardando atualização': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'RH (Negociação)': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const StatusBadge = ({ status }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  )
}

export default StatusBadge
