const isDev = import.meta.env.DEV

const logger = {
  info(message, context = {}) {
    if (isDev) {
      console.info(`[INFO] ${message}`, context)
    }
  },

  warn(message, context = {}) {
    console.warn(`[WARN] ${message}`, context)
  },

  error(message, context = {}) {
    console.error(`[ERROR] ${message}`, context)
    // TODO: forward to an external logging service (e.g. Sentry) in production
  },

  apiError(endpoint, error) {
    const status = error?.response?.status
    const data = error?.response?.data
    logger.error(`API error on ${endpoint}`, { status, data, message: error?.message })
  },

  authFailure(reason) {
    logger.warn('Auth failure', { reason })
  },

  crash(error, info = {}) {
    logger.error('Unexpected crash', { message: error?.message, stack: error?.stack, ...info })
  },
}

export default logger
