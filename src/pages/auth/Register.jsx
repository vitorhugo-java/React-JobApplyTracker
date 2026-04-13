import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { register as registerApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'

const Register = () => {
  const toast = useRef(null)
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(form.email)) return 'Please enter a valid email.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const error = validate()
    if (error) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: error })
      return
    }
    setLoading(true)
    try {
      const res = await registerApi(form)
      const { accessToken, refreshToken, user } = res.data
      setTokens(accessToken, refreshToken)
      setUser(user)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.message || 'Registration failed. Please try again.'
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Start tracking your applications</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <InputText
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              type="text"
              className="w-full"
              data-testid="register-name"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <InputText
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              type="email"
              className="w-full"
              data-testid="register-email"
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
              pt={{ input: { 'data-testid': 'register-password' } }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
            <Password
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="••••••••"
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
              pt={{ input: { 'data-testid': 'register-confirm-password' } }}
            />
          </div>
          <Button type="submit" label="Create Account" loading={loading} className="w-full mt-2" data-testid="register-submit" />
        </form>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
