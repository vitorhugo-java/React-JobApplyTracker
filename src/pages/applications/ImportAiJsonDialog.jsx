import React from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import { getAiJsonExample } from './useImportAiJson'

const ImportAiJsonDialog = ({
  visible,
  value,
  error,
  loading,
  onChange,
  onHide,
  onImport,
}) => {
  const footer = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        label="Cancel"
        icon="pi pi-times"
        outlined
        onClick={onHide}
        disabled={loading}
      />
      <Button
        type="button"
        label="Import"
        icon="pi pi-download"
        onClick={onImport}
        loading={loading}
        data-testid="import-ai-json-confirm"
      />
    </div>
  )

  return (
    <Dialog
      visible={visible}
      header="Import AI JSON"
      modal
      blockScroll
      draggable={false}
      className="mx-3 w-[calc(100vw-1.5rem)] max-w-2xl"
      contentClassName="p-0"
      footer={footer}
      onHide={onHide}
    >
      <div className="space-y-3 p-4 sm:p-5">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Paste raw JSON or markdown code block output from AI.
        </p>

        <InputTextarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          autoResize
          className={`w-full font-mono text-sm ${error ? 'p-invalid' : ''}`}
          placeholder={getAiJsonExample()}
          data-testid="import-ai-json-input"
          disabled={loading}
        />

        {error && (
          <small className="block text-red-600 dark:text-red-400" data-testid="import-ai-json-error">
            {error}
          </small>
        )}
      </div>
    </Dialog>
  )
}

export default ImportAiJsonDialog
