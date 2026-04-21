import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { forgotPassword as forgotPasswordApi } from '../../api/auth'
import { usePageTitle } from '../../hooks/usePageTitle'

const ForgotPassword = () => {
  usePageTitle('Recuperar Senha')
  const toast = useRef(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Please enter your email.' })
      return
    }
    setLoading(true)
    try {
      const res = await forgotPasswordApi({ email })
      const message = res.data?.message || 'Check your email for reset instructions.'
      toast.current.show({ severity: 'success', summary: 'Success', detail: message })
    } catch (err) {
      let detail = err.response?.data?.message
      if (!detail) {
        if (err.response?.status === 429) {
          detail = 'Too many reset requests. Please wait a few minutes before trying again.'
        } else if (!err.response) {
          detail = 'Unable to connect to the server. Please check your internet connection.'
        } else {
          detail = 'Could not send reset email. Please verify your email address is correct and try again.'
        }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Enter your email to receive reset instructions</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <InputText
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              className="w-full"
            />
          </div>
          <Button type="submit" label="Send Reset Link" loading={loading} className="w-full" />
        </form>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
