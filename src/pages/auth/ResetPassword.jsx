import React, { useRef, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { resetPassword as resetPasswordApi } from '../../api/auth'
import { usePageTitle } from '../../hooks/usePageTitle'

const ResetPassword = () => {
  usePageTitle('Redefinir Senha')
  const toast = useRef(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  // Password strength evaluation
  const passwordStrength = useMemo(() => {
    const pwd = form.newPassword
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
  }, [form.newPassword])

  const handlePasswordChange = (e) => {
    setForm({ ...form, newPassword: e.target.value })
    setPasswordTouched(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.newPassword || !form.confirmPassword) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Please fill in all fields.' })
      return
    }
    if (form.newPassword.length < 8) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Password must be at least 8 characters.' })
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Passwords do not match.' })
      return
    }
    if (!token) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Invalid or missing reset token. Please request a new password reset link.' })
      return
    }
    setLoading(true)
    try {
      await resetPasswordApi({ token, newPassword: form.newPassword, confirmPassword: form.confirmPassword })
      toast.current.show({ severity: 'success', summary: 'Success', detail: 'Password reset successfully.' })
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      let detail = 'Failed to reset password.'
      
      // Handle specific API error messages
      if (err.response?.data?.message) {
        detail = err.response.data.message
      } else if (err.response?.data?.errors) {
        // Handle validation errors array
        const errorMessages = Object.values(err.response.data.errors).flat()
        detail = errorMessages.join(' ')
      } else if (err.response?.status === 400) {
        detail = 'The reset link may have expired. Please request a new password reset.'
      } else if (err.response?.status === 401) {
        detail = 'Invalid reset token. Please request a new password reset link.'
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Password</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Enter your new password below</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
            <Password
              value={form.newPassword}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
            />
            
            {/* Password Strength Indicator */}
            {passwordTouched && form.newPassword && (
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
                    data-strength={(passwordStrength.label || '').toLowerCase().replace(/\s+/g, '-')}
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
            <Password
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="••••••••"
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
            />
            {form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
            )}
          </div>
          
          <Button type="submit" label="Reset Password" loading={loading} className="w-full" />
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
