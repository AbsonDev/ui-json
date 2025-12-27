import crypto from 'crypto'
import logger, { logError } from './logger'

const ALGORITHM = 'aes-256-cbc'

// Validate ENCRYPTION_KEY at module load time
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

if (!ENCRYPTION_KEY) {
  throw new Error(
    'ENCRYPTION_KEY environment variable is required. ' +
    'Generate one with: openssl rand -base64 32'
  )
}

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error(
    `ENCRYPTION_KEY must be exactly 32 characters long (current: ${ENCRYPTION_KEY.length}). ` +
    'Generate one with: openssl rand -base64 32 | cut -c1-32'
  )
}

// Get the validated encryption key as Buffer
function getKey(): Buffer {
  return Buffer.from(ENCRYPTION_KEY, 'utf-8')
}

/**
 * Encrypt a string using AES-256-CBC
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: iv:encryptedData
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Return IV + encrypted data (we need IV for decryption)
    return `${iv.toString('hex')}:${encrypted}`
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Encryption error'))
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt an encrypted string
 * @param encryptedText - Encrypted text in format: iv:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    const [ivHex, encryptedData] = encryptedText.split(':')

    if (!ivHex || !encryptedData) {
      throw new Error('Invalid encrypted format')
    }

    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Decryption error'))
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Mask a password for display (shows only first 2 and last 2 chars)
 * @param password - Password to mask
 * @returns Masked password like "pa••••••rd"
 */
export function maskPassword(password: string): string {
  if (password.length <= 4) {
    return '••••'
  }

  const first = password.substring(0, 2)
  const last = password.substring(password.length - 2)
  const middle = '•'.repeat(Math.max(4, password.length - 4))

  return `${first}${middle}${last}`
}

/**
 * Test if decryption works (for validation)
 */
export function testEncryption(): boolean {
  try {
    const testData = 'test-password-123'
    const encrypted = encrypt(testData)
    const decrypted = decrypt(encrypted)
    return decrypted === testData
  } catch {
    return false
  }
}
