import api from './axios'
import { buildGoogleDocUrl, buildGoogleDriveFolderUrl } from '../utils/googleDrive'

const normalizeBaseResume = (resume, index) => {
  const documentId = resume?.documentId ?? resume?.googleDocId ?? resume?.googleFileId ?? ''

  return {
    id: resume?.id ?? `resume-${index + 1}`,
    name: resume?.name ?? resume?.label ?? resume?.documentName ?? `Resume ${index + 1}`,
    documentId,
    documentUrl: resume?.documentUrl ?? resume?.googleDocUrl ?? resume?.webViewLink ?? buildGoogleDocUrl(documentId),
    isDefault: Boolean(resume?.isDefault),
  }
}

export const normalizeGoogleDriveSettings = (data = {}) => {
  const baseFolderId = data.baseFolderId ?? data.baseDriveFolderId ?? data.folderId ?? data.rootFolderId ?? ''
  const connection = data.connection ?? {}

  return {
    connected: Boolean(
      data.connected ??
        data.isConnected ??
        connection.connected ??
        connection.isConnected
    ),
    accountEmail: data.accountEmail ?? data.googleEmail ?? connection.accountEmail ?? connection.email ?? '',
    accountDisplayName: data.accountDisplayName ?? data.googleDisplayName ?? connection.accountDisplayName ?? connection.displayName ?? '',
    baseFolderId,
    baseFolderUrl: data.baseFolderUrl ?? data.folderUrl ?? buildGoogleDriveFolderUrl(baseFolderId),
    baseResumes: (data.baseResumes ?? data.resumes ?? []).map(normalizeBaseResume),
  }
}

export const getGoogleDriveSettings = async () => {
  const response = await api.get('/google-drive/status')
  return {
    ...response,
    data: normalizeGoogleDriveSettings(response.data),
  }
}

export const updateGoogleDriveSettings = async (payload) => {
  await api.put('/google-drive/root-folder', {
    folderIdOrUrl: payload.baseFolderId ?? payload.baseFolderInput ?? '',
  })

  const currentStatusResponse = await api.get('/google-drive/status')
  const currentSettings = normalizeGoogleDriveSettings(currentStatusResponse.data)
  const desiredResumes = payload.baseResumes ?? []

  const existingByDocumentId = new Map(
    currentSettings.baseResumes.map((resume) => [resume.documentId, resume])
  )
  const desiredDocumentIds = new Set(desiredResumes.map((resume) => resume.documentId))

  await Promise.all(
    currentSettings.baseResumes
      .filter((resume) => !desiredDocumentIds.has(resume.documentId))
      .map((resume) => api.delete(`/google-drive/base-resumes/${resume.id}`))
  )

  for (const resume of desiredResumes) {
    if (!existingByDocumentId.has(resume.documentId)) {
      await api.post('/google-drive/base-resumes', {
        documentIdOrUrl: resume.documentId,
      })
    }
  }

  const response = await api.get('/google-drive/status')
  return {
    ...response,
    data: normalizeGoogleDriveSettings(response.data),
  }
}

export const startGoogleDriveConnection = async () => {
  const response = await api.post('/google-drive/oauth/start', {})
  return {
    ...response,
    data: {
      ...response.data,
      authorizationUrl: response.data?.authorizationUrl ?? response.data?.url ?? '',
    },
  }
}

export const disconnectGoogleDriveConnection = () =>
  api.delete('/google-drive/connection')

export const createGoogleDriveResume = async (payload) => {
  const response = await api.post(
    `/google-drive/applications/${payload.applicationId}/resume-copies`,
    {
      baseResumeId: payload.baseResumeId,
    }
  )
  return {
    ...response,
    data: {
      ...response.data,
      googleDocUrl: response.data?.googleDocUrl ?? response.data?.documentWebViewLink ?? response.data?.documentUrl ?? response.data?.url ?? '',
    },
  }
}
