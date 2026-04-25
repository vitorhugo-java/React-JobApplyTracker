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
import Developer from './pages/developer/Developer'
import About from './pages/about/About'
import AccountSettings from './pages/account/AccountSettings'
import useAuthStore from './store/authStore'
import { me as meApi, refresh as refreshApi } from './api/auth'
import { warmOfflineData } from './api/offlineWarmup'

const App = () => {
  const [appReady, setAppReady] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = Boolean(accessToken)
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const initTheme = useAuthStore((s) => s.initTheme)

  useEffect(() => {
    let cancelled = false
    const restoreSession = async () => {
      // Ensure persisted auth state is loaded before making any auth decision.
      await useAuthStore.persist.rehydrate()

      // Theme update uses store.set, so it must run after auth hydration.
      initTheme()

      const { accessToken } = useAuthStore.getState()

      if (!accessToken) {
        // Try to refresh using the stored refresh token cookie
        try {
          const res = await refreshApi()
          const { accessToken: newAccess } = res.data
          setTokens(newAccess)
          const userRes = await meApi()
          setUser(userRes.data)
          if (!cancelled) setAppReady(true)
          return
        } catch (err) {
          // Network error — keep the session and let user try again
          if (!err.response) {
            if (!cancelled) setAppReady(true)
            return
          }

          // Only clear persisted session for definitive auth failures.
          if (err.response.status === 401 || err.response.status === 403) {
            logout()
          }
          if (!cancelled) setAppReady(true)
          return
        }
      }

      // Validate the existing access token
      try {
        const res = await meApi()
        setUser(res.data)
        if (!cancelled) setAppReady(true)
        return
      } catch (err) {
        // Network error (backend unreachable) — keep persisted session intact
        if (!err.response) {
          if (!cancelled) setAppReady(true)
          return
        }

        // For auth failures, the axios interceptor will handle token refresh
        // via the cookie-based mechanism. Just set app ready.
        if (!cancelled) setAppReady(true)
        return
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [initTheme, setTokens, setUser, logout])

  useEffect(() => {
    if (!appReady || !accessToken) return

    warmOfflineData().catch(() => null)
  }, [appReady, accessToken])

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

        {!isAuthenticated && <Route path="/about" element={<About />} />}

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
          <Route path="/about" element={<About />} />
          <Route path="/developer" element={<Developer />} />
          <Route path="/account" element={<AccountSettings />} />
        </Route>
      </Routes>
    </PrimeReactProvider>
  )
}

export default App
