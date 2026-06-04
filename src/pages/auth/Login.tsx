import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { ErrorNote, Spinner } from '@/components/ui/feedback'
import { useAuthStore } from '@/store/authStore'
import { AuthShell, authErrorMessage } from './AuthShell'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ defaultValues: { email: '', password: '' } })

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      const { accessToken, user } = await login(values)
      setSession(accessToken, user)
      navigate(from, { replace: true })
    } catch (error) {
      setSubmitError(authErrorMessage(error, 'Invalid email or password.'))
    }
  })

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back — let's get to your pipeline."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-mono-1 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {submitError && <ErrorNote message={submitError} />}

        <Field label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register('email', { required: 'Email is required' })}
          />
        </Field>

        <Field label="Password" htmlFor="password" required error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register('password', { required: 'Password is required' })}
          />
        </Field>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-[12.5px] text-mono-9 hover:text-mono-1">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" disabled={isSubmitting} className="justify-center">
          {isSubmitting ? <Spinner className="border-white/40 border-t-white" /> : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}
