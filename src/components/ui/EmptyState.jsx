import React from 'react'
import { Inbox } from 'lucide-react'

const EmptyState = ({ title = 'No data found', description = '', action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
