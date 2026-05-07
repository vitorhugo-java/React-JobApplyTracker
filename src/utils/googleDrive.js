export const GOOGLE_DRIVE_GEMINI_URL = 'https://gemini.google.com/gem/f8ed7c14b062'

const GOOGLE_DOC_URL_PREFIX = 'https://docs.google.com/document/d/'
const GOOGLE_DRIVE_FOLDER_URL_PREFIX = 'https://drive.google.com/drive/folders/'
const ID_PATTERN = /^[A-Za-z0-9_-]{20,}$/

const extractGoogleResourceId = (value, matchers) => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  for (const matcher of matchers) {
    const match = trimmedValue.match(matcher)
    if (match?.[1]) {
      return match[1]
    }
  }

  return ID_PATTERN.test(trimmedValue) ? trimmedValue : null
}

export const extractGoogleDocId = (value) =>
  extractGoogleResourceId(value, [
    /docs\.google\.com\/document\/u\/\d+\/d\/([A-Za-z0-9_-]+)/i,
    /docs\.google\.com\/document\/d\/([A-Za-z0-9_-]+)/i,
  ])

export const extractGoogleDriveFolderId = (value) =>
  extractGoogleResourceId(value, [
    /drive\.google\.com\/drive\/folders\/([A-Za-z0-9_-]+)/i,
  ])

export const buildGoogleDocUrl = (documentId) =>
  documentId ? `${GOOGLE_DOC_URL_PREFIX}${documentId}/edit` : ''

export const buildGoogleDriveFolderUrl = (folderId) =>
  folderId ? `${GOOGLE_DRIVE_FOLDER_URL_PREFIX}${folderId}` : ''
