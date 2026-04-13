import React from 'react'

const LoadingSkeleton = ({ rows = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      ))}
    </div>
  )
}

export default LoadingSkeleton
