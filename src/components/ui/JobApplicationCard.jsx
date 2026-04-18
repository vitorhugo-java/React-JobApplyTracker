import React from 'react'
import { Eye, Edit, Trash2, Check, X } from 'lucide-react'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import StatusBadge from './StatusBadge'
import { getVacancyLabel } from '../../utils/applicationDisplay'
import { TO_SEND_LATER_STATUS } from '../../api/applications'

const btnBase =
  'inline-flex items-center justify-center rounded-lg border-0 bg-transparent text-gray-400 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:hover:bg-gray-700'

const JobApplicationCard = ({
  app,
  editingId,
  editDraft,
  savingId,
  editStatusOptions,
  onView,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onEditDraftChange,
}) => {
  const isEditing = editingId === app.id
  const date = app.applicationDate
    ? new Date(app.applicationDate).toLocaleDateString('pt-BR')
    : null
  const nextStep = app.nextStepDateTime
    ? new Date(app.nextStepDateTime).toLocaleString('pt-BR')
    : null

  return (
    <div
      className={`p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
        !isEditing ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30' : ''
      }`}
      onClick={() => { if (!isEditing) onView() }}
      data-testid="app-row"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <Dropdown
                value={editDraft?.status ?? TO_SEND_LATER_STATUS}
                options={editStatusOptions}
                onChange={(e) => onEditDraftChange({ status: e.value })}
                className="w-full"
                data-testid="inline-edit-status"
              />
            ) : (
              <StatusBadge status={app.status || TO_SEND_LATER_STATUS} />
            )}
          </div>
          {date && (
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{date}</span>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <InputText
              value={editDraft?.vacancyName ?? ''}
              onChange={(e) => onEditDraftChange({ vacancyName: e.target.value })}
              className="w-full"
              data-testid="inline-edit-vacancy"
            />
          ) : (
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {getVacancyLabel(app.vacancyName)}
            </p>
          )}
        </div>

        {(app.recruiterName || isEditing) && (
          <div onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <InputText
                value={editDraft?.recruiterName ?? ''}
                onChange={(e) => onEditDraftChange({ recruiterName: e.target.value })}
                className="w-full"
                data-testid="inline-edit-recruiter"
              />
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">{app.recruiterName}</p>
            )}
          </div>
        )}

        {nextStep && !isEditing && (
          <p className="text-xs text-gray-500 dark:text-gray-400">Next step: {nextStep}</p>
        )}

        <div
          className="flex items-center justify-around pt-2 border-t border-gray-100 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onView}
            className={`${btnBase} h-11 w-11 hover:text-gray-600 dark:hover:text-gray-200`}
            aria-label="View application"
          >
            <Eye className="w-5 h-5" />
          </button>

          {isEditing ? (
            <>
              <button
                type="button"
                onClick={onSaveEdit}
                disabled={savingId === app.id}
                className={`${btnBase} h-11 w-11 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50`}
                aria-label="Save"
                data-testid="inline-save"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={savingId === app.id}
                className={`${btnBase} h-11 w-11 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50`}
                aria-label="Cancel"
                data-testid="inline-cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onStartEdit}
              className={`${btnBase} h-11 w-11 hover:text-indigo-600 dark:hover:text-indigo-400`}
              aria-label="Edit application inline"
              data-testid="inline-edit"
            >
              <Edit className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            className={`${btnBase} h-11 w-11 hover:text-red-600 dark:hover:text-red-400`}
            aria-label="Delete application"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default JobApplicationCard
