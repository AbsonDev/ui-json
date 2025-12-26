/**
 * Logger Tests
 * Testing Winston logger configuration and helper functions
 */

// Mock winston before import
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
    exceptions: {
      handle: jest.fn(),
    },
    rejections: {
      handle: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: {
      createLogger: jest.fn(() => mockLogger),
      format: {
        combine: jest.fn((... formats) => formats),
        timestamp: jest.fn(() => 'timestamp'),
        errors: jest.fn(() => 'errors'),
        splat: jest.fn(() => 'splat'),
        json: jest.fn(() => 'json'),
        printf: jest.fn((fn) => fn),
        colorize: jest.fn(() => 'colorize'),
      },
      transports: {
        Console: jest.fn(),
        File: jest.fn(),
      },
      addColors: jest.fn(),
    },
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn((...formats) => formats),
      timestamp: jest.fn(() => 'timestamp'),
      errors: jest.fn(() => 'errors'),
      splat: jest.fn(() => 'splat'),
      json: jest.fn(() => 'json'),
      printf: jest.fn((fn) => fn),
      colorize: jest.fn(() => 'colorize'),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
    addColors: jest.fn(),
  };
});

import logger, {
  stream,
  logApiRequest,
  logApiResponse,
  logDatabaseQuery,
  logError,
  logSecurityEvent,
  logUserAction,
} from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logger Instance', () => {
    it('should export a logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('http');
    });

    it('should have all logging methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.http).toBe('function');
    });
  });

  describe('stream', () => {
    it('should export a stream object for Morgan integration', () => {
      expect(stream).toBeDefined();
      expect(stream).toHaveProperty('write');
      expect(typeof stream.write).toBe('function');
    });

    it('should write messages to logger.http', () => {
      const message = 'GET /api/test 200 - 5.123 ms';
      stream.write(message);

      expect(logger.http).toHaveBeenCalledWith(message.trim());
    });

    it('should trim whitespace from messages', () => {
      const message = '  POST /api/users 201 - 10.456 ms  \n';
      stream.write(message);

      expect(logger.http).toHaveBeenCalledWith('POST /api/users 201 - 10.456 ms');
    });

    it('should handle empty messages', () => {
      stream.write('');

      expect(logger.http).toHaveBeenCalledWith('');
    });

    it('should handle messages with newlines', () => {
      const message = 'GET /api/test\n';
      stream.write(message);

      expect(logger.http).toHaveBeenCalledWith('GET /api/test');
    });
  });

  describe('logApiRequest', () => {
    it('should log API request with method and path', () => {
      logApiRequest('GET', '/api/users');

      expect(logger.http).toHaveBeenCalledWith(
        'API Request: GET /api/users',
        { userId: undefined }
      );
    });

    it('should log API request with userId', () => {
      logApiRequest('POST', '/api/posts', 'user123');

      expect(logger.http).toHaveBeenCalledWith(
        'API Request: POST /api/posts',
        { userId: 'user123' }
      );
    });

    it('should handle different HTTP methods', () => {
      logApiRequest('PUT', '/api/users/1', 'user456');

      expect(logger.http).toHaveBeenCalledWith(
        'API Request: PUT /api/users/1',
        { userId: 'user456' }
      );
    });

    it('should handle complex paths', () => {
      logApiRequest('DELETE', '/api/v1/users/123/posts/456');

      expect(logger.http).toHaveBeenCalled();
    });

    it('should be called once per request', () => {
      logApiRequest('GET', '/api/test');

      expect(logger.http).toHaveBeenCalledTimes(1);
    });
  });

  describe('logApiResponse', () => {
    it('should log API response with all parameters', () => {
      logApiResponse('GET', '/api/users', 200, 150);

      expect(logger.http).toHaveBeenCalledWith(
        'API Response: GET /api/users - 200 (150ms)'
      );
    });

    it('should handle error status codes', () => {
      logApiResponse('POST', '/api/auth/login', 401, 50);

      expect(logger.http).toHaveBeenCalledWith(
        'API Response: POST /api/auth/login - 401 (50ms)'
      );
    });

    it('should handle server error codes', () => {
      logApiResponse('GET', '/api/data', 500, 1000);

      expect(logger.http).toHaveBeenCalledWith(
        'API Response: GET /api/data - 500 (1000ms)'
      );
    });

    it('should handle fast responses', () => {
      logApiResponse('GET', '/health', 200, 5);

      expect(logger.http).toHaveBeenCalledWith(
        'API Response: GET /health - 200 (5ms)'
      );
    });

    it('should handle slow responses', () => {
      logApiResponse('POST', '/api/heavy', 200, 5000);

      expect(logger.http).toHaveBeenCalledWith(
        'API Response: POST /api/heavy - 200 (5000ms)'
      );
    });

    it('should be called once per response', () => {
      logApiResponse('GET', '/api/test', 200, 100);

      expect(logger.http).toHaveBeenCalledTimes(1);
    });
  });

  describe('logDatabaseQuery', () => {
    it('should log database query with duration', () => {
      logDatabaseQuery('SELECT * FROM users', 25);

      expect(logger.debug).toHaveBeenCalledWith(
        'Database Query: SELECT * FROM users (25ms)'
      );
    });

    it('should handle complex queries', () => {
      const query = 'SELECT u.*, p.* FROM users u JOIN posts p ON u.id = p.user_id WHERE u.active = true';
      logDatabaseQuery(query, 150);

      expect(logger.debug).toHaveBeenCalledWith(
        `Database Query: ${query} (150ms)`
      );
    });

    it('should handle fast queries', () => {
      logDatabaseQuery('SELECT COUNT(*) FROM users', 2);

      expect(logger.debug).toHaveBeenCalledWith(
        'Database Query: SELECT COUNT(*) FROM users (2ms)'
      );
    });

    it('should handle slow queries', () => {
      logDatabaseQuery('SELECT * FROM large_table', 5000);

      expect(logger.debug).toHaveBeenCalledWith(
        'Database Query: SELECT * FROM large_table (5000ms)'
      );
    });

    it('should handle INSERT queries', () => {
      logDatabaseQuery('INSERT INTO users (name, email) VALUES (?, ?)', 10);

      expect(logger.debug).toHaveBeenCalled();
    });

    it('should be called once per query', () => {
      logDatabaseQuery('UPDATE users SET last_seen = NOW()', 15);

      expect(logger.debug).toHaveBeenCalledTimes(1);
    });
  });

  describe('logError', () => {
    it('should log error with message and stack', () => {
      const error = new Error('Test error');
      logError(error);

      expect(logger.error).toHaveBeenCalledWith(
        'Test error',
        expect.objectContaining({
          error: 'Error',
          stack: expect.any(String),
        })
      );
    });

    it('should log error with additional context', () => {
      const error = new Error('Database connection failed');
      const context = { database: 'main', host: 'localhost' };

      logError(error, context);

      expect(logger.error).toHaveBeenCalledWith(
        'Database connection failed',
        expect.objectContaining({
          error: 'Error',
          stack: expect.any(String),
          database: 'main',
          host: 'localhost',
        })
      );
    });

    it('should handle custom error types', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error occurred');
      logError(error);

      expect(logger.error).toHaveBeenCalledWith(
        'Custom error occurred',
        expect.objectContaining({
          error: 'CustomError',
        })
      );
    });

    it('should handle errors without context', () => {
      const error = new Error('Simple error');
      logError(error);

      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('should include error stack trace', () => {
      const error = new Error('Stack trace test');
      logError(error);

      expect(logger.error).toHaveBeenCalledWith(
        'Stack trace test',
        expect.objectContaining({
          stack: expect.stringContaining('Error: Stack trace test'),
        })
      );
    });

    it('should handle empty context', () => {
      const error = new Error('Test');
      logError(error, {});

      expect(logger.error).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          error: 'Error',
        })
      );
    });

    it('should merge context with error details', () => {
      const error = new Error('Merge test');
      const context = { userId: '123', action: 'login' };

      logError(error, context);

      expect(logger.error).toHaveBeenCalledWith(
        'Merge test',
        expect.objectContaining({
          error: 'Error',
          userId: '123',
          action: 'login',
        })
      );
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security event with details', () => {
      const event = 'Failed login attempt';
      const details = { ip: '192.168.1.1', username: 'admin' };

      logSecurityEvent(event, details);

      expect(logger.warn).toHaveBeenCalledWith(
        'Security Event: Failed login attempt',
        details
      );
    });

    it('should handle multiple failed attempts', () => {
      const event = 'Multiple failed login attempts';
      const details = {
        ip: '192.168.1.100',
        username: 'admin',
        attempts: 5,
      };

      logSecurityEvent(event, details);

      expect(logger.warn).toHaveBeenCalledWith(
        `Security Event: ${event}`,
        details
      );
    });

    it('should log suspicious activity', () => {
      const event = 'Suspicious activity detected';
      const details = {
        userId: 'user123',
        activity: 'rapid requests',
        count: 100,
      };

      logSecurityEvent(event, details);

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle empty details', () => {
      logSecurityEvent('Test event', {});

      expect(logger.warn).toHaveBeenCalledWith('Security Event: Test event', {});
    });

    it('should log unauthorized access attempts', () => {
      const event = 'Unauthorized access attempt';
      const details = {
        resource: '/admin/users',
        userId: 'guest',
      };

      logSecurityEvent(event, details);

      expect(logger.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('logUserAction', () => {
    it('should log user action with userId', () => {
      logUserAction('login', 'user123');

      expect(logger.info).toHaveBeenCalledWith(
        'User Action: login',
        { userId: 'user123' }
      );
    });

    it('should log user action with additional details', () => {
      const details = { ip: '192.168.1.1', device: 'mobile' };
      logUserAction('login', 'user456', details);

      expect(logger.info).toHaveBeenCalledWith(
        'User Action: login',
        {
          userId: 'user456',
          ip: '192.168.1.1',
          device: 'mobile',
        }
      );
    });

    it('should handle various user actions', () => {
      logUserAction('create_post', 'user789', { postId: 'post123' });

      expect(logger.info).toHaveBeenCalledWith(
        'User Action: create_post',
        {
          userId: 'user789',
          postId: 'post123',
        }
      );
    });

    it('should handle logout action', () => {
      logUserAction('logout', 'user111');

      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle actions without additional details', () => {
      logUserAction('page_view', 'user222');

      expect(logger.info).toHaveBeenCalledWith(
        'User Action: page_view',
        { userId: 'user222' }
      );
    });

    it('should merge userId with details', () => {
      const details = { page: '/dashboard', duration: 5000 };
      logUserAction('page_view', 'user333', details);

      expect(logger.info).toHaveBeenCalledWith(
        'User Action: page_view',
        {
          userId: 'user333',
          page: '/dashboard',
          duration: 5000,
        }
      );
    });
  });

  describe('Integration', () => {
    it('should handle multiple concurrent logging calls', () => {
      logApiRequest('GET', '/api/test', 'user1');
      logApiResponse('GET', '/api/test', 200, 50);
      logUserAction('api_call', 'user1');

      expect(logger.http).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledTimes(1);
    });

    it('should handle error and recovery flow', () => {
      const error = new Error('Test error');
      logError(error, { userId: 'user1' });
      logUserAction('error_handled', 'user1', { recovered: true });

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledTimes(1);
    });

    it('should handle security event and user action', () => {
      logSecurityEvent('Failed login', { ip: '1.2.3.4' });
      logUserAction('login_failed', 'unknown');

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledTimes(1);
    });
  });
});
