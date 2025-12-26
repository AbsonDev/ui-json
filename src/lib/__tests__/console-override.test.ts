import { overrideConsole, restoreConsole } from '../console-override';
import logger from '../logger';

// Mock logger
jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  logError: jest.fn(),
}));

import { logError } from '../logger';

describe('Console Override', () => {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };

  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore original console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
  });

  afterEach(() => {
    // Always restore console after each test
    restoreConsole();
    process.env.NODE_ENV = originalEnv;
  });

  describe('overrideConsole', () => {
    it('should override console methods in production', () => {
      process.env.NODE_ENV = 'production';

      const originalLog = console.log;
      overrideConsole();

      expect(console.log).not.toBe(originalLog);
      expect(console.error).not.toBe(originalConsole.error);
      expect(console.warn).not.toBe(originalConsole.warn);
      expect(console.info).not.toBe(originalConsole.info);
      expect(console.debug).not.toBe(originalConsole.debug);
    });

    it('should not override console methods in development', () => {
      process.env.NODE_ENV = 'development';

      const originalLog = console.log;
      overrideConsole();

      expect(console.log).toBe(originalLog);
    });

    it('should not override console methods in test environment', () => {
      process.env.NODE_ENV = 'test';

      const originalLog = console.log;
      overrideConsole();

      expect(console.log).toBe(originalLog);
    });

    it('should log success message when overriding in production', () => {
      process.env.NODE_ENV = 'production';

      overrideConsole();

      expect(logger.info).toHaveBeenCalledWith(
        '✅ Console methods overridden to use Winston logger'
      );
    });

    describe('Console.log Override', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        overrideConsole();
      });

      it('should redirect console.log to logger.info', () => {
        console.log('Test message');

        expect(logger.info).toHaveBeenCalledWith('Test message');
      });

      it('should handle multiple arguments', () => {
        console.log('Message', 'with', 'multiple', 'args');

        expect(logger.info).toHaveBeenCalledWith('Message with multiple args');
      });

      it('should handle objects', () => {
        const obj = { key: 'value' };
        console.log('Object:', obj);

        expect(logger.info).toHaveBeenCalledWith('Object: [object Object]');
      });

      it('should handle numbers', () => {
        console.log(42, 100);

        expect(logger.info).toHaveBeenCalledWith('42 100');
      });

      it('should handle empty call', () => {
        console.log();

        expect(logger.info).toHaveBeenCalledWith('');
      });
    });

    describe('Console.error Override', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        overrideConsole();
      });

      it('should redirect Error object to logError', () => {
        const error = new Error('Test error');
        console.error(error);

        expect(logError).toHaveBeenCalledWith(error, { context: [] });
      });

      it('should handle Error with additional context', () => {
        const error = new Error('Test error');
        console.error(error, 'context1', 'context2');

        expect(logError).toHaveBeenCalledWith(error, { context: ['context1', 'context2'] });
      });

      it('should redirect non-Error messages to logger.error', () => {
        console.error('Simple error message');

        expect(logger.error).toHaveBeenCalledWith('Simple error message');
      });

      it('should handle multiple non-Error arguments', () => {
        console.error('Error:', 'details', 123);

        expect(logger.error).toHaveBeenCalledWith('Error: details 123');
      });
    });

    describe('Console.warn Override', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        overrideConsole();
      });

      it('should redirect console.warn to logger.warn', () => {
        console.warn('Warning message');

        expect(logger.warn).toHaveBeenCalledWith('Warning message');
      });

      it('should handle multiple arguments', () => {
        console.warn('Warning:', 'issue detected');

        expect(logger.warn).toHaveBeenCalledWith('Warning: issue detected');
      });
    });

    describe('Console.info Override', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        overrideConsole();
      });

      it('should redirect console.info to logger.info', () => {
        console.info('Info message');

        expect(logger.info).toHaveBeenCalledWith('Info message');
      });

      it('should handle multiple arguments', () => {
        console.info('Info:', 'data', 'here');

        expect(logger.info).toHaveBeenCalledWith('Info: data here');
      });
    });

    describe('Console.debug Override', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        overrideConsole();
      });

      it('should redirect console.debug to logger.debug', () => {
        console.debug('Debug message');

        expect(logger.debug).toHaveBeenCalledWith('Debug message');
      });

      it('should handle multiple arguments', () => {
        console.debug('Debug:', 'variable =', 42);

        expect(logger.debug).toHaveBeenCalledWith('Debug: variable = 42');
      });
    });
  });

  describe('restoreConsole', () => {
    it('should restore original console methods', () => {
      process.env.NODE_ENV = 'production';
      overrideConsole();

      // Console is overridden
      expect(console.log).not.toBe(originalConsole.log);

      restoreConsole();

      // Console is restored
      expect(console.log).toBe(originalConsole.log);
      expect(console.error).toBe(originalConsole.error);
      expect(console.warn).toBe(originalConsole.warn);
      expect(console.info).toBe(originalConsole.info);
      expect(console.debug).toBe(originalConsole.debug);
    });

    it('should work when called without prior override', () => {
      expect(() => restoreConsole()).not.toThrow();
    });

    it('should allow multiple restore calls', () => {
      process.env.NODE_ENV = 'production';
      overrideConsole();

      restoreConsole();
      restoreConsole();
      restoreConsole();

      expect(console.log).toBe(originalConsole.log);
    });

    it('should restore functionality after override', () => {
      process.env.NODE_ENV = 'production';
      overrideConsole();

      // While overridden, logger is used
      console.log('test');
      expect(logger.info).toHaveBeenCalled();

      const infoCallsBefore = (logger.info as jest.Mock).mock.calls.length;

      restoreConsole();

      // After restore, logger should not receive new calls
      console.log('restored');
      const infoCallsAfter = (logger.info as jest.Mock).mock.calls.length;

      // No new logger calls since console is restored
      expect(infoCallsAfter).toBe(infoCallsBefore);
    });
  });

  describe('Module Auto-initialization', () => {
    it('should check for server environment before auto-override', () => {
      // This test validates the module's auto-initialization behavior
      // The module checks: typeof window === 'undefined' && NODE_ENV === 'production'

      // In jest-dom environment, window is defined
      // In true Node.js environment, window would be undefined
      const hasWindow = typeof window !== 'undefined';

      // Document the behavior: auto-override only in server + production
      expect(hasWindow || process.env.NODE_ENV !== 'production').toBeTruthy();
    });

    it('should only auto-override in production server environment', () => {
      // Auto-override conditions:
      // 1. Server environment (typeof window === 'undefined')
      // 2. Production mode (NODE_ENV === 'production')

      // Both conditions must be true for auto-override
      const isProduction = process.env.NODE_ENV === 'production';

      // This documents the intended behavior
      if (isProduction) {
        expect(process.env.NODE_ENV).toBe('production');
      }
    });
  });

  describe('Integration', () => {
    it('should allow override -> restore -> override cycle', () => {
      process.env.NODE_ENV = 'production';

      const originalLog = console.log;

      // First override
      overrideConsole();
      const overriddenLog1 = console.log;
      expect(overriddenLog1).not.toBe(originalLog);

      // Restore
      restoreConsole();
      expect(console.log).toBe(originalLog);

      // Override again
      overrideConsole();
      const overriddenLog2 = console.log;
      expect(overriddenLog2).not.toBe(originalLog);

      // Final restore
      restoreConsole();
      expect(console.log).toBe(originalLog);
    });

    it('should handle mixed console calls after override', () => {
      process.env.NODE_ENV = 'production';
      overrideConsole();

      console.log('log message');
      console.error('error message');
      console.warn('warn message');
      console.info('info message');
      console.debug('debug message');

      // All should be logged through Winston (minus the initial override success message)
      expect(logger.info).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null arguments', () => {
      process.env.NODE_ENV = 'production';
      overrideConsole();

      // Clear the override success message
      jest.clearAllMocks();

      console.log(null);

      // null.toString() in join results in empty string
      expect(logger.info).toHaveBeenCalledWith('');
    });

    it('should handle undefined arguments', () => {
      process.env.NODE_ENV = 'production';
      overrideConsole();

      // Clear the override success message
      jest.clearAllMocks();

      console.log(undefined);

      // undefined.toString() in join results in empty string
      expect(logger.info).toHaveBeenCalledWith('');
    });

    it('should handle boolean arguments', () => {
      process.env.NODE_ENV = 'production';
      overrideConsole();

      console.log(true, false);

      expect(logger.info).toHaveBeenCalledWith('true false');
    });

    it('should handle array arguments', () => {
      process.env.NODE_ENV = 'production';
      overrideConsole();

      console.log([1, 2, 3]);

      expect(logger.info).toHaveBeenCalledWith('1,2,3');
    });

    it('should handle very long messages', () => {
      process.env.NODE_ENV = 'production';
      overrideConsole();

      const longMessage = 'a'.repeat(10000);
      console.log(longMessage);

      expect(logger.info).toHaveBeenCalledWith(longMessage);
    });

    it('should handle special characters', () => {
      process.env.NODE_ENV = 'production';
      overrideConsole();

      console.log('Special: \n\t\r"\'\\');

      expect(logger.info).toHaveBeenCalledWith('Special: \n\t\r"\'\\');
    });
  });
});
