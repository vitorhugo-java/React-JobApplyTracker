import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost'
  size?: 'md' | 'sm'
}

const VARIANT: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: '',
  primary: 'btn-primary',
  ghost: 'btn-ghost',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn('btn', VARIANT[variant], size === 'sm' && 'btn-sm', className)}
      {...props}
    />
  )
})
