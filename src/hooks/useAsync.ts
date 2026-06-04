import { useCallback, useEffect, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

function toMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'response' in error) {
    const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message
    if (msg) return msg
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/**
 * Run an async loader on mount and whenever `deps` change. Returns data,
 * loading, error, and a manual `reload`. The loader is wrapped so stale
 * responses from a superseded run are discarded.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[],
  fallbackError = 'Something went wrong.',
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    loader()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (active) setError(toMessage(err, fallbackError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { data, loading, error, reload }
}
