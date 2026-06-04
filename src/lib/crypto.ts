const LABEL = 'applywell-local-db-v1'
const enc = new TextEncoder()
const dec = new TextDecoder()

let _cachedKey: CryptoKey | null = null
let _cachedUserId: string | null = null

async function deriveKey(userId: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(`applywell:${userId}`),
    { name: 'HKDF' },
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: enc.encode(LABEL),
      info: enc.encode('encryption'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function getEncryptionKey(userId: string): Promise<CryptoKey> {
  if (_cachedKey && _cachedUserId === userId) return _cachedKey
  _cachedKey = await deriveKey(userId)
  _cachedUserId = userId
  return _cachedKey
}

export function clearEncryptionKey(): void {
  _cachedKey = null
  _cachedUserId = null
}

export async function encryptData(data: unknown, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(data)),
  )
  const combined = new Uint8Array(12 + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), 12)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptData<T>(ciphertext: string, key: CryptoKey): Promise<T> {
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: combined.slice(0, 12) },
    key,
    combined.slice(12),
  )
  return JSON.parse(dec.decode(decrypted)) as T
}
