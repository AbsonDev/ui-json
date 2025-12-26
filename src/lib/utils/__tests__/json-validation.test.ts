import {
  isValidJson,
  parseJsonSafe,
  parseJsonWithFallback,
  validateJsonSize,
  parseAndValidateJson,
} from '../json-validation';

describe('JSON Validation Utils', () => {
  describe('isValidJson', () => {
    it('should return true for valid JSON string', () => {
      expect(isValidJson('{"key":"value"}')).toBe(true);
    });

    it('should return true for valid JSON array', () => {
      expect(isValidJson('[1,2,3]')).toBe(true);
    });

    it('should return true for valid JSON number', () => {
      expect(isValidJson('123')).toBe(true);
    });

    it('should return true for valid JSON boolean', () => {
      expect(isValidJson('true')).toBe(true);
    });

    it('should return true for valid JSON null', () => {
      expect(isValidJson('null')).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(isValidJson('{}')).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(isValidJson('[]')).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(isValidJson('invalid')).toBe(false);
    });

    it('should return false for incomplete JSON', () => {
      expect(isValidJson('{"key":')).toBe(false);
    });

    it('should return false for single quotes', () => {
      expect(isValidJson("{'key':'value'}")).toBe(false);
    });

    it('should return false for trailing comma', () => {
      expect(isValidJson('{"key":"value",}')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidJson('undefined')).toBe(false);
    });
  });

  describe('parseJsonSafe', () => {
    it('should parse valid JSON object', () => {
      const result = parseJsonSafe('{"key":"value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should parse valid JSON array', () => {
      const result = parseJsonSafe('[1,2,3]');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return null for invalid JSON', () => {
      const result = parseJsonSafe('invalid');
      expect(result).toBeNull();
    });

    it('should return null for incomplete JSON', () => {
      const result = parseJsonSafe('{"key":');
      expect(result).toBeNull();
    });

    it('should parse nested objects', () => {
      const result = parseJsonSafe('{"a":{"b":{"c":1}}}');
      expect(result).toEqual({ a: { b: { c: 1 } } });
    });

    it('should parse complex structures', () => {
      const json = '{"users":[{"name":"John","age":30},{"name":"Jane","age":25}]}';
      const result = parseJsonSafe(json);
      expect(result).toEqual({
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
      });
    });

    it('should handle typed parsing', () => {
      interface User {
        name: string;
        age: number;
      }
      const result = parseJsonSafe<User>('{"name":"John","age":30}');
      expect(result).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('parseJsonWithFallback', () => {
    it('should parse valid JSON', () => {
      const result = parseJsonWithFallback('{"key":"value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return fallback for invalid JSON', () => {
      const fallback = { default: true };
      const result = parseJsonWithFallback('invalid', fallback);
      expect(result).toBe(fallback);
    });

    it('should return fallback for incomplete JSON', () => {
      const fallback = [];
      const result = parseJsonWithFallback('{"key":', fallback);
      expect(result).toBe(fallback);
    });

    it('should work with array fallback', () => {
      const fallback = [1, 2, 3];
      const result = parseJsonWithFallback('invalid', fallback);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should work with null fallback', () => {
      const result = parseJsonWithFallback('invalid', null);
      expect(result).toBeNull();
    });

    it('should work with string fallback', () => {
      const result = parseJsonWithFallback('invalid', 'fallback');
      expect(result).toBe('fallback');
    });

    it('should parse even if fallback is same type', () => {
      const fallback = { fallback: true };
      const result = parseJsonWithFallback('{"parsed":true}', fallback);
      expect(result).toEqual({ parsed: true });
    });
  });

  describe('validateJsonSize', () => {
    it('should return true for small JSON', () => {
      const json = '{"key":"value"}';
      expect(validateJsonSize(json, 1000)).toBe(true);
    });

    it('should return false for large JSON', () => {
      const json = '{"key":"value"}';
      expect(validateJsonSize(json, 5)).toBe(false);
    });

    it('should handle exact size match', () => {
      const json = 'a';
      const size = new Blob([json]).size;
      expect(validateJsonSize(json, size)).toBe(true);
    });

    it('should handle one byte over limit', () => {
      const json = 'ab';
      const size = new Blob([json]).size;
      expect(validateJsonSize(json, size - 1)).toBe(false);
    });

    it('should handle empty string', () => {
      expect(validateJsonSize('', 100)).toBe(true);
    });

    it('should handle large JSON objects', () => {
      const largeJson = JSON.stringify({ data: 'x'.repeat(10000) });
      expect(validateJsonSize(largeJson, 100)).toBe(false);
    });

    it('should handle unicode characters', () => {
      const json = '{"emoji":"🚀"}';
      const size = new Blob([json]).size;
      expect(validateJsonSize(json, size)).toBe(true);
    });
  });

  describe('parseAndValidateJson', () => {
    it('should parse valid JSON without validator', () => {
      const result = parseAndValidateJson('{"key":"value"}');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ key: 'value' });
      }
    });

    it('should return error for invalid JSON', () => {
      const result = parseAndValidateJson('invalid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
      }
    });

    it('should validate with custom validator', () => {
      const validator = (data: any) => typeof data.name === 'string';
      const result = parseAndValidateJson('{"name":"John"}', validator);
      expect(result.success).toBe(true);
    });

    it('should fail validation with custom validator', () => {
      const validator = (data: any) => typeof data.name === 'string';
      const result = parseAndValidateJson('{"age":30}', validator);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('JSON structure validation failed');
      }
    });

    it('should validate array structure', () => {
      const validator = (data: any) => Array.isArray(data) && data.length > 0;
      const result = parseAndValidateJson('[1,2,3]', validator);
      expect(result.success).toBe(true);
    });

    it('should fail validation for empty array', () => {
      const validator = (data: any) => Array.isArray(data) && data.length > 0;
      const result = parseAndValidateJson('[]', validator);
      expect(result.success).toBe(false);
    });

    it('should validate nested properties', () => {
      const validator = (data: any) => data.user && data.user.email;
      const result = parseAndValidateJson('{"user":{"email":"test@test.com"}}', validator);
      expect(result.success).toBe(true);
    });

    it('should fail validation for missing nested properties', () => {
      const validator = (data: any) => data.user && data.user.email;
      const result = parseAndValidateJson('{"user":{}}', validator);
      expect(result.success).toBe(false);
    });

    it('should handle Error object in catch', () => {
      const result = parseAndValidateJson('{"key":');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('JSON');
      }
    });

    it('should work with typed validation', () => {
      interface User {
        name: string;
        age: number;
      }
      const validator = (data: any): data is User =>
        typeof data.name === 'string' && typeof data.age === 'number';
      
      const result = parseAndValidateJson<User>('{"name":"John","age":30}', validator);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        expect(result.data.age).toBe(30);
      }
    });

    it('should return correct data type', () => {
      const result = parseAndValidateJson('[1,2,3]');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
