import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const ProtectedRoute = ({ children }) => {
  const accessToken = useAuthStore((s) => s.accessToken)
  const location = useLocation()
  const isAuthenticated = !!accessToken

  if (!isAuthenticated && location.pathname === '/about') {
    return children
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
