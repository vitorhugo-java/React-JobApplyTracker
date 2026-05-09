import React from 'react'
import { Button } from 'primereact/button'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { usePageTitle } from '../../hooks/usePageTitle'

const GoogleDriveCallback = () => {
  usePageTitle('Google Drive')
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken))
  const searchParams = new URLSearchParams(window.location.search)
  const status = searchParams.get('status') === 'success' ? 'success' : 'error'
  const message =
    searchParams.get('message') ||
    (status === 'success'
      ? 'Google Drive connected successfully. Return to your account settings to refresh the status.'
      : 'Google Drive authorization could not be completed.')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-10">
      <div className="max-w-lg mx-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            status === 'success'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
          }`}
        >
          {status === 'success' ? 'Google Drive connected' : 'Google Drive authorization failed'}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Google Drive</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            label={isAuthenticated ? 'Go to Account Settings' : 'Go to Login'}
            onClick={() => navigate(isAuthenticated ? '/account' : '/login')}
          />
          <Button label="Close Tab" outlined onClick={() => window.close()} />
        </div>
      </div>
    </div>
  )
}

export default GoogleDriveCallback
