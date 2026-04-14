import React, { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCcw, CloudCheck } from 'lucide-react'
import { getOfflineQueueStatus, onOfflineQueueStatusChange } from '../../api/offlineQueue'

const SyncStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  )
  const [status, setStatus] = useState(getOfflineQueueStatus())

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncFromQueue = (next) => {
      setStatus(next || getOfflineQueueStatus())
    }

    const setOnline = () => setIsOnline(true)
    const setOffline = () => setIsOnline(false)

    const unsubscribe = onOfflineQueueStatusChange(syncFromQueue)
    window.addEventListener('online', setOnline)
    window.addEventListener('offline', setOffline)

    syncFromQueue(getOfflineQueueStatus())

    return () => {
      unsubscribe()
      window.removeEventListener('online', setOnline)
      window.removeEventListener('offline', setOffline)
    }
  }, [])

  const queuedCount = status.queuedCount || 0
  const syncing = Boolean(status.syncing)

  const baseClass = 'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium'

  if (syncing) {
    return (
      <div
        className={`${baseClass} border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-700/40 dark:bg-indigo-900/20 dark:text-indigo-300`}
        data-testid="sync-status-indicator"
      >
        <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
        <span data-testid="sync-status-text">Sincronizando alteracoes...</span>
      </div>
    )
  }

  if (queuedCount > 0) {
    return (
      <div
        className={`${baseClass} border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300`}
        data-testid="sync-status-indicator"
      >
        {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        <span data-testid="sync-status-text">{queuedCount} alteracoes pendentes</span>
      </div>
    )
  }

  return (
    <div
      className={`${baseClass} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300`}
      data-testid="sync-status-indicator"
    >
      {isOnline ? <CloudCheck className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      <span data-testid="sync-status-text">{isOnline ? 'Sincronizado' : 'Offline'}</span>
    </div>
  )
}

export default SyncStatusIndicator
