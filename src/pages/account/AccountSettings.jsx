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
  disconnectGoogleDriveConnection,
  getGoogleDriveSettings,
  startGoogleDriveConnection,
  updateGoogleDriveSettings,
} from '../../api/googleDrive'
import { usePageTitle } from '../../hooks/usePageTitle'
import {
  buildGoogleDocUrl,
  buildGoogleDriveFolderUrl,
  extractGoogleDocId,
  extractGoogleDriveFolderId,
} from '../../utils/googleDrive'
import { openExternalUrl } from '../../utils/externalLinks'

const createResumeRowId = () =>
  `resume-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const createResumeRow = (resume = {}) => ({
  clientId: createResumeRowId(),
  id: resume.id ?? null,
  name: resume.name ?? '',
  documentInput: resume.documentUrl ?? buildGoogleDocUrl(resume.documentId),
  isDefault: Boolean(resume.isDefault),
})

const createEmptyGoogleDriveForm = () => ({
  connected: false,
  accountEmail: '',
  accountDisplayName: '',
  baseFolderInput: '',
  resumes: [createResumeRow({ isDefault: true })],
})

const mapGoogleDriveSettingsToForm = (settings = {}) => {
  const resumes = (settings.baseResumes ?? []).map(createResumeRow)

  if (!resumes.length) {
    resumes.push(createResumeRow({ isDefault: true }))
  } else if (!resumes.some((resume) => resume.isDefault)) {
    resumes[0].isDefault = true
  }

  return {
    connected: Boolean(settings.connected),
    accountEmail: settings.accountEmail ?? '',
    accountDisplayName: settings.accountDisplayName ?? '',
    baseFolderInput: settings.baseFolderUrl ?? buildGoogleDriveFolderUrl(settings.baseFolderId),
    resumes,
  }
}

const serializeGoogleDriveForm = (form) =>
  JSON.stringify({
    baseFolderInput: form.baseFolderInput.trim(),
    resumes: form.resumes.map((resume) => ({
      id: resume.id ?? null,
      name: resume.name.trim(),
      documentInput: resume.documentInput.trim(),
      isDefault: Boolean(resume.isDefault),
    })),
  })

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
  const [initialProfile, setInitialProfile] = useState({
    name: user?.name || '',
    reminderTime: (user?.reminderTime || '19:00:00').slice(0, 5),
  })

  const [googleDriveForm, setGoogleDriveForm] = useState(() => createEmptyGoogleDriveForm())
  const [loadingGoogleDrive, setLoadingGoogleDrive] = useState(true)
  const [savingGoogleDrive, setSavingGoogleDrive] = useState(false)
  const [connectingGoogleDrive, setConnectingGoogleDrive] = useState(false)
  const [disconnectingGoogleDrive, setDisconnectingGoogleDrive] = useState(false)
  const [initialGoogleDriveSnapshot, setInitialGoogleDriveSnapshot] = useState(
    serializeGoogleDriveForm(createEmptyGoogleDriveForm())
  )

  const isProfileDirty = name !== initialProfile.name || reminderTime !== initialProfile.reminderTime
  const isPasswordDirty =
    passwordForm.currentPassword !== '' || passwordForm.newPassword !== '' || passwordForm.confirmPassword !== ''
  const isGoogleDriveDirty = serializeGoogleDriveForm(googleDriveForm) !== initialGoogleDriveSnapshot

  const applyGoogleDriveSettings = useCallback((settings) => {
    const nextForm = mapGoogleDriveSettingsToForm(settings)
    setGoogleDriveForm(nextForm)
    setInitialGoogleDriveSnapshot(serializeGoogleDriveForm(nextForm))
  }, [])

  const loadGoogleDriveSettings = useCallback(async (showSuccessMessage = false, showLoadingSpinner = true) => {
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
      applyGoogleDriveSettings(createEmptyGoogleDriveForm())

      if (![404, 501].includes(err.response?.status)) {
        const detail = err.response?.data?.message || 'Could not load your Google Drive settings right now.'
        toast.current?.show({ severity: 'error', summary: 'Error', detail })
      }
    } finally {
      setLoadingGoogleDrive(false)
    }
  }, [applyGoogleDriveSettings])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      loadGoogleDriveSettings(false, false).catch(() => null)
    }, 0)

    return () => {
      window.clearTimeout(loadTimer)
    }
  }, [loadGoogleDriveSettings])

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

  const setGoogleDriveField = (key, value) => {
    setGoogleDriveForm((current) => ({ ...current, [key]: value }))
  }

  const updateResumeRow = (clientId, key, value) => {
    setGoogleDriveForm((current) => ({
      ...current,
      resumes: current.resumes.map((resume) =>
        resume.clientId === clientId ? { ...resume, [key]: value } : resume
      ),
    }))
  }

  const addResumeRow = () => {
    setGoogleDriveForm((current) => ({
      ...current,
      resumes: [...current.resumes, createResumeRow()],
    }))
  }

  const removeResumeRow = (clientId) => {
    setGoogleDriveForm((current) => {
      if (current.resumes.length === 1) {
        return current
      }

      const resumes = current.resumes.filter((resume) => resume.clientId !== clientId)

      if (!resumes.some((resume) => resume.isDefault) && resumes[0]) {
        resumes[0] = { ...resumes[0], isDefault: true }
      }

      return {
        ...current,
        resumes,
      }
    })
  }

  const setDefaultResume = (clientId) => {
    setGoogleDriveForm((current) => ({
      ...current,
      resumes: current.resumes.map((resume) => ({
        ...resume,
        isDefault: resume.clientId === clientId,
      })),
    }))
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
          setGoogleDriveForm((current) => ({
            ...current,
            connected: false,
            accountEmail: '',
            accountDisplayName: '',
          }))
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

  const handleGoogleDriveSubmit = async (e) => {
    e.preventDefault()

    const baseFolderInput = googleDriveForm.baseFolderInput.trim()
    const baseFolderId = extractGoogleDriveFolderId(baseFolderInput)

    if (!baseFolderInput || !baseFolderId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Please provide a valid Google Drive folder URL or folder ID.',
      })
      return
    }

    const enteredResumes = googleDriveForm.resumes.filter(
      (resume) => resume.name.trim() || resume.documentInput.trim()
    )

    if (!enteredResumes.length) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Add at least one base resume before saving.',
      })
      return
    }

    const normalizedResumes = []

    for (const resume of enteredResumes) {
      const name = resume.name.trim()
      const documentInput = resume.documentInput.trim()
      const documentId = extractGoogleDocId(documentInput)

      if (!name || !documentInput) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validation',
          detail: 'Each base resume needs a name and a Google Docs URL or document ID.',
        })
        return
      }

      if (!documentId) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Validation',
          detail: 'One of the base resumes has an invalid Google Docs URL or document ID.',
        })
        return
      }

      normalizedResumes.push({
        id: resume.id ?? undefined,
        name,
        documentId,
        isDefault: resume.isDefault,
      })
    }

    const defaultIndex = normalizedResumes.findIndex((resume) => resume.isDefault)
    const selectedDefaultIndex = defaultIndex >= 0 ? defaultIndex : 0
    const payload = {
      baseFolderId,
      baseResumes: normalizedResumes.map((resume, index) => ({
        ...(resume.id ? { id: resume.id } : {}),
        name: resume.name,
        documentId: resume.documentId,
        isDefault: index === selectedDefaultIndex,
      })),
    }

    setSavingGoogleDrive(true)

    try {
      const response = await updateGoogleDriveSettings(payload)
      applyGoogleDriveSettings(response.data)
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Google Drive settings saved successfully.',
      })
    } catch (err) {
      const detail = err.response?.data?.message || 'Could not save your Google Drive settings.'
      toast.current?.show({ severity: 'error', summary: 'Error', detail })
    } finally {
      setSavingGoogleDrive(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your personal information, Google Drive resumes and account password</p>
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Google Drive Resumes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Connect Google Drive, set your base folder and manage one or more base Google Docs resumes.
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
              label={googleDriveForm.connected ? 'Reconnect Google' : 'Connect Google'}
              icon="pi pi-link"
              onClick={handleConnectGoogleDrive}
              loading={connectingGoogleDrive}
            />
            {googleDriveForm.connected && (
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

        <div className="mt-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Connection status</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {loadingGoogleDrive
                  ? 'Checking your Google Drive connection...'
                  : googleDriveForm.connected
                    ? `${googleDriveForm.accountDisplayName || 'Google account'}${googleDriveForm.accountEmail ? ` • ${googleDriveForm.accountEmail}` : ''}`
                    : 'No Google Drive account connected yet.'}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                googleDriveForm.connected
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {googleDriveForm.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <form onSubmit={handleGoogleDriveSubmit} className="space-y-5 mt-5">
          <div className="space-y-1">
            <label htmlFor="googleDriveBaseFolder" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Base Drive Folder
            </label>
            <InputText
              id="googleDriveBaseFolder"
              value={googleDriveForm.baseFolderInput}
              onChange={(e) => setGoogleDriveField('baseFolderInput', e.target.value)}
              className="w-full"
              placeholder="Paste a Google Drive folder URL or folder ID"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Resume copies will be created inside this Drive folder.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Base resumes</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add one or more Google Docs templates and choose which one is the default.
                </p>
              </div>
              <Button type="button" label="Add Resume" icon="pi pi-plus" outlined onClick={addResumeRow} />
            </div>

            {googleDriveForm.resumes.map((resume, index) => (
              <div
                key={resume.clientId}
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Resume name
                    </label>
                    <InputText
                      value={resume.name}
                      onChange={(e) => updateResumeRow(resume.clientId, 'name', e.target.value)}
                      className="w-full"
                      placeholder={`Base Resume ${index + 1}`}
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Google Docs URL or ID
                    </label>
                    <InputText
                      value={resume.documentInput}
                      onChange={(e) => updateResumeRow(resume.clientId, 'documentInput', e.target.value)}
                      className="w-full"
                      placeholder="https://docs.google.com/document/d/..."
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    label={resume.isDefault ? 'Default Resume' : 'Set as Default'}
                    icon={resume.isDefault ? 'pi pi-check-circle' : 'pi pi-star'}
                    outlined={!resume.isDefault}
                    severity={resume.isDefault ? 'success' : undefined}
                    onClick={() => setDefaultResume(resume.clientId)}
                  />
                  <Button
                    type="button"
                    label="Remove"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    disabled={googleDriveForm.resumes.length === 1}
                    onClick={() => removeResumeRow(resume.clientId)}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" label="Save Google Drive Settings" loading={savingGoogleDrive} />
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
