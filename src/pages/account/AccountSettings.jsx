import React, { useCallback, useEffect, useRef, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import useAuthStore from '../../store/authStore'
import {
  changePassword as changePasswordApi,
  sendTestEmail as sendTestEmailApi,
  updateProfile as updateProfileApi,
} from '../../api/auth'
import {
  addGoogleDriveBaseResume,
  deleteGoogleDriveBaseResume,
  disconnectGoogleDriveConnection,
  getGoogleDriveSettings,
  startGoogleDriveConnection,
  updateGoogleDriveRootFolder,
} from '../../api/googleDrive'
import { usePageTitle } from '../../hooks/usePageTitle'
import {
  GOOGLE_DRIVE_GEMINI_URL,
  buildGoogleDriveFolderUrl,
  extractGoogleDocId,
  extractGoogleDriveFolderId,
  formatGoogleDriveDateTime,
} from '../../utils/googleDrive'
import { canUseGoogleIntegration as userCanUseGoogleIntegration } from '../../utils/googleDriveAccess'
import { openExternalUrl } from '../../utils/externalLinks'

const createEmptyGoogleDriveSettings = () => ({
  configured: true,
  connected: false,
  accountEmail: '',
  accountDisplayName: '',
  accountId: '',
  connectedAt: null,
  baseFolderId: '',
  baseFolderName: '',
  baseFolderUrl: '',
  baseResumes: [],
})

const AccountSettings = () => {
  usePageTitle('Configurações')
  const toast = useRef(null)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const canUseGoogleIntegration = userCanUseGoogleIntegration(user)

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
  const [initialProfile, setInitialProfile] = useState({
    name: user?.name || '',
    reminderTime: (user?.reminderTime || '19:00:00').slice(0, 5),
  })

  const [googleDriveSettings, setGoogleDriveSettings] = useState(() => createEmptyGoogleDriveSettings())
  const [googleDriveBaseFolderInput, setGoogleDriveBaseFolderInput] = useState('')
  const [initialGoogleDriveBaseFolderInput, setInitialGoogleDriveBaseFolderInput] = useState('')
  const [googleDriveResumeInput, setGoogleDriveResumeInput] = useState('')
  const [loadingGoogleDrive, setLoadingGoogleDrive] = useState(true)
  const [savingGoogleDriveFolder, setSavingGoogleDriveFolder] = useState(false)
  const [addingGoogleDriveResume, setAddingGoogleDriveResume] = useState(false)
  const [connectingGoogleDrive, setConnectingGoogleDrive] = useState(false)
  const [disconnectingGoogleDrive, setDisconnectingGoogleDrive] = useState(false)
  const [removingGoogleDriveResumeId, setRemovingGoogleDriveResumeId] = useState(null)

  const isProfileDirty = name !== initialProfile.name || reminderTime !== initialProfile.reminderTime
  const isPasswordDirty =
    passwordForm.currentPassword !== '' || passwordForm.newPassword !== '' || passwordForm.confirmPassword !== ''
  const isGoogleDriveDirty =
    canUseGoogleIntegration &&
    googleDriveBaseFolderInput.trim() !== initialGoogleDriveBaseFolderInput

  const applyGoogleDriveSettings = useCallback((settings) => {
    const nextSettings = { ...createEmptyGoogleDriveSettings(), ...settings }
    const nextBaseFolderInput =
      nextSettings.baseFolderUrl || buildGoogleDriveFolderUrl(nextSettings.baseFolderId)

    setGoogleDriveSettings(nextSettings)
    setGoogleDriveBaseFolderInput(nextBaseFolderInput)
    setInitialGoogleDriveBaseFolderInput(nextBaseFolderInput.trim())
  }, [])

  const resetGoogleDriveState = useCallback(() => {
    const emptyState = createEmptyGoogleDriveSettings()
    setGoogleDriveSettings(emptyState)
    setGoogleDriveBaseFolderInput('')
    setInitialGoogleDriveBaseFolderInput('')
    setGoogleDriveResumeInput('')
    setLoadingGoogleDrive(false)
  }, [])

  const loadGoogleDriveSettings = useCallback(
    async (showSuccessMessage = false, showLoadingSpinner = true) => {
      if (!canUseGoogleIntegration) {
        resetGoogleDriveState()
        return
      }

      if (showLoadingSpinner) {
        setLoadingGoogleDrive(true)
      }

      try {
        const response = await getGoogleDriveSettings()
        applyGoogleDriveSettings(response.data)

        if (showSuccessMessage) {
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Google Drive status refreshed.',
          })
        }
      } catch (err) {
        resetGoogleDriveState()

        if (![404, 501].includes(err.response?.status)) {
          const detail = err.response?.data?.message || 'Could not load your Google Drive settings right now.'
          toast.current?.show({ severity: 'error', summary: 'Error', detail })
        }
      } finally {
        setLoadingGoogleDrive(false)
      }
    },
    [applyGoogleDriveSettings, canUseGoogleIntegration, resetGoogleDriveState]
  )

  useEffect(() => {
    if (!canUseGoogleIntegration) {
      return
    }

    const loadTimer = window.setTimeout(() => {
      loadGoogleDriveSettings(false, false).catch(() => null)
    }, 0)

    return () => {
      window.clearTimeout(loadTimer)
    }
  }, [canUseGoogleIntegration, loadGoogleDriveSettings])

  useEffect(() => {
    const isDirty = isProfileDirty || isPasswordDirty || isGoogleDriveDirty

    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isProfileDirty, isPasswordDirty, isGoogleDriveDirty])

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
      setInitialProfile({
        name: res.data.name,
        reminderTime: (res.data.reminderTime || '19:00:00').slice(0, 5),
      })
      toast.current.show({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully.' })
    } catch (err) {
      const detail = err.response?.data?.message || 'Could not update your profile. Please check your information and try again.'
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
      let detail = err.response?.data?.message
      if (!detail) {
        if (err.response?.status === 401) {
          detail = 'Current password is incorrect. Please try again.'
        } else {
          detail = 'Could not change your password. Please verify your current password is correct.'
        }
      }
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
      const detail = err.response?.data?.message || 'Could not send test email. Please check your email address and try again.'
      toast.current.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setSendingTestEmail(false)
    }
  }

  const handleConnectGoogleDrive = async () => {
    setConnectingGoogleDrive(true)

    try {
      const response = await startGoogleDriveConnection()
      const authorizationUrl = response.data?.authorizationUrl

      if (!authorizationUrl) {
        throw new Error('No authorization URL was returned.')
      }

      openExternalUrl(authorizationUrl)
      toast.current?.show({
        severity: 'info',
        summary: 'Continue in Google',
        detail: 'Finish the Google authorization flow in the new tab, then refresh the status here.',
      })
    } catch (err) {
      const detail = err.response?.data?.message || err.message || 'Could not start the Google Drive connection.'
      toast.current?.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setConnectingGoogleDrive(false)
    }
  }

  const handleDisconnectGoogleDrive = () => {
    confirmDialog({
      message: 'Disconnect your Google Drive account from Job Tracker?',
      header: 'Disconnect Google Drive',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        setDisconnectingGoogleDrive(true)

        try {
          await disconnectGoogleDriveConnection()
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Google Drive disconnected successfully.',
          })
          await loadGoogleDriveSettings().catch(() => null)
        } catch (err) {
          const detail = err.response?.data?.message || 'Could not disconnect your Google Drive account.'
          toast.current?.show({ severity: 'error', summary: 'Error', detail })
        } finally {
          setDisconnectingGoogleDrive(false)
        }
      },
    })
  }

  const handleGoogleDriveFolderSubmit = async (e) => {
    e.preventDefault()

    if (!googleDriveSettings.connected) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Connect your Google Drive account before setting a root folder.',
      })
      return
    }

    const baseFolderInput = googleDriveBaseFolderInput.trim()
    const baseFolderId = extractGoogleDriveFolderId(baseFolderInput)

    if (!baseFolderInput || !baseFolderId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please provide a valid Google Drive folder URL or folder ID.',
      })
      return
    }

    setSavingGoogleDriveFolder(true)

    try {
      const response = await updateGoogleDriveRootFolder(baseFolderInput)
      applyGoogleDriveSettings(response.data)
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Google Drive root folder saved successfully.',
      })
    } catch (err) {
      const detail = err.response?.data?.message || 'Could not save your Google Drive root folder.'
      toast.current?.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setSavingGoogleDriveFolder(false)
    }
  }

  const handleGoogleDriveResumeSubmit = async (e) => {
    e.preventDefault()

    if (!googleDriveSettings.connected) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Connect your Google Drive account before adding a base resume.',
      })
      return
    }

    const documentInput = googleDriveResumeInput.trim()
    const documentId = extractGoogleDocId(documentInput)

    if (!documentInput || !documentId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please provide a valid Google Docs URL or document ID.',
      })
      return
    }

    setAddingGoogleDriveResume(true)

    try {
      await addGoogleDriveBaseResume(documentInput)
      setGoogleDriveResumeInput('')
      await loadGoogleDriveSettings().catch(() => null)
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Base resume added successfully.',
      })
    } catch (err) {
      const detail = err.response?.data?.message || 'Could not add your Google Docs base resume.'
      toast.current?.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setAddingGoogleDriveResume(false)
    }
  }

  const handleRemoveGoogleDriveResume = (resumeId) => {
    confirmDialog({
      message: 'Remove this Google Docs base resume?',
      header: 'Remove Base Resume',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        setRemovingGoogleDriveResumeId(resumeId)

        try {
          await deleteGoogleDriveBaseResume(resumeId)
          await loadGoogleDriveSettings().catch(() => null)
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Base resume removed successfully.',
          })
        } catch (err) {
          const detail = err.response?.data?.message || 'Could not remove this base resume.'
          toast.current?.show({ severity: 'error', summary: 'Error', detail })
        } finally {
          setRemovingGoogleDriveResumeId(null)
        }
      },
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {canUseGoogleIntegration
            ? 'Manage your personal information, Google Drive integration and account password'
            : 'Manage your personal information and account password'}
        </p>
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

      {canUseGoogleIntegration && (
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Google Drive (BETA)</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Connect Google Drive, set the root folder and manage the Google Docs base resumes used in application copies.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                label="Refresh Status"
                icon="pi pi-refresh"
                outlined
                onClick={() => loadGoogleDriveSettings(true)}
                loading={loadingGoogleDrive}
              />
              <Button
                type="button"
                label={googleDriveSettings.connected ? 'Reconnect Google' : 'Connect Google'}
                icon="pi pi-link"
                onClick={handleConnectGoogleDrive}
                loading={connectingGoogleDrive}
              />
              {googleDriveSettings.connected && (
                <Button
                  type="button"
                  label="Disconnect"
                  icon="pi pi-times"
                  severity="danger"
                  outlined
                  onClick={handleDisconnectGoogleDrive}
                  loading={disconnectingGoogleDrive}
                />
              )}
            </div>
          </div>

          {!googleDriveSettings.configured && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Google Drive integration is not configured on the server yet.
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Backend environment variables must be configured before this feature can be used.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Connection status</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loadingGoogleDrive
                    ? 'Checking your Google Drive connection...'
                    : googleDriveSettings.connected
                      ? `${googleDriveSettings.accountDisplayName || 'Google account'}${
                          googleDriveSettings.accountEmail ? ` • ${googleDriveSettings.accountEmail}` : ''
                        }`
                      : 'No Google Drive account connected yet.'}
                </p>
                {googleDriveSettings.connectedAt && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Connected at {formatGoogleDriveDateTime(googleDriveSettings.connectedAt)}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  googleDriveSettings.connected
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {googleDriveSettings.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <form onSubmit={handleGoogleDriveFolderSubmit} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="googleDriveBaseFolder" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Root Drive Folder
              </label>
              <InputText
                id="googleDriveBaseFolder"
                value={googleDriveBaseFolderInput}
                onChange={(e) => setGoogleDriveBaseFolderInput(e.target.value)}
                className="w-full"
                placeholder="Paste a Google Drive folder URL or folder ID"
                disabled={!googleDriveSettings.configured}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Resume copies for each application will be created inside this Drive folder.
              </p>
            </div>

            {googleDriveSettings.baseFolderId && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {googleDriveSettings.baseFolderName || 'Configured root folder'}
                </p>
                <p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">
                  {googleDriveSettings.baseFolderId}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    label="Open Folder"
                    icon="pi pi-external-link"
                    outlined
                    onClick={() => openExternalUrl(googleDriveSettings.baseFolderUrl)}
                  />
                  <Button
                    type="button"
                    label="Gemini Helper"
                    icon="pi pi-sparkles"
                    text
                    onClick={() => openExternalUrl(GOOGLE_DRIVE_GEMINI_URL)}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              label="Save Root Folder"
              loading={savingGoogleDriveFolder}
              disabled={!googleDriveSettings.configured}
            />
          </form>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Base resumes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Register each Google Docs template that should be available when generating resume copies for a job application.
              </p>
            </div>

            <form onSubmit={handleGoogleDriveResumeSubmit} className="flex flex-col gap-3 sm:flex-row">
              <InputText
                value={googleDriveResumeInput}
                onChange={(e) => setGoogleDriveResumeInput(e.target.value)}
                className="w-full"
                placeholder="https://docs.google.com/document/d/..."
                disabled={!googleDriveSettings.configured}
              />
              <Button
                type="submit"
                label="Add Base Resume"
                icon="pi pi-plus"
                loading={addingGoogleDriveResume}
                disabled={!googleDriveSettings.configured}
              />
            </form>

            {googleDriveSettings.baseResumes.length ? (
              <div className="space-y-3">
                {googleDriveSettings.baseResumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{resume.documentName}</p>
                        <p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">
                          {resume.documentId}
                        </p>
                        {resume.createdAt && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Added at {formatGoogleDriveDateTime(resume.createdAt)}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          label="Open Doc"
                          icon="pi pi-external-link"
                          outlined
                          onClick={() => openExternalUrl(resume.documentUrl)}
                        />
                        <Button
                          type="button"
                          label="Remove"
                          icon="pi pi-trash"
                          severity="danger"
                          text
                          loading={removingGoogleDriveResumeId === resume.id}
                          onClick={() => handleRemoveGoogleDriveResume(resume.id)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No Google Docs base resumes configured yet.
              </div>
            )}
          </div>
        </section>
      )}

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
