const BASE64_PADDING = '='

const addBase64Padding = (value) => {
  const remainder = value.length % 4
  if (remainder === 0) return value
  return `${value}${BASE64_PADDING.repeat(4 - remainder)}`
}

const base64UrlToArrayBuffer = (value) => {
  if (!value) return value
  if (value instanceof ArrayBuffer) return value
  if (ArrayBuffer.isView(value)) return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)

  const normalized = addBase64Padding(value.replace(/-/g, '+').replace(/_/g, '/'))
  const binary = globalThis.atob(normalized)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return bytes.buffer
}

const arrayBufferToBase64Url = (value) => {
  if (!value) return value

  const bytes = value instanceof ArrayBuffer
    ? new Uint8Array(value)
    : ArrayBuffer.isView(value)
      ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
      : null

  if (!bytes) {
    return value
  }

  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return globalThis.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const resolvePublicKey = (payload) => payload?.publicKey ?? payload

export const browserSupportsWebAuthn = () =>
  typeof window !== 'undefined' &&
  typeof window.PublicKeyCredential !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  typeof navigator.credentials?.create === 'function' &&
  typeof navigator.credentials?.get === 'function'

export const toPublicKeyCredentialCreationOptions = (payload) => {
  const publicKey = resolvePublicKey(payload)

  return {
    ...publicKey,
    challenge: base64UrlToArrayBuffer(publicKey?.challenge),
    user: publicKey?.user
      ? {
          ...publicKey.user,
          id: base64UrlToArrayBuffer(publicKey.user.id),
        }
      : publicKey?.user,
    excludeCredentials: publicKey?.excludeCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlToArrayBuffer(credential.id),
    })),
  }
}

export const toPublicKeyCredentialRequestOptions = (payload) => {
  const publicKey = resolvePublicKey(payload)

  return {
    ...publicKey,
    challenge: base64UrlToArrayBuffer(publicKey?.challenge),
    allowCredentials: publicKey?.allowCredentials?.map((credential) => ({
      ...credential,
      id: base64UrlToArrayBuffer(credential.id),
    })),
  }
}

export const serializePublicKeyCredential = (credential) => {
  const response = credential?.response || {}
  const transports =
    typeof response.getTransports === 'function'
      ? response.getTransports()
      : undefined

  return {
    id: credential.id,
    type: credential.type,
    rawId: arrayBufferToBase64Url(credential.rawId),
    authenticatorAttachment: credential.authenticatorAttachment ?? null,
    clientExtensionResults:
      typeof credential.getClientExtensionResults === 'function'
        ? credential.getClientExtensionResults()
        : {},
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      signature: arrayBufferToBase64Url(response.signature),
      userHandle: arrayBufferToBase64Url(response.userHandle),
      transports,
    },
  }
}

export const getWebAuthnErrorMessage = (error, fallbackMessage) => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  switch (error?.name) {
    case 'NotAllowedError':
      return 'The passkey prompt was canceled or timed out. Please try again.'
    case 'NotSupportedError':
      return 'Passkeys are not available in this browser or device.'
    case 'InvalidStateError':
      return 'This passkey is already registered for your account.'
    case 'SecurityError':
      return 'Passkeys require a secure context such as HTTPS or localhost.'
    default:
      return error?.message || fallbackMessage
  }
}
