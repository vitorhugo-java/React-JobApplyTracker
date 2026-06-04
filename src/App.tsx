import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { CenteredSpinner } from '@/components/ui/feedback'
import { me } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import Dashboard from '@/pages/dashboard/Dashboard'

export default function App() {
  const [booted, setBooted] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)

  // Restore the user profile if we already hold a token.
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      if (!useAuthStore.getState().accessToken) {
        setBooted(true)
        return
      }
      try {
        const user = await me()
        if (!cancelled) setUser(user)
      } catch (error) {
        if (
          typeof error === 'object' &&
          error &&
          'response' in error &&
          [401, 403].includes((error as { response?: { status?: number } }).response?.status ?? 0)
        ) {
          logout()
        }
      } finally {
        if (!cancelled) setBooted(true)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [setUser, logout])

  if (!booted) return <CenteredSpinner label="Starting Applywell…" />

  return (
    <Routes>
      <Route path="/login" element={accessToken ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={accessToken ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
