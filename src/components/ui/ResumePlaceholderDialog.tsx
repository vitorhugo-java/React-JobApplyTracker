import React, { useEffect, useId, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { ScrollPanel } from 'primereact/scrollpanel'
import { Skeleton } from 'primereact/skeleton'

export type ResumePlaceholderDialogProps = {
  visible: boolean
  placeholders: string[]
  initialValues: Record<string, string>
  onSubmit: (data: Record<string, string>) => void
  onClose: () => void
}

const STORAGE_KEY = 'job-tracker.resume-placeholder-values'
const LONG_FIELD_PATTERN = /(summary|skills|project|highlight|experience|description|profile|custom|responsibilities|achievements)/i

const readStoredValues = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    return rawValue ? JSON.parse(rawValue) : {}
  } catch {
    return {}
  }
}

const saveStoredValues = (values: Record<string, string>) => {
  if (typeof window === 'undefined') {
    return
  }

  const currentValues = readStoredValues()
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...currentValues, ...values }))
}

const createDefaultValues = (
  placeholders: string[],
  initialValues: Record<string, string>
): Record<string, string> => {
  const storedValues = readStoredValues()
  return placeholders.reduce<Record<string, string>>((values, placeholder) => {
    values[placeholder] = initialValues[placeholder] ?? storedValues[placeholder] ?? ''
    return values
  }, {})
}

const formatPlaceholderLabel = (placeholder: string) =>
  placeholder
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const shouldUseTextarea = (placeholder: string, value = '') =>
  LONG_FIELD_PATTERN.test(placeholder) || value.length > 80

const createFieldId = (formId: string, placeholder: string) =>
  `${formId}-${placeholder}`.replace(/[^A-Za-z0-9_-]/g, '-')

const ResumePlaceholderDialog = ({
  visible,
  placeholders,
  initialValues,
  onSubmit,
  onClose,
}: ResumePlaceholderDialogProps) => {
  const formId = useId()
  const defaultValues = useMemo(
    () => createDefaultValues(placeholders, initialValues),
    [initialValues, placeholders]
  )

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm<Record<string, string>>({
    defaultValues,
    mode: 'onBlur',
  })

  const watchedValues = watch()

  useEffect(() => {
    if (visible) {
      reset(defaultValues)
    }
  }, [defaultValues, reset, visible])

  useEffect(() => {
    if (!visible) {
      return
    }

    const timeoutId = window.setTimeout(() => saveStoredValues(watchedValues), 350)
    return () => window.clearTimeout(timeoutId)
  }, [visible, watchedValues])

  const submitValues = handleSubmit(async (data) => {
    saveStoredValues(data)
    await Promise.resolve(onSubmit(data))
  })

  const footer = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        label="Cancel"
        icon="pi pi-times"
        outlined
        onClick={onClose}
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        form={formId}
        label="Generate resume"
        icon="pi pi-file-pdf"
        loading={isSubmitting}
      />
    </div>
  )

  return (
    <Dialog
      visible={visible}
      header="Resume placeholders"
      modal
      blockScroll
      draggable={false}
      className="mx-3 w-[calc(100vw-1.5rem)] max-w-2xl"
      contentClassName="p-0"
      footer={footer}
      onHide={onClose}
    >
      <form id={formId} onSubmit={submitValues} className="space-y-4 p-4 sm:p-5">
        {isSubmitting && (
          <div className="space-y-2">
            <Skeleton height="1rem" width="60%" />
            <Skeleton height="5rem" />
          </div>
        )}

        {!placeholders.length ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            No placeholders were found in this template. You can generate the resume without custom values.
          </div>
        ) : (
          <ScrollPanel className="h-[60vh] max-h-[34rem] pr-3">
            <div className="space-y-4">
              {placeholders.map((placeholder) => {
                const fieldError = errors[placeholder]
                const currentValue = watchedValues[placeholder] ?? ''
                const label = formatPlaceholderLabel(placeholder)
                const useTextarea = shouldUseTextarea(placeholder, currentValue)
                const fieldId = createFieldId(formId, placeholder)

                return (
                  <div key={placeholder} className="space-y-2">
                    <label
                      htmlFor={fieldId}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      {label}
                    </label>
                    <Controller
                      name={placeholder}
                      control={control}
                      rules={{
                        validate: (value) =>
                          value.trim().length > 0 || `${label} is required`,
                        maxLength: {
                          value: 5000,
                          message: `${label} must be 5000 characters or fewer`,
                        },
                      }}
                      render={({ field }) =>
                        useTextarea ? (
                          <InputTextarea
                            id={fieldId}
                            {...field}
                            value={field.value ?? ''}
                            rows={5}
                            autoResize
                            className={`w-full ${fieldError ? 'p-invalid' : ''}`}
                            placeholder={`Enter ${label.toLowerCase()}`}
                            disabled={isSubmitting}
                          />
                        ) : (
                          <InputText
                            id={fieldId}
                            {...field}
                            value={field.value ?? ''}
                            className={`w-full ${fieldError ? 'p-invalid' : ''}`}
                            placeholder={`Enter ${label.toLowerCase()}`}
                            disabled={isSubmitting}
                          />
                        )
                      }
                    />
                    {fieldError?.message && (
                      <small className="block text-red-600 dark:text-red-400">
                        {fieldError.message}
                      </small>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollPanel>
        )}
      </form>
    </Dialog>
  )
}

export default ResumePlaceholderDialog
