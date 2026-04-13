import logger from './logger'

export const measurePageLoad = () => {
  if (typeof window === 'undefined' || !window.performance) return

  window.addEventListener('load', () => {
    const [navEntry] = performance.getEntriesByType('navigation')
    if (navEntry) {
      const loadTime = Math.round(navEntry.loadEventEnd - navEntry.startTime)
      logger.info('Page load time', { loadTimeMs: loadTime })
    }
  })
}

export const measureApiCall = async (label, fn) => {
  const start = performance.now()
  try {
    const result = await fn()
    const elapsed = Math.round(performance.now() - start)
    logger.info(`API response time [${label}]`, { durationMs: elapsed })
    return result
  } catch (error) {
    const elapsed = Math.round(performance.now() - start)
    logger.error(`API call failed [${label}]`, { durationMs: elapsed })
    throw error
  }
}
