import api from './axios'
import { buildGoogleDocUrl, buildGoogleDriveFolderUrl } from '../utils/googleDrive'

const normalizeBaseResume = (resume, index) => {
  const documentId = resume?.documentId ?? resume?.googleDocId ?? resume?.googleFileId ?? ''

  return {
    id: resume?.id ?? null,
    documentName: resume?.documentName ?? resume?.name ?? resume?.label ?? `Resume ${index + 1}`,
    documentId,
    documentUrl:
      resume?.documentUrl ?? resume?.googleDocUrl ?? resume?.webViewLink ?? buildGoogleDocUrl(documentId),
    createdAt: resume?.createdAt ?? null,
  }
}

export const normalizeGoogleDriveSettings = (data = {}) => {
  const baseFolderId = data.baseFolderId ?? data.baseDriveFolderId ?? data.folderId ?? data.rootFolderId ?? ''
  const connection = data.connection ?? {}

  return {
    configured: Boolean(data.configured ?? data.available ?? true),
    connected: Boolean(
      data.connected ??
        data.isConnected ??
        connection.connected ??
        connection.isConnected
    ),
    accountEmail: data.accountEmail ?? data.googleEmail ?? connection.accountEmail ?? connection.email ?? '',
    accountDisplayName: data.accountDisplayName ?? data.googleDisplayName ?? connection.accountDisplayName ?? connection.displayName ?? '',
    accountId: data.accountId ?? data.googleAccountId ?? connection.accountId ?? '',
    baseFolderId,
    baseFolderName: data.baseFolderName ?? data.rootFolderName ?? data.folderName ?? '',
    baseFolderUrl: data.baseFolderUrl ?? data.folderUrl ?? buildGoogleDriveFolderUrl(baseFolderId),
    connectedAt: data.connectedAt ?? connection.connectedAt ?? null,
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

export const updateGoogleDriveRootFolder = async (folderIdOrUrl) => {
  const response = await api.put('/google-drive/root-folder', {
    folderIdOrUrl,
  })

  return {
    ...response,
    data: normalizeGoogleDriveSettings(response.data),
  }
}

export const addGoogleDriveBaseResume = async (documentIdOrUrl) => {
  const response = await api.post('/google-drive/base-resumes', {
    documentIdOrUrl,
  })

  return {
    ...response,
    data: normalizeBaseResume(response.data, 0),
  }
}

export const deleteGoogleDriveBaseResume = (baseResumeId) =>
  api.delete(`/google-drive/base-resumes/${baseResumeId}`)

export const refreshGoogleDriveSettings = async () => {
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
      vacancyFolderUrl: response.data?.vacancyFolderUrl ?? response.data?.vacancyFolderWebViewLink ?? '',
      generatedAt: response.data?.generatedAt ?? response.data?.createdAt ?? null,
    },
  }
}

const normalizeResumeGenerationResponse = (data = {}) => ({
  ...data,
  googleDocUrl: data.documentWebViewLink ?? data.googleDocUrl ?? data.documentUrl ?? '',
  pdfUrl: data.pdfWebViewLink ?? data.pdfUrl ?? '',
  vacancyFolderUrl: data.vacancyFolderWebViewLink ?? data.vacancyFolderUrl ?? '',
  generatedAt: data.generatedAt ?? data.createdAt ?? null,
  placeholders: data.placeholders ?? [],
  values: data.values ?? {},
})

export const detectResumePlaceholders = async (baseResumeId) => {
  const response = await api.post('/google-drive/resume-placeholders', {
    baseResumeId,
    values: {},
  })
  return {
    ...response,
    data: normalizeResumeGenerationResponse(response.data),
  }
}

export const generateGoogleDriveResume = async (payload) => {
  const response = await api.post(
    `/google-drive/applications/${payload.applicationId}/generated-resumes`,
    {
      baseResumeId: payload.baseResumeId,
      values: payload.values ?? {},
    }
  )
  return {
    ...response,
    data: normalizeResumeGenerationResponse(response.data),
  }
}
