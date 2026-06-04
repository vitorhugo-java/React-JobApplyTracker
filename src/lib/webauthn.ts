/**
 * WebAuthn helpers bridging the backend's JSON passkey options to the browser
 * `navigator.credentials` API. The backend sends/receives binary fields
 * (challenge, credential ids, signatures) as base64url strings, while the
 * browser works with `ArrayBuffer`s — these helpers translate both ways.
 */

/** True when the browser exposes the WebAuthn platform authenticator API. */
export const isPasskeySupported = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.PublicKeyCredential === 'function' &&
  typeof navigator.credentials?.create === 'function'

function base64urlToBuffer(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (padded.length % 4)) % 4)
  const raw = atob(padded + padding)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes.buffer
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

interface RawDescriptor {
  id: string
  type: PublicKeyCredentialType
  transports?: AuthenticatorTransport[]
}

/** JSON shape of `PublicKeyCredentialCreationOptions` as sent by the backend. */
interface RawCreationOptions {
  challenge: string
  user: { id: string; name: string; displayName: string }
  excludeCredentials?: RawDescriptor[]
  [key: string]: unknown
}

/** JSON shape of `PublicKeyCredentialRequestOptions` as sent by the backend. */
interface RawRequestOptions {
  challenge: string
  allowCredentials?: RawDescriptor[]
  [key: string]: unknown
}

const decodeDescriptors = (list?: RawDescriptor[]): PublicKeyCredentialDescriptor[] | undefined =>
  list?.map((d) => ({ ...d, id: base64urlToBuffer(d.id) }))

export function decodeCreationOptions(raw: RawCreationOptions): PublicKeyCredentialCreationOptions {
  return {
    ...(raw as unknown as PublicKeyCredentialCreationOptions),
    challenge: base64urlToBuffer(raw.challenge),
    user: { ...raw.user, id: base64urlToBuffer(raw.user.id) },
    excludeCredentials: decodeDescriptors(raw.excludeCredentials),
  }
}

export function decodeRequestOptions(raw: RawRequestOptions): PublicKeyCredentialRequestOptions {
  return {
    ...(raw as unknown as PublicKeyCredentialRequestOptions),
    challenge: base64urlToBuffer(raw.challenge),
    allowCredentials: decodeDescriptors(raw.allowCredentials),
  }
}

/** Serialize a created/asserted credential back to the backend's JSON form. */
export function encodeCredential(credential: PublicKeyCredential): Record<string, unknown> {
  const response = credential.response as
    & AuthenticatorAttestationResponse
    & AuthenticatorAssertionResponse

  const json: Record<string, unknown> = {
    id: credential.id,
    type: credential.type,
    rawId: bufferToBase64url(credential.rawId),
    clientExtensionResults: credential.getClientExtensionResults(),
  }

  const out: Record<string, unknown> = {
    clientDataJSON: bufferToBase64url(response.clientDataJSON),
  }

  // Registration response carries an attestation object.
  if ('attestationObject' in response && response.attestationObject) {
    out.attestationObject = bufferToBase64url(response.attestationObject)
    if (typeof response.getTransports === 'function') {
      out.transports = response.getTransports()
    }
  }

  // Authentication response carries the assertion signature.
  if ('authenticatorData' in response && response.authenticatorData) {
    out.authenticatorData = bufferToBase64url(response.authenticatorData)
    out.signature = bufferToBase64url(response.signature)
    out.userHandle = response.userHandle ? bufferToBase64url(response.userHandle) : null
  }

  json.response = out
  return json
}
