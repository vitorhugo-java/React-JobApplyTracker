import axios from 'axios'
import useAuthStore from '../store/authStore'
import logger from '../utils/logger'
import {
  enqueueRequest,
  flushOfflineQueue,
  shouldQueueRequest,
} from './offlineQueue'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const AUTH_FAILURE_STATUSES = new Set([401, 403])

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
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

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
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
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const { refreshToken, setTokens, logout } = useAuthStore.getState()

      if (!refreshToken) {
        logger.authFailure('No refresh token available')
        logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          { refreshToken }
        )
        const { accessToken: newAccess, refreshToken: newRefresh } =
          response.data
        setTokens(newAccess, newRefresh)
        processQueue(null, newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (refreshError) {
        const status = refreshError.response?.status
        logger.authFailure('Token refresh failed')
        processQueue(refreshError, null)

        // Keep session on transient failures (backend restart / network issues).
        // Clear session only when refresh token is definitively invalid.
        if (AUTH_FAILURE_STATUSES.has(status)) {
          logout()
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
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
