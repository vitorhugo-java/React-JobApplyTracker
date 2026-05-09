const GOOGLE_INTEGRATION_ROLES = new Set(['BETA', 'ROLE_BETA'])

const normalizeRoles = (roles) => {
  if (Array.isArray(roles)) {
    return roles
  }

  if (typeof roles === 'string' && roles.trim()) {
    return [roles]
  }

  return []
}

export const canUseGoogleIntegration = (user) => {
  if (user?.canUseGoogleIntegration === true || user?.googleIntegrationEnabled === true) {
    return true
  }

  return normalizeRoles(user?.roles).some((role) =>
    GOOGLE_INTEGRATION_ROLES.has(String(role).trim().toUpperCase())
  )
}
