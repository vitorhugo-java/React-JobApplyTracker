import React, { useEffect, useRef, useState } from 'react'
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
  const [isToastMounted, setIsToastMounted] = useState(false)
  const [pendingEvent, setPendingEvent] = useState(null)
  const latestEvent = useGamificationStore((s) => s.latestEvent)
  const clearLatestEvent = useGamificationStore((s) => s.clearLatestEvent)

  useEffect(() => {
    if (!latestEvent) return

    setIsToastMounted(true)
    setPendingEvent(latestEvent)
    clearLatestEvent()
  }, [latestEvent, clearLatestEvent])

  useEffect(() => {
    if (!pendingEvent || !toast.current) return

    toast.current?.show({
      severity: resolveSeverity(pendingEvent),
      summary: resolveSummary(pendingEvent),
      detail: pendingEvent.message,
    })
    setPendingEvent(null)
  }, [pendingEvent])

  if (!isToastMounted) {
    return null
  }

  return <Toast ref={toast} position="top-right" />
}

export default GamificationToastHost
