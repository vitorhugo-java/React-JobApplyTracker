import { useEffect, useRef } from 'react'
import { replayOfflineQueue } from '@/lib/syncReplay'
import { useOnlineStatus } from './useOnlineStatus'

export function useSyncReplay(): void {
  const isOnline = useOnlineStatus()
  const wasOffline = useRef(false)

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true
      return
    }
    if (!wasOffline.current) return
    wasOffline.current = false
    replayOfflineQueue().catch(() => {})
  }, [isOnline])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_MUTATIONS') {
        replayOfflineQueue().catch(() => {})
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])
}
