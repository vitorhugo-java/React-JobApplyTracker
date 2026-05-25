import React, { useCallback } from 'react'
import { buildMailtoUrl, isEmailAddress, openEmailCompose, normalizeEmailAddress } from '../../utils/externalLinks'

const defaultLinkClasses = 'underline decoration-dotted underline-offset-2 hover:text-indigo-600 dark:hover:text-indigo-400'

const RecruiterNameLink = ({
  recruiterName,
  className = '',
  linkClassName = '',
  fallback = null,
}) => {
  const normalizedRecruiterName = normalizeEmailAddress(recruiterName)

  const handleClick = useCallback((event) => {
    event.stopPropagation()

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    openEmailCompose(normalizedRecruiterName)
  }, [normalizedRecruiterName])

  if (!normalizedRecruiterName) {
    if (fallback == null) {
      return null
    }

    return typeof fallback === 'string'
      ? <span className={className}>{fallback}</span>
      : fallback
  }

  if (!isEmailAddress(normalizedRecruiterName)) {
    return <span className={className}>{normalizedRecruiterName}</span>
  }

  const resolvedLinkClassName = linkClassName || [className, defaultLinkClasses].filter(Boolean).join(' ')

  return (
    <a
      href={buildMailtoUrl(normalizedRecruiterName)}
      className={resolvedLinkClassName}
      onClick={handleClick}
    >
      {normalizedRecruiterName}
    </a>
  )
}

export default RecruiterNameLink
