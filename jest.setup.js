// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-purposes-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
