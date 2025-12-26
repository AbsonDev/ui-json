/**
 * @jest-environment jsdom
 */

import {
  interpolateString,
  getNestedValue,
  resolveTemplate,
  hasTemplateVariables,
  extractTemplateVariables,
} from '../template-engine';

describe('Template Engine Utilities', () => {
  describe('interpolateString', () => {
    it('should interpolate simple variables', () => {
      const template = 'Hello {{name}}!';
      const context = { name: 'World' };

      expect(interpolateString(template, context)).toBe('Hello World!');
    });

    it('should interpolate multiple variables', () => {
      const template = '{{firstName}} {{lastName}} is {{age}} years old';
      const context = { firstName: 'John', lastName: 'Doe', age: 30 };

      expect(interpolateString(template, context)).toBe('John Doe is 30 years old');
    });

    it('should handle nested object properties', () => {
      const template = 'User: {{user.name}}, City: {{user.address.city}}';
      const context = {
        user: {
          name: 'John',
          address: {
            city: 'New York',
          },
        },
      };

      expect(interpolateString(template, context)).toBe('User: John, City: New York');
    });

    it('should replace missing variables with empty string', () => {
      const template = 'Hello {{name}}, you are {{age}} years old';
      const context = { name: 'John' };

      expect(interpolateString(template, context)).toBe('Hello John, you are  years old');
    });

    it('should handle variables with whitespace', () => {
      const template = 'Value: {{ name }}';
      const context = { name: 'Test' };

      expect(interpolateString(template, context)).toBe('Value: Test');
    });

    it('should convert numbers to strings', () => {
      const template = 'Count: {{count}}';
      const context = { count: 42 };

      expect(interpolateString(template, context)).toBe('Count: 42');
    });

    it('should convert booleans to strings', () => {
      const template = 'Active: {{isActive}}';
      const context = { isActive: true };

      expect(interpolateString(template, context)).toBe('Active: true');
    });

    it('should handle empty template', () => {
      expect(interpolateString('', { name: 'Test' })).toBe('');
    });

    it('should handle template without variables', () => {
      expect(interpolateString('Plain text', { name: 'Test' })).toBe('Plain text');
    });

    it('should handle same variable multiple times', () => {
      const template = '{{name}} said hello to {{name}}';
      const context = { name: 'John' };

      expect(interpolateString(template, context)).toBe('John said hello to John');
    });

    it('should handle null and undefined values', () => {
      const template = 'Value: {{value}}, Null: {{nullValue}}';
      const context = { value: undefined, nullValue: null };

      expect(interpolateString(template, context)).toBe('Value: , Null: ');
    });

    it('should handle special characters in values', () => {
      const template = 'Email: {{email}}';
      const context = { email: 'user@example.com' };

      expect(interpolateString(template, context)).toBe('Email: user@example.com');
    });

    it('should handle unicode characters', () => {
      const template = 'Greeting: {{greeting}}';
      const context = { greeting: 'こんにちは 🌍' };

      expect(interpolateString(template, context)).toBe('Greeting: こんにちは 🌍');
    });
  });

  describe('getNestedValue', () => {
    it('should get top-level properties', () => {
      const obj = { name: 'John', age: 30 };

      expect(getNestedValue(obj, 'name')).toBe('John');
      expect(getNestedValue(obj, 'age')).toBe(30);
    });

    it('should get nested properties with dot notation', () => {
      const obj = {
        user: {
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
            },
          },
        },
      };

      expect(getNestedValue(obj, 'user.profile.name')).toBe('John');
      expect(getNestedValue(obj, 'user.profile.settings.theme')).toBe('dark');
    });

    it('should return undefined for non-existent paths', () => {
      const obj = { user: { name: 'John' } };

      expect(getNestedValue(obj, 'user.age')).toBeUndefined();
      expect(getNestedValue(obj, 'nonexistent')).toBeUndefined();
      expect(getNestedValue(obj, 'user.profile.name')).toBeUndefined();
    });

    it('should handle array indices', () => {
      const obj = {
        users: [
          { name: 'John' },
          { name: 'Jane' },
        ],
      };

      expect(getNestedValue(obj, 'users.0.name')).toBe('John');
      expect(getNestedValue(obj, 'users.1.name')).toBe('Jane');
    });

    it('should handle mixed arrays and objects', () => {
      const obj = {
        data: {
          items: [
            { id: 1, tags: ['a', 'b'] },
            { id: 2, tags: ['c', 'd'] },
          ],
        },
      };

      expect(getNestedValue(obj, 'data.items.0.tags.1')).toBe('b');
    });

    it('should handle null and undefined in path', () => {
      const obj = {
        user: null,
        settings: undefined,
      };

      expect(getNestedValue(obj, 'user.name')).toBeUndefined();
      expect(getNestedValue(obj, 'settings.theme')).toBeUndefined();
    });

    it('should handle empty path', () => {
      const obj = { name: 'Test' };

      expect(getNestedValue(obj, '')).toEqual(obj);
    });

    it('should preserve falsy values', () => {
      const obj = {
        zero: 0,
        false: false,
        emptyString: '',
      };

      expect(getNestedValue(obj, 'zero')).toBe(0);
      expect(getNestedValue(obj, 'false')).toBe(false);
      expect(getNestedValue(obj, 'emptyString')).toBe('');
    });
  });

  describe('resolveTemplate', () => {
    it('should resolve simple string templates', () => {
      const template = 'Hello {{name}}';
      const context = { name: 'World' };

      expect(resolveTemplate(template, context)).toBe('Hello World');
    });

    it('should resolve simple variable references and preserve type', () => {
      const template = '{{count}}';
      const context = { count: 42 };

      expect(resolveTemplate(template, context)).toBe(42);
    });

    it('should resolve nested variable references', () => {
      const template = '{{user.name}}';
      const context = { user: { name: 'John' } };

      expect(resolveTemplate(template, context)).toBe('John');
    });

    it('should resolve object templates', () => {
      const template = {
        title: '{{title}}',
        user: '{{user.name}}',
        count: '{{count}}',
      };

      const context = {
        title: 'Dashboard',
        user: { name: 'John' },
        count: 42,
      };

      expect(resolveTemplate(template, context)).toEqual({
        title: 'Dashboard',
        user: 'John',
        count: 42,
      });
    });

    it('should resolve array templates', () => {
      const template = ['{{first}}', '{{second}}', '{{third}}'];
      const context = { first: 'A', second: 'B', third: 'C' };

      expect(resolveTemplate(template, context)).toEqual(['A', 'B', 'C']);
    });

    it('should resolve nested object/array combinations', () => {
      const template = {
        users: [
          { name: '{{user1.name}}', age: '{{user1.age}}' },
          { name: '{{user2.name}}', age: '{{user2.age}}' },
        ],
        title: '{{title}}',
      };

      const context = {
        title: 'User List',
        user1: { name: 'John', age: 30 },
        user2: { name: 'Jane', age: 25 },
      };

      expect(resolveTemplate(template, context)).toEqual({
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
        title: 'User List',
      });
    });

    it('should preserve non-template values', () => {
      const template = {
        static: 'Static Value',
        dynamic: '{{value}}',
        number: 42,
        boolean: true,
        null: null,
      };

      const context = { value: 'Dynamic' };

      expect(resolveTemplate(template, context)).toEqual({
        static: 'Static Value',
        dynamic: 'Dynamic',
        number: 42,
        boolean: true,
        null: null,
      });
    });

    it('should handle deeply nested templates', () => {
      const template = {
        level1: {
          level2: {
            level3: {
              value: '{{deep.value}}',
            },
          },
        },
      };

      const context = {
        deep: { value: 'Found!' },
      };

      expect(resolveTemplate(template, context)).toEqual({
        level1: {
          level2: {
            level3: {
              value: 'Found!',
            },
          },
        },
      });
    });

    it('should return original value for primitives', () => {
      expect(resolveTemplate(42, {})).toBe(42);
      expect(resolveTemplate(true, {})).toBe(true);
      expect(resolveTemplate(null, {})).toBe(null);
      expect(resolveTemplate(undefined, {})).toBeUndefined();
    });

    it('should preserve object references when no templates found', () => {
      const template = { name: 'John', age: 30 };
      const result = resolveTemplate(template, {});

      expect(result).toEqual(template);
    });
  });

  describe('hasTemplateVariables', () => {
    it('should return true for strings with template variables', () => {
      expect(hasTemplateVariables('Hello {{name}}')).toBe(true);
      expect(hasTemplateVariables('{{value}}')).toBe(true);
      expect(hasTemplateVariables('Start {{middle}} End')).toBe(true);
    });

    it('should return false for strings without template variables', () => {
      expect(hasTemplateVariables('Plain text')).toBe(false);
      expect(hasTemplateVariables('')).toBe(false);
      expect(hasTemplateVariables('No variables here')).toBe(false);
    });

    it('should handle multiple variables', () => {
      expect(hasTemplateVariables('{{first}} and {{second}}')).toBe(true);
    });

    it('should handle nested braces correctly', () => {
      expect(hasTemplateVariables('{not a template}')).toBe(false);
      expect(hasTemplateVariables('{{valid}}')).toBe(true);
    });

    it('should handle special characters in variable names', () => {
      expect(hasTemplateVariables('{{user.name}}')).toBe(true);
      expect(hasTemplateVariables('{{items.0.id}}')).toBe(true);
    });
  });

  describe('extractTemplateVariables', () => {
    it('should extract single variable', () => {
      const variables = extractTemplateVariables('Hello {{name}}');
      expect(variables).toEqual(['name']);
    });

    it('should extract multiple variables', () => {
      const variables = extractTemplateVariables('{{first}} {{last}} is {{age}}');
      expect(variables).toEqual(['first', 'last', 'age']);
    });

    it('should extract nested path variables', () => {
      const variables = extractTemplateVariables('{{user.name}} lives in {{user.city}}');
      expect(variables).toEqual(['user.name', 'user.city']);
    });

    it('should return empty array for no variables', () => {
      expect(extractTemplateVariables('Plain text')).toEqual([]);
      expect(extractTemplateVariables('')).toEqual([]);
    });

    it('should trim whitespace from variable names', () => {
      const variables = extractTemplateVariables('{{ name }} and {{ age }}');
      expect(variables).toEqual(['name', 'age']);
    });

    it('should handle duplicate variables', () => {
      const variables = extractTemplateVariables('{{name}} said hello to {{name}}');
      expect(variables).toEqual(['name', 'name']);
    });

    it('should extract variables with special characters', () => {
      const variables = extractTemplateVariables('{{user.profile.settings.theme}}');
      expect(variables).toEqual(['user.profile.settings.theme']);
    });

    it('should handle complex mixed content', () => {
      const template = 'User {{user.id}} ({{user.name}}) has {{count}} items';
      const variables = extractTemplateVariables(template);
      expect(variables).toEqual(['user.id', 'user.name', 'count']);
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle circular reference prevention in resolveTemplate', () => {
      const template = {
        name: '{{name}}',
        nested: {
          value: '{{value}}',
        },
      };

      const context = { name: 'Test', value: 'Nested' };

      expect(() => resolveTemplate(template, context)).not.toThrow();
    });

    it('should handle empty objects and arrays', () => {
      expect(resolveTemplate({}, { value: 'test' })).toEqual({});
      expect(resolveTemplate([], { value: 'test' })).toEqual([]);
    });

    it('should handle templates with only whitespace', () => {
      expect(interpolateString('   ', { name: 'test' })).toBe('   ');
    });

    it('should handle malformed template syntax gracefully', () => {
      // Single brace should be treated as literal
      expect(interpolateString('{name}', { name: 'John' })).toBe('{name}');

      // Incomplete template should be treated as literal
      expect(interpolateString('{{name', { name: 'John' })).toBe('{{name');
    });

    it('should handle very long property paths', () => {
      const obj = {
        a: { b: { c: { d: { e: { f: { g: { h: { i: { j: 'deep' } } } } } } } } },
      };

      expect(getNestedValue(obj, 'a.b.c.d.e.f.g.h.i.j')).toBe('deep');
    });

    it('should handle array of primitives', () => {
      const template = ['{{a}}', '{{b}}', '{{c}}'];
      const context = { a: 1, b: 2, c: 3 };

      expect(resolveTemplate(template, context)).toEqual([1, 2, 3]);
    });

    it('should handle mixed template and non-template strings', () => {
      const template = 'Prefix {{value}} Suffix';
      const context = { value: 'MIDDLE' };

      expect(interpolateString(template, context)).toBe('Prefix MIDDLE Suffix');
    });

    it('should handle objects with numeric keys', () => {
      const template = { '0': '{{first}}', '1': '{{second}}' };
      const context = { first: 'A', second: 'B' };

      expect(resolveTemplate(template, context)).toEqual({
        '0': 'A',
        '1': 'B',
      });
    });
  });
});
