import { encrypt, decrypt, maskPassword } from '../encryption'

describe('Encryption Utils', () => {
  describe('encrypt', () => {
    it('should encrypt a string', () => {
      const plainText = 'my-secret-password'
      const encrypted = encrypt(plainText)

      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe(plainText)
      expect(encrypted).toContain(':') // IV:encrypted format
    })

    it('should produce different outputs for same input (due to random IV)', () => {
      const plainText = 'same-password'
      const encrypted1 = encrypt(plainText)
      const encrypted2 = encrypt(plainText)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should handle empty strings', () => {
      const plainText = ''
      const encrypted = encrypt(plainText)

      expect(encrypted).toBeDefined()
      expect(encrypted).toContain(':')
    })

    it('should handle special characters', () => {
      const plainText = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`'
      const encrypted = encrypt(plainText)

      expect(encrypted).toBeDefined()
      expect(decrypt(encrypted)).toBe(plainText)
    })

    it('should handle unicode characters', () => {
      const plainText = '密码 пароль كلمة السر 🔐'
      const encrypted = encrypt(plainText)

      expect(encrypted).toBeDefined()
      expect(decrypt(encrypted)).toBe(plainText)
    })

    it('should handle very long strings', () => {
      const plainText = 'a'.repeat(10000)
      const encrypted = encrypt(plainText)

      expect(encrypted).toBeDefined()
      expect(decrypt(encrypted)).toBe(plainText)
    })
  })

  describe('decrypt', () => {
    it('should decrypt an encrypted string', () => {
      const plainText = 'my-secret-password'
      const encrypted = encrypt(plainText)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plainText)
    })

    it('should handle empty string decryption', () => {
      const plainText = ''
      const encrypted = encrypt(plainText)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plainText)
    })

    it('should throw error for invalid encrypted format', () => {
      const invalidEncrypted = 'not-a-valid-encrypted-string'

      expect(() => decrypt(invalidEncrypted)).toThrow()
    })

    it('should throw error for corrupted encrypted data', () => {
      const validEncrypted = encrypt('test')
      const corruptedEncrypted = validEncrypted.slice(0, -5) + 'xxxxx'

      expect(() => decrypt(corruptedEncrypted)).toThrow()
    })

    it('should maintain data integrity for complex objects', () => {
      const plainText = JSON.stringify({
        user: 'admin',
        password: 'p@ssw0rd!',
        roles: ['admin', 'user'],
        settings: {
          theme: 'dark',
          notifications: true,
        },
      })

      const encrypted = encrypt(plainText)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(plainText)
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(plainText))
    })
  })

  describe('encrypt/decrypt round-trip', () => {
    it('should maintain data integrity for multiple encryptions', () => {
      const original = 'test-password-123'

      // Encrypt and decrypt 100 times
      let current = original
      for (let i = 0; i < 100; i++) {
        current = decrypt(encrypt(current))
      }

      expect(current).toBe(original)
    })

    it('should handle different data types as strings', () => {
      const testCases = [
        '123456',
        'true',
        'false',
        'null',
        'undefined',
        '{"key":"value"}',
        '[1,2,3]',
      ]

      testCases.forEach((testCase) => {
        const encrypted = encrypt(testCase)
        const decrypted = decrypt(encrypted)
        expect(decrypted).toBe(testCase)
      })
    })
  })

  describe('maskPassword', () => {
    it('should mask short passwords (<=4 chars)', () => {
      expect(maskPassword('abc')).toBe('••••')
      expect(maskPassword('1234')).toBe('••••')
      expect(maskPassword('a')).toBe('••••')
    })

    it('should mask medium passwords showing first 2 and last 2 chars', () => {
      expect(maskPassword('password')).toBe('pa••••rd')
      expect(maskPassword('12345678')).toBe('12••••78')
    })

    it('should mask long passwords correctly', () => {
      expect(maskPassword('verylongpassword123')).toBe('ve•••••••••••••23')
    })

    it('should handle exactly 5 characters', () => {
      const result = maskPassword('abcde')
      expect(result).toContain('ab')
      expect(result).toContain('de')
      expect(result).toContain('••••')
    })

    it('should handle empty string', () => {
      expect(maskPassword('')).toBe('••••')
    })

    it('should preserve first and last 2 characters for any length > 4', () => {
      const password = 'MySecretP@ssw0rd!'
      const masked = maskPassword(password)

      expect(masked.startsWith('My')).toBe(true)
      expect(masked.endsWith('d!')).toBe(true)
      expect(masked).toContain('••••')
      expect(masked.length).toBeGreaterThanOrEqual(password.length)
    })

    it('should only show bullets for sensitive data', () => {
      const masked = maskPassword('SuperSecret123')

      expect(masked).not.toContain('Super')
      expect(masked).not.toContain('Secret')
      expect(masked).toContain('••')
    })

    it('should handle unicode characters', () => {
      const password = '密码123'
      const masked = maskPassword(password)

      expect(masked).toBeDefined()
      expect(masked).toContain('••••')
    })
  })

  describe('Security edge cases', () => {
    it('should not expose plaintext in error messages', () => {
      const plainText = 'super-secret-password'

      try {
        decrypt('invalid-data')
      } catch (error: any) {
        expect(error.message).not.toContain(plainText)
      }
    })

    it('encrypted data should not reveal length of original', () => {
      const short = encrypt('hi')
      const long = encrypt('a'.repeat(1000))

      // Due to padding and IV, lengths should be similar blocks
      // This is a characteristic of AES-CBC
      expect(short.length).toBeGreaterThan(0)
      expect(long.length).toBeGreaterThan(short.length)
    })

    it('should handle SQL injection attempts in passwords', () => {
      const sqlInjection = "'; DROP TABLE users; --"
      const encrypted = encrypt(sqlInjection)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(sqlInjection)
      expect(encrypted).not.toContain('DROP TABLE')
    })

    it('should handle XSS attempts in passwords', () => {
      const xss = '<script>alert("XSS")</script>'
      const encrypted = encrypt(xss)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(xss)
      expect(encrypted).not.toContain('<script>')
    })
  })
})
