import React, { useEffect, useRef } from 'react'
import { Toast } from 'primereact/toast'
import useGamificationStore from '../../store/gamificationStore'

const resolveSeverity = (event) => {
  if (!event) return 'info'
  if (event.queuedOffline) return 'info'
  if (event.leveledUp) return 'success'
  return 'info'
}

const resolveSummary = (event) => {
  if (!event) return 'XP updated'
  if (event.leveledUp) return 'Level up!'
  if (event.queuedOffline) return 'XP queued'
  return 'XP updated'
}

const GamificationToastHost = () => {
  const toast = useRef(null)
  const latestEvent = useGamificationStore((s) => s.latestEvent)
  const clearLatestEvent = useGamificationStore((s) => s.clearLatestEvent)

  useEffect(() => {
    if (!latestEvent) return

    toast.current?.show({
      severity: resolveSeverity(latestEvent),
      summary: resolveSummary(latestEvent),
      detail: latestEvent.message,
    })
    clearLatestEvent()
  }, [latestEvent, clearLatestEvent])

  return <Toast ref={toast} position="top-right" />
}

export default GamificationToastHost
