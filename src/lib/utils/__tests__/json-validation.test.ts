/**
 * @jest-environment jsdom
 */

import {
  isValidJson,
  parseJsonSafe,
  parseJsonWithFallback,
  validateJsonSize,
  parseAndValidateJson,
} from '../json-validation';

describe('JSON Validation Utilities', () => {
  describe('isValidJson', () => {
    it('should return true for valid JSON string', () => {
      expect(isValidJson('{"name": "John", "age": 30}')).toBe(true);
      expect(isValidJson('["apple", "banana", "orange"]')).toBe(true);
      expect(isValidJson('"hello world"')).toBe(true);
      expect(isValidJson('123')).toBe(true);
      expect(isValidJson('true')).toBe(true);
      expect(isValidJson('null')).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(isValidJson('{name: "John"}')).toBe(false); // missing quotes
      expect(isValidJson('{"name": undefined}')).toBe(false); // undefined not allowed
      expect(isValidJson('{"name": "John",}')).toBe(false); // trailing comma
      expect(isValidJson('{invalid}')).toBe(false);
      expect(isValidJson('')).toBe(false);
      expect(isValidJson('undefined')).toBe(false);
    });

    it('should handle empty objects and arrays', () => {
      expect(isValidJson('{}')).toBe(true);
      expect(isValidJson('[]')).toBe(true);
    });

    it('should handle nested JSON', () => {
      const nested = JSON.stringify({
        user: {
          name: 'John',
          address: {
            city: 'NYC',
            zip: 10001,
          },
        },
      });

      expect(isValidJson(nested)).toBe(true);
    });

    it('should handle special characters', () => {
      expect(isValidJson('{"text": "Hello\\nWorld"}')).toBe(true);
      expect(isValidJson('{"emoji": "🚀"}')).toBe(true);
      expect(isValidJson('{"quote": "\\"test\\""}')).toBe(true);
    });
  });

  describe('parseJsonSafe', () => {
    it('should parse valid JSON and return object', () => {
      const result = parseJsonSafe('{"name": "John", "age": 30}');
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should return null for invalid JSON', () => {
      expect(parseJsonSafe('{invalid}')).toBeNull();
      expect(parseJsonSafe('undefined')).toBeNull();
      expect(parseJsonSafe('')).toBeNull();
    });

    it('should handle arrays', () => {
      const result = parseJsonSafe('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle primitives', () => {
      expect(parseJsonSafe('123')).toBe(123);
      expect(parseJsonSafe('"hello"')).toBe('hello');
      expect(parseJsonSafe('true')).toBe(true);
      expect(parseJsonSafe('null')).toBeNull();
    });

    it('should handle complex nested structures', () => {
      const complex = {
        users: [
          { id: 1, name: 'John', tags: ['admin', 'user'] },
          { id: 2, name: 'Jane', tags: ['user'] },
        ],
        settings: {
          theme: 'dark',
          notifications: true,
        },
      };

      const result = parseJsonSafe(JSON.stringify(complex));
      expect(result).toEqual(complex);
    });

    it('should handle unicode and special characters', () => {
      const result = parseJsonSafe('{"text": "Hello 世界 🌍"}');
      expect(result).toEqual({ text: 'Hello 世界 🌍' });
    });
  });

  describe('parseJsonWithFallback', () => {
    it('should parse valid JSON', () => {
      const result = parseJsonWithFallback('{"name": "John"}', { name: 'Default' });
      expect(result).toEqual({ name: 'John' });
    });

    it('should return fallback for invalid JSON', () => {
      const fallback = { name: 'Default', age: 0 };
      const result = parseJsonWithFallback('{invalid}', fallback);
      expect(result).toBe(fallback);
    });

    it('should work with array fallbacks', () => {
      const fallback = [1, 2, 3];
      expect(parseJsonWithFallback('{invalid}', fallback)).toEqual(fallback);
      expect(parseJsonWithFallback('[4, 5, 6]', fallback)).toEqual([4, 5, 6]);
    });

    it('should work with primitive fallbacks', () => {
      expect(parseJsonWithFallback('invalid', 'default')).toBe('default');
      expect(parseJsonWithFallback('"valid"', 'default')).toBe('valid');

      expect(parseJsonWithFallback('invalid', 0)).toBe(0);
      expect(parseJsonWithFallback('42', 0)).toBe(42);

      expect(parseJsonWithFallback('invalid', false)).toBe(false);
      expect(parseJsonWithFallback('true', false)).toBe(true);
    });

    it('should not modify fallback object', () => {
      const fallback = { name: 'Default' };
      const originalFallback = { ...fallback };

      parseJsonWithFallback('{invalid}', fallback);

      expect(fallback).toEqual(originalFallback);
    });
  });

  describe('validateJsonSize', () => {
    it('should return true for JSON under size limit', () => {
      const smallJson = '{"name": "John"}';
      expect(validateJsonSize(smallJson, 1000)).toBe(true);
    });

    it('should return false for JSON over size limit', () => {
      const largeJson = JSON.stringify({ data: 'x'.repeat(10000) });
      expect(validateJsonSize(largeJson, 100)).toBe(false);
    });

    it('should handle exact size limit', () => {
      const json = '{"key": "value"}';
      const exactSize = new Blob([json]).size;

      expect(validateJsonSize(json, exactSize)).toBe(true);
      expect(validateJsonSize(json, exactSize - 1)).toBe(false);
    });

    it('should handle empty JSON', () => {
      expect(validateJsonSize('{}', 10)).toBe(true);
      expect(validateJsonSize('[]', 10)).toBe(true);
    });

    it('should handle unicode characters correctly in size calculation', () => {
      const unicodeJson = '{"emoji": "🚀"}';
      const size = new Blob([unicodeJson]).size;

      // Emoji takes more bytes than regular characters
      expect(size).toBeGreaterThan(unicodeJson.length - 4);
      expect(validateJsonSize(unicodeJson, size)).toBe(true);
      expect(validateJsonSize(unicodeJson, size - 1)).toBe(false);
    });

    it('should handle large JSON objects', () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: 'A'.repeat(100),
        })),
      };

      const json = JSON.stringify(largeObject);
      const size = new Blob([json]).size;

      expect(validateJsonSize(json, size + 1000)).toBe(true);
      expect(validateJsonSize(json, 1000)).toBe(false);
    });
  });

  describe('parseAndValidateJson', () => {
    it('should successfully parse and validate JSON without validator', () => {
      const result = parseAndValidateJson('{"name": "John", "age": 30}');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'John', age: 30 });
      }
    });

    it('should fail for invalid JSON', () => {
      const result = parseAndValidateJson('{invalid}');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });

    it('should validate with custom validator - success', () => {
      const validator = (data: any) => {
        return data.name && typeof data.name === 'string';
      };

      const result = parseAndValidateJson('{"name": "John"}', validator);

      expect(result.success).toBe(true);
    });

    it('should validate with custom validator - failure', () => {
      const validator = (data: any) => {
        return data.name && typeof data.name === 'string';
      };

      const result = parseAndValidateJson('{"age": 30}', validator);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('JSON structure validation failed');
      }
    });

    it('should validate complex structure with custom validator', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const validator = (data: any): data is User => {
        return (
          typeof data.id === 'number' &&
          typeof data.name === 'string' &&
          typeof data.email === 'string' &&
          data.email.includes('@')
        );
      };

      const validUser = '{"id": 1, "name": "John", "email": "john@example.com"}';
      const invalidUser = '{"id": 1, "name": "John", "email": "invalid"}';

      const result1 = parseAndValidateJson<User>(validUser, validator);
      expect(result1.success).toBe(true);

      const result2 = parseAndValidateJson<User>(invalidUser, validator);
      expect(result2.success).toBe(false);
    });

    it('should handle arrays with validator', () => {
      const validator = (data: any) => {
        return Array.isArray(data) && data.length > 0;
      };

      const result1 = parseAndValidateJson('[1, 2, 3]', validator);
      expect(result1.success).toBe(true);

      const result2 = parseAndValidateJson('[]', validator);
      expect(result2.success).toBe(false);
    });

    it('should provide meaningful error messages', () => {
      const result1 = parseAndValidateJson('{invalid JSON}');
      expect(result1.success).toBe(false);
      if (!result1.success) {
        expect(result1.error).toContain('JSON');
      }

      const validator = () => false;
      const result2 = parseAndValidateJson('{"valid": "json"}', validator);
      expect(result2.success).toBe(false);
      if (!result2.success) {
        expect(result2.error).toBe('JSON structure validation failed');
      }
    });

    it('should preserve type information with generics', () => {
      interface Config {
        theme: string;
        settings: {
          darkMode: boolean;
        };
      }

      const result = parseAndValidateJson<Config>(
        '{"theme": "dark", "settings": {"darkMode": true}}'
      );

      if (result.success) {
        // TypeScript should recognize these properties
        expect(result.data.theme).toBe('dark');
        expect(result.data.settings.darkMode).toBe(true);
      }
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle extremely nested JSON', () => {
      let nested: any = { value: 1 };
      for (let i = 0; i < 100; i++) {
        nested = { child: nested };
      }

      const json = JSON.stringify(nested);
      expect(isValidJson(json)).toBe(true);
      expect(parseJsonSafe(json)).toEqual(nested);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(100000);
      const json = JSON.stringify({ text: longString });

      expect(isValidJson(json)).toBe(true);
      const result = parseJsonSafe(json);
      expect(result?.text).toBe(longString);
    });

    it('should handle null prototype objects safely', () => {
      const obj = Object.create(null);
      obj.key = 'value';

      const json = JSON.stringify(obj);
      expect(isValidJson(json)).toBe(true);
    });

    it('should reject __proto__ pollution attempts', () => {
      const malicious = '{"__proto__": {"polluted": true}}';
      const result = parseJsonSafe(malicious);

      // Should parse but not pollute Object.prototype
      expect(result).toBeTruthy();
      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it('should handle different number formats', () => {
      expect(parseJsonSafe('123')).toBe(123);
      expect(parseJsonSafe('123.456')).toBe(123.456);
      expect(parseJsonSafe('-123')).toBe(-123);
      expect(parseJsonSafe('0')).toBe(0);
      expect(parseJsonSafe('1e10')).toBe(1e10);
    });

    it('should handle special JSON values', () => {
      expect(parseJsonSafe('null')).toBeNull();
      expect(parseJsonSafe('true')).toBe(true);
      expect(parseJsonSafe('false')).toBe(false);
    });
  });
});
