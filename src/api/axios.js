import axios from 'axios'
import useAuthStore from '../store/authStore'
import logger from '../utils/logger'
import {
  enqueueRequest,
  flushOfflineQueue,
  shouldQueueRequest,
} from './offlineQueue'

const configuredApiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
const normalizedApiBase = configuredApiBase
  ? configuredApiBase.replace(/\/+$/, '')
  : 'http://localhost:8080'
const API_BASE_URL = normalizedApiBase.endsWith('/api/v1')
  ? normalizedApiBase
  : normalizedApiBase.endsWith('/api')
    ? `${normalizedApiBase}/v1`
    : `${normalizedApiBase}/api/v1`
const AUTH_FAILURE_STATUSES = new Set([401, 403])
const REFRESH_ENDPOINT = '/auth/refresh'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

const createQueuedOfflineResponse = (config, queuedItem) => ({
  data: {
    queuedOffline: true,
    queuedAt: queuedItem.createdAt,
  },
  status: 202,
  statusText: 'Queued Offline',
  headers: {},
  config,
  request: null,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config._startTime = performance.now()
  return config
})

let refreshPromise = null

const processQueue = (error, token = null) => {
  // Queue is now handled by the refreshPromise pattern
}

api.interceptors.response.use(
  (response) => {
    if (response.config._startTime) {
      const elapsed = Math.round(performance.now() - response.config._startTime)
      logger.info(`API ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        durationMs: elapsed,
      })
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Log API errors
    if (!error.response) {
      // Network error / backend down
      if (shouldQueueRequest(originalRequest)) {
        const queuedItem = enqueueRequest(originalRequest)
        return Promise.resolve(createQueuedOfflineResponse(originalRequest, queuedItem))
      }
      logger.error('Backend unreachable', { url: originalRequest?.url, message: error.message })
      return Promise.reject(error)
    }

    logger.apiError(originalRequest?.url, error)

    if (AUTH_FAILURE_STATUSES.has(error.response?.status) && !originalRequest._retry) {
      // If the refresh endpoint itself returned an auth failure, bail out immediately
      // to prevent a recursive refresh loop. Clear the session and let ProtectedRoute
      // handle the redirect to /login.
      if (originalRequest.url === REFRESH_ENDPOINT) {
        const { logout } = useAuthStore.getState()
        refreshPromise = null
        logout()
        return Promise.reject(error)
      }

      // Use promise-based locking to ensure only one refresh happens concurrently
      if (!refreshPromise) {
        originalRequest._retry = true
        const { setTokens, logout } = useAuthStore.getState()

        refreshPromise = (async () => {
          try {
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              {},
              { withCredentials: true }
            )
            const { accessToken: newAccess } = response.data
            setTokens(newAccess)
            return newAccess
          } catch (refreshError) {
            const status = refreshError.response?.status
            logger.authFailure('Token refresh failed')

            // Keep session on transient failures (backend restart / network issues).
            // Clear session only when refresh token is definitively invalid.
            // Use logout() + let ProtectedRoute redirect; avoid window.location.href
            // which would trigger a full reload and restart the loop.
            if (AUTH_FAILURE_STATUSES.has(status)) {
              logout()
            }
            throw refreshError
          } finally {
            refreshPromise = null
          }
        })()
      }

      // Wait for refresh to complete, then retry the original request
      return refreshPromise
        .then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    return Promise.reject(error)
  }
)

const initOfflineQueueSync = () => {
  if (typeof window === 'undefined') return

  if (window.__JOBTRACKER_OFFLINE_QUEUE_INIT__) return
  window.__JOBTRACKER_OFFLINE_QUEUE_INIT__ = true

  window.addEventListener('online', () => {
    flushOfflineQueue(api)
      .then(({ processed, remaining }) => {
        if (processed > 0) {
          logger.info('Offline queue flushed successfully', { processed, remaining })
        }
      })
      .catch((err) => {
        logger.error('Failed to flush offline queue', { message: err?.message })
      })
  })

  flushOfflineQueue(api).catch((err) => {
    logger.error('Initial offline queue flush failed', { message: err?.message })
  })
}

initOfflineQueueSync()

export default api
