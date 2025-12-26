/**
 * Environment Variables Validation Tests
 */

describe('Environment Variables', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Valid Environment', () => {
    it('should validate all required environment variables', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.ENCRYPTION_KEY = 'b'.repeat(32);
      process.env.NODE_ENV = 'test';

      const { env } = require('../env');

      expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
      expect(env.NEXTAUTH_URL).toBe('http://localhost:3000');
      expect(env.NEXTAUTH_SECRET).toBe('a'.repeat(32));
      expect(env.ENCRYPTION_KEY).toBe('b'.repeat(32));
      expect(env.NODE_ENV).toBe('test');
    });

    it('should accept valid PostgreSQL URLs with different formats', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/mydb';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'c'.repeat(32);
      process.env.ENCRYPTION_KEY = 'd'.repeat(32);
      process.env.NODE_ENV = 'test';

      const { env } = require('../env');

      expect(env.DATABASE_URL).toBe('postgresql://localhost/mydb');
    });

    it('should accept HTTPS NEXTAUTH_URL', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'https://example.com';
      process.env.NEXTAUTH_SECRET = 'e'.repeat(32);
      process.env.ENCRYPTION_KEY = 'f'.repeat(32);
      process.env.NODE_ENV = 'test';

      const { env } = require('../env');

      expect(env.NEXTAUTH_URL).toBe('https://example.com');
    });

    it('should accept optional GEMINI_API_KEY', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'g'.repeat(32);
      process.env.ENCRYPTION_KEY = 'h'.repeat(32);
      process.env.GEMINI_API_KEY = 'test-api-key-12345';
      process.env.NODE_ENV = 'test';

      const { env } = require('../env');

      expect(env.GEMINI_API_KEY).toBe('test-api-key-12345');
    });

    it('should work without optional GEMINI_API_KEY', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'i'.repeat(32);
      process.env.ENCRYPTION_KEY = 'j'.repeat(32);
      process.env.NODE_ENV = 'test';

      const { env } = require('../env');

      expect(env.GEMINI_API_KEY).toBeUndefined();
    });

    it('should default NODE_ENV to development', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'k'.repeat(32);
      process.env.ENCRYPTION_KEY = 'l'.repeat(32);
      delete process.env.NODE_ENV;

      const { env } = require('../env');

      expect(env.NODE_ENV).toBe('development');
    });

    it('should accept production NODE_ENV', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'm'.repeat(32);
      process.env.ENCRYPTION_KEY = 'n'.repeat(32);
      process.env.NODE_ENV = 'production';

      const { env } = require('../env');

      expect(env.NODE_ENV).toBe('production');
    });
  });

  describe('Invalid DATABASE_URL', () => {
    it('should reject missing DATABASE_URL', () => {
      delete process.env.DATABASE_URL;
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'o'.repeat(32);
      process.env.ENCRYPTION_KEY = 'p'.repeat(32);
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow();
    });

    it('should reject non-PostgreSQL DATABASE_URL', () => {
      process.env.DATABASE_URL = 'mysql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'q'.repeat(32);
      process.env.ENCRYPTION_KEY = 'r'.repeat(32);
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow('must be a PostgreSQL URL');
    });

    it('should reject invalid URL format', () => {
      process.env.DATABASE_URL = 'not-a-url';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 's'.repeat(32);
      process.env.ENCRYPTION_KEY = 't'.repeat(32);
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow();
    });
  });

  describe('Invalid NEXTAUTH_URL', () => {
    it('should reject missing NEXTAUTH_URL', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      delete process.env.NEXTAUTH_URL;
      process.env.NEXTAUTH_SECRET = 'u'.repeat(32);
      process.env.ENCRYPTION_KEY = 'v'.repeat(32);
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow();
    });

    it('should reject invalid NEXTAUTH_URL', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'not-a-url';
      process.env.NEXTAUTH_SECRET = 'w'.repeat(32);
      process.env.ENCRYPTION_KEY = 'x'.repeat(32);
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow();
    });
  });

  describe('Invalid NEXTAUTH_SECRET', () => {
    it('should reject missing NEXTAUTH_SECRET', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      delete process.env.NEXTAUTH_SECRET;
      process.env.ENCRYPTION_KEY = 'y'.repeat(32);
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow();
    });

    it('should reject short NEXTAUTH_SECRET', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'short';
      process.env.ENCRYPTION_KEY = 'z'.repeat(32);
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow('at least 32 characters');
    });

    it('should reject 31-character NEXTAUTH_SECRET', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(31);
      process.env.ENCRYPTION_KEY = 'b'.repeat(32);
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow('at least 32 characters');
    });

    it('should accept 32-character NEXTAUTH_SECRET', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'c'.repeat(32);
      process.env.ENCRYPTION_KEY = 'd'.repeat(32);
      process.env.NODE_ENV = 'test';

      const { env } = require('../env');

      expect(env.NEXTAUTH_SECRET).toBe('c'.repeat(32));
    });

    it('should accept longer NEXTAUTH_SECRET', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'e'.repeat(64);
      process.env.ENCRYPTION_KEY = 'f'.repeat(32);
      process.env.NODE_ENV = 'test';

      const { env } = require('../env');

      expect(env.NEXTAUTH_SECRET).toBe('e'.repeat(64));
    });
  });

  describe('Invalid ENCRYPTION_KEY', () => {
    it('should reject missing ENCRYPTION_KEY', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'g'.repeat(32);
      delete process.env.ENCRYPTION_KEY;
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow();
    });

    it('should reject short ENCRYPTION_KEY', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'h'.repeat(32);
      process.env.ENCRYPTION_KEY = 'short';
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow('exactly 32 characters');
    });

    it('should reject 31-character ENCRYPTION_KEY', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'i'.repeat(32);
      process.env.ENCRYPTION_KEY = 'j'.repeat(31);
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow('exactly 32 characters');
    });

    it('should reject 33-character ENCRYPTION_KEY', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'k'.repeat(32);
      process.env.ENCRYPTION_KEY = 'l'.repeat(33);
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow('exactly 32 characters');
    });

    it('should accept exactly 32-character ENCRYPTION_KEY', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'm'.repeat(32);
      process.env.ENCRYPTION_KEY = 'n'.repeat(32);
      process.env.NODE_ENV = 'test';

      const { env } = require('../env');

      expect(env.ENCRYPTION_KEY).toBe('n'.repeat(32));
    });
  });

  describe('Invalid GEMINI_API_KEY', () => {
    it('should reject short GEMINI_API_KEY', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'o'.repeat(32);
      process.env.ENCRYPTION_KEY = 'p'.repeat(32);
      process.env.GEMINI_API_KEY = 'short';
      process.env.NODE_ENV = 'test';

      expect(() => require('../env')).toThrow('at least 10 characters');
    });

    it('should accept 10-character GEMINI_API_KEY', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'q'.repeat(32);
      process.env.ENCRYPTION_KEY = 'r'.repeat(32);
      process.env.GEMINI_API_KEY = 's'.repeat(10);
      process.env.NODE_ENV = 'test';

      const { env } = require('../env');

      expect(env.GEMINI_API_KEY).toBe('s'.repeat(10));
    });
  });

  describe('Invalid NODE_ENV', () => {
    it('should reject invalid NODE_ENV', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 't'.repeat(32);
      process.env.ENCRYPTION_KEY = 'u'.repeat(32);
      process.env.NODE_ENV = 'invalid';

      expect(() => require('../env')).toThrow();
    });

    it('should accept development NODE_ENV', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'v'.repeat(32);
      process.env.ENCRYPTION_KEY = 'w'.repeat(32);
      process.env.NODE_ENV = 'development';

      const { env } = require('../env');

      expect(env.NODE_ENV).toBe('development');
    });

    it('should accept test NODE_ENV', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'x'.repeat(32);
      process.env.ENCRYPTION_KEY = 'y'.repeat(32);
      process.env.NODE_ENV = 'test';

      const { env } = require('../env');

      expect(env.NODE_ENV).toBe('test');
    });
  });

  describe('validateEnv function', () => {
    it('should log success message when env is valid', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'z'.repeat(32);
      process.env.ENCRYPTION_KEY = 'a'.repeat(32);
      process.env.NODE_ENV = 'test';

      const { validateEnv } = require('../env');
      validateEnv();

      expect(consoleSpy).toHaveBeenCalledWith('✅ Environment variables validated successfully');
      consoleSpy.mockRestore();
    });

    it('should not throw when all env vars are valid', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/db';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'b'.repeat(32);
      process.env.ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.NODE_ENV = 'test';

      const { validateEnv } = require('../env');

      expect(() => validateEnv()).not.toThrow();
    });
  });
});
