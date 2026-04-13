import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { login as loginApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'

const Login = () => {
  const toast = useRef(null)
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Please fill in all fields.' })
      return
    }
    setLoading(true)
    try {
      const res = await loginApi(form)
      const { accessToken, refreshToken, user } = res.data
      setTokens(accessToken, refreshToken)
      setUser(user)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.message || 'Login failed. Please try again.'
      toast.current.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Toast ref={toast} />
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">JT</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <InputText
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              type="email"
              className="w-full"
              data-testid="login-email"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <Password
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
              pt={{ input: { 'data-testid': 'login-password' } }}
            />
          </div>
          <Button
            type="submit"
            label="Sign In"
            loading={loading}
            className="w-full mt-2"
            data-testid="login-submit"
          />
        </form>
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <p>
            <Link to="/forgot-password" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Forgot your password?
            </Link>
          </p>
          <p>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
