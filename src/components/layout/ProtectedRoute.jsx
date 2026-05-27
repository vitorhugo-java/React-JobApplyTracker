import React from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore((s) => s.accessToken)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl animate-pulse" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute