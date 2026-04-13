import React, { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { resetPassword as resetPasswordApi } from '../../api/auth'

const ResetPassword = () => {
  const toast = useRef(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.newPassword || !form.confirmPassword) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Please fill in all fields.' })
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Passwords do not match.' })
      return
    }
    if (!token) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Invalid or missing reset token.' })
      return
    }
    setLoading(true)
    try {
      await resetPasswordApi({ token, ...form })
      toast.current.show({ severity: 'success', summary: 'Success', detail: 'Password reset successfully.' })
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const detail = err.response?.data?.message || 'Failed to reset password.'
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
          {[
            { key: 'newPassword', label: 'New Password' },
            { key: 'confirmPassword', label: 'Confirm New Password' },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
              <Password
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder="••••••••"
                feedback={false}
                toggleMask
                className="w-full"
                inputClassName="w-full"
              />
            </div>
          ))}
          <Button type="submit" label="Reset Password" loading={loading} className="w-full" />
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
