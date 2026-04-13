import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PrimeReactProvider } from 'primereact/api'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Dashboard from './pages/dashboard/Dashboard'
import ApplicationsList from './pages/applications/ApplicationsList'
import ApplicationForm from './pages/applications/ApplicationForm'
import ApplicationDetail from './pages/applications/ApplicationDetail'
import Reminders from './pages/reminders/Reminders'
import Developer from './pages/developer/Developer'
import useAuthStore from './store/authStore'
import { me as meApi, refresh as refreshApi } from './api/auth'

const App = () => {
  const [appReady, setAppReady] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const initTheme = useAuthStore((s) => s.initTheme)

  useEffect(() => {
    initTheme()
    const restoreSession = async () => {
      if (accessToken) {
        try {
          const res = await meApi()
          setUser(res.data)
          setAppReady(true)
          return
        } catch (_) {}
      }
      if (refreshToken) {
        try {
          const res = await refreshApi({ refreshToken })
          const { accessToken: newAccess, refreshToken: newRefresh } = res.data
          setTokens(newAccess, newRefresh)
          const userRes = await meApi()
          setUser(userRes.data)
          setAppReady(true)
          return
        } catch (_) {}
      }
      logout()
      setAppReady(true)
    }
    restoreSession()
  }, [])

  if (!appReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl animate-pulse" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <PrimeReactProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/applications" element={<ApplicationsList />} />
          <Route path="/applications/new" element={<ApplicationForm />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/applications/:id/edit" element={<ApplicationForm />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/developer" element={<Developer />} />
        </Route>
      </Routes>
    </PrimeReactProvider>
  )
}

export default App
