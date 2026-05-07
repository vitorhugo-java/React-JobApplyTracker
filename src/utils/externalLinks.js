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
