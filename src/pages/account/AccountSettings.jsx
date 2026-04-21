import React, { useRef, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import useAuthStore from '../../store/authStore'
import {
  changePassword as changePasswordApi,
  sendTestEmail as sendTestEmailApi,
  updateProfile as updateProfileApi,
} from '../../api/auth'
import { usePageTitle } from '../../hooks/usePageTitle'

const AccountSettings = () => {
  usePageTitle('Configurações')
  const toast = useRef(null)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)

  const [name, setName] = useState(user?.name || '')
  const [reminderTime, setReminderTime] = useState((user?.reminderTime || '19:00:00').slice(0, 5))
  const [savingName, setSavingName] = useState(false)
  const [sendingTestEmail, setSendingTestEmail] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingPassword, setSavingPassword] = useState(false)

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Name is required.' })
      return
    }

    setSavingName(true)
    try {
      const timePayload = reminderTime?.trim() ? `${reminderTime}:00` : null
      const res = await updateProfileApi({ name: trimmedName, reminderTime: timePayload })
      setUser(res.data)
      setName(res.data.name)
      setReminderTime((res.data.reminderTime || '19:00:00').slice(0, 5))
      toast.current.show({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully.' })
    } catch (err) {
      const detail = err.response?.data?.message || 'Failed to update profile.'
      toast.current.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setSavingName(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'Please fill in all password fields.' })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'New password and confirmation must match.' })
      return
    }

    setSavingPassword(true)
    try {
      await changePasswordApi(passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.current.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Password changed successfully. Please login again.',
      })

      setTimeout(() => {
        logout()
        window.location.href = '/login'
      }, 1000)
    } catch (err) {
      const detail = err.response?.data?.message || 'Failed to change password.'
      toast.current.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!user?.email) {
      toast.current.show({ severity: 'warn', summary: 'Validation', detail: 'No email available for this account.' })
      return
    }

    setSendingTestEmail(true)
    try {
      const res = await sendTestEmailApi()
      const detail = res.data?.message || 'Test email sent. Check your inbox and spam folder.'
      toast.current.show({ severity: 'success', summary: 'Success', detail })
    } catch (err) {
      const detail = err.response?.data?.message || 'Failed to send test email.'
      toast.current.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setSendingTestEmail(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Toast ref={toast} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your personal information and account password</p>
      </div>

      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <InputText
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              maxLength={150}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <InputText id="email" value={user?.email || ''} className="w-full" disabled />
            <div className="pt-2">
              <Button
                type="button"
                label="Test Email"
                icon="pi pi-envelope"
                loading={sendingTestEmail}
                onClick={handleSendTestEmail}
                outlined
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="reminderTime" className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Reminder Time</label>
            <InputText
              id="reminderTime"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full"
              type="time"
            />
          </div>

          <Button type="submit" label="Save Profile" loading={savingName} />
        </form>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
            <Password
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
            <Password
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
            <Password
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              feedback={false}
              toggleMask
              className="w-full"
              inputClassName="w-full"
            />
          </div>

          <Button type="submit" label="Update Password" loading={savingPassword} />
        </form>
      </section>
    </div>
  )
}

export default AccountSettings
