import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  required?: boolean
  hint?: string
  error?: string
  full?: boolean
  htmlFor?: string
  children: ReactNode
}

export function Field({ label, required, hint, error, full, htmlFor, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', full && 'col-span-full')}>
      <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-mono-2">
        {label}
        {required && <span className="text-mono-9"> *</span>}
      </label>
      {children}
      {error ? (
        <span className="text-[11px] text-danger">{error}</span>
      ) : hint ? (
        <span className="font-mono text-[10.5px] text-mono-9">{hint}</span>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn('field-input', className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn('field-select', className)} {...props} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn('field-input', className)} {...props} />
  },
)
