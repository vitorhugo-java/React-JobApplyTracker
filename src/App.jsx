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
import MetricsPage from './pages/dashboard/MetricsPage'
import ApplicationsList from './pages/applications/ApplicationsList'
import ApplicationForm from './pages/applications/ApplicationForm'
import ApplicationDetail from './pages/applications/ApplicationDetail'
import Reminders from './pages/reminders/Reminders'
import Developer from './pages/developer/Developer'
import About from './pages/about/About'
import AccountSettings from './pages/account/AccountSettings'
import GoogleDriveCallback from './pages/account/GoogleDriveCallback'
import useAuthStore from './store/authStore'
import useGamificationStore from './store/gamificationStore'
import { me as meApi } from './api/auth'
import { warmOfflineData } from './api/offlineWarmup'

const App = () => {
  const [appReady, setAppReady] = useState(false)

  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const initTheme = useAuthStore((s) => s.initTheme)

  const loadGamification = useGamificationStore((s) => s.loadGamification)
  const resetGamification = useGamificationStore((s) => s.reset)

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      try {
        // restore persisted zustand state
        await useAuthStore.persist.rehydrate()

        initTheme()

        const { accessToken } = useAuthStore.getState()

        // anonymous user:
        // app should render immediately
        if (!accessToken) {
          return
        }

        // if token exists, try to get user
        // interceptor handles refresh automatically
        const userRes = await meApi()

        if (!cancelled) {
          setUser(userRes.data)
        }
      } catch (err) {
        // backend unavailable:
        // preserve local session
        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          logout()
        }
      } finally {
        if (!cancelled) {
          setAppReady(true)
        }
      }
    }

    boot()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!appReady || !accessToken) return
    if (typeof navigator !== 'undefined' && navigator.webdriver) return

    warmOfflineData().catch(() => null)
  }, [appReady, accessToken])

  useEffect(() => {
    if (!appReady) return

    if (!accessToken) {
      resetGamification()
      return
    }

    loadGamification().catch(() => null)
  }, [appReady, accessToken, loadGamification, resetGamification])

  if (!appReady) {
    return <div>Loading...</div>
  }

  return (
    <PrimeReactProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="/dashboard/metrics" element={<MetricsPage />} />
          <Route path="/applications" element={<ApplicationsList />} />
          <Route path="/applications/new" element={<ApplicationForm />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/applications/:id/edit" element={<ApplicationForm />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/developer" element={<Developer />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="/account/google-drive/callback" element={<GoogleDriveCallback />} />
        </Route>
      </Routes>
    </PrimeReactProvider>
  )
}

export default App
