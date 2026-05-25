const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

export const normalizeEmailAddress = (value) => (
  typeof value === 'string' ? value.trim() : ''
)

export const isEmailAddress = (value) => EMAIL_ADDRESS_PATTERN.test(normalizeEmailAddress(value))

export const buildMailtoUrl = (email) => {
  const normalizedEmail = normalizeEmailAddress(email)
  return normalizedEmail ? `mailto:${normalizedEmail}` : ''
}

export const buildGmailComposeUrl = (email) => {
  const normalizedEmail = normalizeEmailAddress(email)
  return normalizedEmail
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(normalizedEmail)}`
    : ''
}

export const openExternalUrl = (url) => {
  if (typeof window === 'undefined' || !url) {
    return null
  }

  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer')

  if (openedWindow) {
    openedWindow.opener = null
  }

  return openedWindow
}

export const openEmailCompose = (email) => {
  if (typeof window === 'undefined') {
    return null
  }

  const normalizedEmail = normalizeEmailAddress(email)

  if (!isEmailAddress(normalizedEmail)) {
    return null
  }

  const openedWindow = openExternalUrl(buildGmailComposeUrl(normalizedEmail))

  if (openedWindow) {
    return openedWindow
  }

  window.location.assign(buildMailtoUrl(normalizedEmail))
  return null
}

export const openPendingTab = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const openedWindow = window.open('', '_blank', 'noopener,noreferrer')

  if (openedWindow) {
    openedWindow.opener = null
  }

  return openedWindow
}

export const navigateOpenedTab = (openedWindow, url) => {
  if (!url) {
    return
  }

  if (openedWindow && !openedWindow.closed) {
    openedWindow.location.replace(url)
    return
  }

  openExternalUrl(url)
}
