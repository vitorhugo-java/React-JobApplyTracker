import { api, unwrap } from '@/lib/api'
import type { BaseResume } from '@/types'

export const getBaseResumes = () =>
  unwrap(api.get<BaseResume[]>('/google-drive/base-resumes'))

export interface GoogleDriveStatus {
  connected: boolean
  email?: string
  rootFolderName?: string
  fileCount?: number
  lastSyncedAt?: string
}

export const getGoogleDriveStatus = () =>
  unwrap(api.get<GoogleDriveStatus>('/google-drive/status'))
