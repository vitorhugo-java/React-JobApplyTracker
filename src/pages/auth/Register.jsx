import React, { useRef, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { register as registerApi } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import { usePageTitle } from '../../hooks/usePageTitle'

const Register = () => {
  usePageTitle('Registrar')
  const toast = useRef(null)
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  // Password strength evaluation
  const passwordStrength = useMemo(() => {
    const pwd = form.password
    if (!pwd) return { score: 0, label: '', color: '', requirements: {} }

    const requirements = {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    }

    let score = 0
    if (requirements.minLength) score++
    if (requirements.hasUppercase) score++
    if (requirements.hasLowercase) score++
    if (requirements.hasNumber) score++
    if (requirements.hasSpecialChar) score++

    let label = ''
    let color = ''

    if (score === 0) {
      label = 'Very Weak'
      color = 'bg-red-100 dark:bg-red-900'
    } else if (score === 1) {
      label = 'Weak'
      color = 'bg-red-100 dark:bg-red-900'
    } else if (score === 2) {
      label = 'Fair'
      color = 'bg-yellow-100 dark:bg-yellow-900'
    } else if (score === 3) {
      label = 'Good'
      color = 'bg-blue-100 dark:bg-blue-900'
    } else if (score === 4) {
      label = 'Strong'
      color = 'bg-green-100 dark:bg-green-900'
    } else {
      label = 'Very Strong'
      color = 'bg-green-100 dark:bg-green-900'
    }

    return { score, label, color, requirements }
  }, [form.password])

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(form.email)) return 'Please enter a valid email.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handlePasswordChange = (e) => {
    setForm({ ...form, password: e.target.value })
    setPasswordTouched(true)
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
      let detail = 'Registration failed. Please try again.'
      
      // Handle specific API error messages
      if (err.response?.data?.message) {
        detail = err.response.data.message
      } else if (err.response?.data?.errors) {
        // Handle validation errors array
        const errorMessages = Object.values(err.response.data.errors).flat()
        detail = errorMessages.join(' ')
      } else if (err.response?.status === 409) {
        detail = 'This email is already registered. Please try logging in instead.'
      } else if (err.response?.status === 400) {
        detail = 'Invalid registration data. Please check your inputs.'
      }
      
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
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <Password
              value={form.password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
              pt={{ input: { 'data-testid': 'register-password' } }}
            />
            
            {/* Password Strength Indicator */}
            {passwordTouched && form.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Password Strength:</span>
                  <span
                    data-testid="password-strength-label"
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                    passwordStrength.score <= 2 ? 'text-red-700 dark:text-red-400' :
                    passwordStrength.score === 3 ? 'text-yellow-700 dark:text-yellow-400' :
                    'text-green-700 dark:text-green-400'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                
                {/* Strength Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    data-testid="password-strength-bar"
                    data-strength={passwordStrength.label.toLowerCase().replace(/\s+/g, '-')}
                    className={`h-2 rounded-full transition-all ${
                      passwordStrength.score <= 1 ? 'w-1/5 bg-red-500' :
                      passwordStrength.score === 2 ? 'w-2/5 bg-yellow-500' :
                      passwordStrength.score === 3 ? 'w-3/5 bg-blue-500' :
                      passwordStrength.score === 4 ? 'w-4/5 bg-green-500' :
                      'w-full bg-green-500'
                    }`}
                  />
                </div>

                {/* Requirements Checklist */}
                <div data-testid="password-requirements" className="bg-gray-50 dark:bg-gray-900 rounded p-3 space-y-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Password must include:</p>
                  <div className="space-y-1 text-xs">
                    <div data-testid="password-req-length" data-met={passwordStrength.requirements.minLength ? 'true' : 'false'} className="flex items-center gap-2">
                      <span className={passwordStrength.requirements.minLength ? '✓ text-green-600 dark:text-green-400 font-bold' : '✗ text-gray-400 dark:text-gray-600 font-bold'}>
                        {passwordStrength.requirements.minLength ? '✓' : '○'}
                      </span>
                      <span className={passwordStrength.requirements.minLength ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                        At least 8 characters
                      </span>
                    </div>
                    <div data-testid="password-req-uppercase" data-met={passwordStrength.requirements.hasUppercase ? 'true' : 'false'} className="flex items-center gap-2">
                      <span className={passwordStrength.requirements.hasUppercase ? '✓ text-green-600 dark:text-green-400 font-bold' : '✗ text-gray-400 dark:text-gray-600 font-bold'}>
                        {passwordStrength.requirements.hasUppercase ? '✓' : '○'}
                      </span>
                      <span className={passwordStrength.requirements.hasUppercase ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                        One uppercase letter (A-Z)
                      </span>
                    </div>
                    <div data-testid="password-req-lowercase" data-met={passwordStrength.requirements.hasLowercase ? 'true' : 'false'} className="flex items-center gap-2">
                      <span className={passwordStrength.requirements.hasLowercase ? '✓ text-green-600 dark:text-green-400 font-bold' : '✗ text-gray-400 dark:text-gray-600 font-bold'}>
                        {passwordStrength.requirements.hasLowercase ? '✓' : '○'}
                      </span>
                      <span className={passwordStrength.requirements.hasLowercase ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                        One lowercase letter (a-z)
                      </span>
                    </div>
                    <div data-testid="password-req-number" data-met={passwordStrength.requirements.hasNumber ? 'true' : 'false'} className="flex items-center gap-2">
                      <span className={passwordStrength.requirements.hasNumber ? '✓ text-green-600 dark:text-green-400 font-bold' : '✗ text-gray-400 dark:text-gray-600 font-bold'}>
                        {passwordStrength.requirements.hasNumber ? '✓' : '○'}
                      </span>
                      <span className={passwordStrength.requirements.hasNumber ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                        One number (0-9)
                      </span>
                    </div>
                    <div data-testid="password-req-special" data-met={passwordStrength.requirements.hasSpecialChar ? 'true' : 'false'} className="flex items-center gap-2">
                      <span className={passwordStrength.requirements.hasSpecialChar ? '✓ text-green-600 dark:text-green-400 font-bold' : '✗ text-gray-400 dark:text-gray-600 font-bold'}>
                        {passwordStrength.requirements.hasSpecialChar ? '✓' : '○'}
                      </span>
                      <span className={passwordStrength.requirements.hasSpecialChar ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                        One special character (!@#$%^&* etc)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
            )}
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
