import React from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = !!accessToken

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
