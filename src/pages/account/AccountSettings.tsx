import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Page, PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { ErrorNote, Spinner } from '@/components/ui/feedback'
import { useAsync } from '@/hooks/useAsync'
import { changePassword, updateProfile } from '@/api/auth'
import { getGoogleDriveStatus, type GoogleDriveStatus } from '@/api/resumes'
import { useAuthStore } from '@/store/authStore'

function SetCard({
  title,
  sub,
  danger,
  children,
}: {
  title: string
  sub?: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`mb-4 rounded border ${danger ? 'border-[#e0d4d4]' : 'border-mono-e5'}`}>
      <div className="px-[18px] pb-3.5 pt-4">
        <div className="text-[14.5px] font-semibold">{title}</div>
        {sub && <div className="mt-0.5 text-[12.5px] text-mono-9">{sub}</div>}
      </div>
      <hr className="border-mono-e5" />
      <div className="p-[18px]">{children}</div>
    </div>
  )
}

function ProfileSection() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm({
    defaultValues: { name: user?.name ?? '', reminderTime: user?.reminderTime ?? '09:00' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    setSaved(false)
    try {
      const updated = await updateProfile({ name: values.name, reminderTime: values.reminderTime || undefined })
      setUser(updated)
      setSaved(true)
    } catch {
      setError('Could not save your profile.')
    }
  })

  return (
    <SetCard title="Profile" sub="How you appear across the app">
      <form onSubmit={onSubmit}>
        {error && (
          <div className="mb-4">
            <ErrorNote message={error} />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name">
            <Input id="name" {...register('name')} />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" className="mono" value={user?.email ?? ''} readOnly disabled />
          </Field>
          <Field label="Preferred reminder time" htmlFor="reminderTime">
            <Input id="reminderTime" className="mono" type="time" {...register('reminderTime')} />
          </Field>
        </div>
        <div className="mt-[18px] flex items-center justify-end gap-3">
          {saved && <span className="font-mono text-[11px] text-mono-9">Saved ✓</span>}
          <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? <Spinner className="border-white/40 border-t-white" /> : 'Save profile'}
          </Button>
        </div>
      </form>
    </SetCard>
  )
}

function PasswordSection() {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    setDone(false)
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      setDone(true)
      reset()
    } catch {
      setError('Could not update your password.')
    }
  })

  return (
    <SetCard title="Change Password">
      <form onSubmit={onSubmit}>
        {error && (
          <div className="mb-4">
            <ErrorNote message={error} />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Current password" full htmlFor="currentPassword" error={errors.currentPassword?.message}>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...register('currentPassword', { required: 'Required' })}
            />
          </Field>
          <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register('newPassword', {
                required: 'Required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
            />
          </Field>
          <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword', {
                validate: (v) => v === watch('newPassword') || 'Passwords do not match',
              })}
            />
          </Field>
        </div>
        <div className="mt-[18px] flex items-center justify-end gap-3">
          {done && <span className="font-mono text-[11px] text-mono-9">Updated ✓</span>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : 'Update password'}
          </Button>
        </div>
      </form>
    </SetCard>
  )
}

function GoogleDriveSection() {
  const { data, loading } = useAsync<GoogleDriveStatus>(
    () => getGoogleDriveStatus().catch(() => ({ connected: false })),
    [],
  )
  const connected = data?.connected

  return (
    <SetCard title="Google Drive" sub="Store generated resumes in your Drive">
      <div className="flex items-center gap-3.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded border border-mono-e5 text-mono-5">▲</div>
        <div className="flex-1">
          <div className="text-[13.5px] font-medium">
            {loading ? 'Checking…' : connected ? `Connected as ${data?.email ?? 'your account'}` : 'Not connected'}
          </div>
          <div className="mono text-xs text-mono-9">
            {connected
              ? `${data?.rootFolderName ?? 'Applywell'} · ${data?.fileCount ?? 0} files`
              : 'Connect to enable resume generation'}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-mono-e5 px-2.5 py-[3px] font-mono text-xs text-mono-2">
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-mono-1' : 'bg-mono-c'}`} />
          {connected ? 'Connected' : 'Offline'}
        </span>
        <Button size="sm">{connected ? 'Disconnect' : 'Connect'}</Button>
      </div>
    </SetCard>
  )
}

export default function AccountSettings() {
  const logout = useAuthStore((s) => s.logout)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <Page>
      <PageHeader title="Account Settings" sub="Profile, security, and integrations" />
      <div className="max-w-settings">
        <ProfileSection />
        <PasswordSection />

        <SetCard title="Passkeys" sub="Sign in without a password">
          <div className="flex items-center gap-3 py-2.5">
            <div className="grid h-10 w-10 place-items-center rounded border border-mono-e5 text-mono-5">⌘</div>
            <div className="flex-1 text-[13px] text-mono-9">No passkeys registered yet.</div>
            <Button size="sm">+ Add a passkey</Button>
          </div>
        </SetCard>

        <GoogleDriveSection />

        <SetCard title="Danger Zone" sub="Irreversible and destructive actions" danger>
          <div className="flex items-center gap-3.5">
            <div className="flex-1">
              <div className="text-[13.5px] font-medium">Delete account</div>
              <div className="text-xs text-mono-9">
                Permanently remove your account, applications, and history.
              </div>
            </div>
            <Button
              onClick={() => setConfirmDelete(true)}
              className="border-[#d8c4c4] text-danger hover:bg-[#fcf7f7]"
            >
              Delete account
            </Button>
          </div>
        </SetCard>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        message="This will sign you out. Account deletion is processed by support — contact us to complete the request."
        confirmLabel="Sign out"
        destructive
        onConfirm={() => {
          setConfirmDelete(false)
          logout()
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </Page>
  )
}
