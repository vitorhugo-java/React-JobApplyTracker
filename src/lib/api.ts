import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/store/authStore'

/**
 * Resolve the API base URL. The backend serves everything under `/api/v1`;
 * callers pass relative paths like `/applications`.
 */
function resolveBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
  const base = (configured || 'http://localhost:8080').replace(/\/+$/, '')
  if (base.endsWith('/api/v1')) return base
  if (base.endsWith('/api')) return `${base}/v1`
  return `${base}/api/v1`
}

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

const REFRESH_ENDPOINT = '/auth/refresh'
const AUTH_FAILURE = new Set([401, 403])

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Single-flight refresh: concurrent 401s share one refresh round-trip.
let refreshPromise: Promise<string> | null = null

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status

    if (!original || !status || !AUTH_FAILURE.has(status) || original._retry) {
      return Promise.reject(error)
    }

    // A failure on the refresh endpoint itself means the session is dead.
    if (original.url === REFRESH_ENDPOINT) {
      refreshPromise = null
      useAuthStore.getState().logout()
      return Promise.reject(error)
    }

    original._retry = true

    if (!refreshPromise) {
      refreshPromise = axios
        .post<{ accessToken: string }>(
          `${api.defaults.baseURL}${REFRESH_ENDPOINT}`,
          {},
          { withCredentials: true },
        )
        .then((res) => {
          const token = res.data.accessToken
          useAuthStore.getState().setTokens(token)
          return token
        })
        .catch((refreshError) => {
          useAuthStore.getState().logout()
          throw refreshError
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    const token = await refreshPromise
    original.headers.Authorization = `Bearer ${token}`
    return api(original)
  },
)

/** Unwrap an axios response to its data payload. */
export const unwrap = <T>(p: Promise<AxiosResponse<T>>): Promise<T> => p.then((r) => r.data)
