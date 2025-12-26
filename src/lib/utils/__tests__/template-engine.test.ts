import {
  interpolateString,
  getNestedValue,
  resolveTemplate,
  hasTemplateVariables,
  extractTemplateVariables,
} from '../template-engine';

describe('Template Engine Utils', () => {
  describe('interpolateString', () => {
    it('should interpolate simple variable', () => {
      const result = interpolateString('Hello {{name}}', { name: 'World' });
      expect(result).toBe('Hello World');
    });

    it('should interpolate multiple variables', () => {
      const result = interpolateString('{{greeting}} {{name}}!', {
        greeting: 'Hello',
        name: 'World',
      });
      expect(result).toBe('Hello World!');
    });

    it('should handle nested properties', () => {
      const result = interpolateString('Hello {{user.name}}', {
        user: { name: 'John' },
      });
      expect(result).toBe('Hello John');
    });

    it('should handle deep nesting', () => {
      const result = interpolateString('Value: {{a.b.c.d}}', {
        a: { b: { c: { d: 'deep' } } },
      });
      expect(result).toBe('Value: deep');
    });

    it('should return empty string for undefined values', () => {
      const result = interpolateString('Hello {{missing}}', {});
      expect(result).toBe('Hello ');
    });

    it('should return empty string for null values', () => {
      const result = interpolateString('Hello {{value}}', { value: null });
      expect(result).toBe('Hello ');
    });

    it('should convert numbers to strings', () => {
      const result = interpolateString('Count: {{count}}', { count: 42 });
      expect(result).toBe('Count: 42');
    });

    it('should convert booleans to strings', () => {
      const result = interpolateString('Active: {{active}}', { active: true });
      expect(result).toBe('Active: true');
    });

    it('should handle variables with spaces', () => {
      const result = interpolateString('Hello {{ name }}', { name: 'World' });
      expect(result).toBe('Hello World');
    });

    it('should handle multiple occurrences of same variable', () => {
      const result = interpolateString('{{x}} and {{x}} and {{x}}', { x: 'A' });
      expect(result).toBe('A and A and A');
    });

    it('should handle template without variables', () => {
      const result = interpolateString('Just plain text', {});
      expect(result).toBe('Just plain text');
    });

    it('should handle empty template', () => {
      const result = interpolateString('', { name: 'World' });
      expect(result).toBe('');
    });

    it('should handle arrays as string', () => {
      const result = interpolateString('List: {{items}}', { items: [1, 2, 3] });
      expect(result).toBe('List: 1,2,3');
    });

    it('should handle objects as string', () => {
      const result = interpolateString('Object: {{obj}}', { obj: { a: 1 } });
      expect(result).toBe('Object: [object Object]');
    });
  });

  describe('getNestedValue', () => {
    it('should get top-level value', () => {
      const result = getNestedValue({ name: 'John' }, 'name');
      expect(result).toBe('John');
    });

    it('should get nested value', () => {
      const result = getNestedValue({ user: { name: 'John' } }, 'user.name');
      expect(result).toBe('John');
    });

    it('should get deeply nested value', () => {
      const obj = { a: { b: { c: { d: 'value' } } } };
      const result = getNestedValue(obj, 'a.b.c.d');
      expect(result).toBe('value');
    });

    it('should return undefined for missing path', () => {
      const result = getNestedValue({ name: 'John' }, 'missing');
      expect(result).toBeUndefined();
    });

    it('should return undefined for missing nested path', () => {
      const result = getNestedValue({ user: {} }, 'user.name');
      expect(result).toBeUndefined();
    });

    it('should handle null values in path', () => {
      const result = getNestedValue({ user: null }, 'user.name');
      expect(result).toBeUndefined();
    });

    it('should handle undefined values in path', () => {
      const result = getNestedValue({ user: undefined }, 'user.name');
      expect(result).toBeUndefined();
    });

    it('should get array element', () => {
      const result = getNestedValue({ items: ['a', 'b', 'c'] }, 'items.1');
      expect(result).toBe('b');
    });

    it('should handle numeric values', () => {
      const result = getNestedValue({ count: 42 }, 'count');
      expect(result).toBe(42);
    });

    it('should handle boolean values', () => {
      const result = getNestedValue({ active: true }, 'active');
      expect(result).toBe(true);
    });
  });

  describe('resolveTemplate', () => {
    it('should resolve simple string variable', () => {
      const result = resolveTemplate('{{name}}', { name: 'John' });
      expect(result).toBe('John');
    });

    it('should resolve string interpolation', () => {
      const result = resolveTemplate('Hello {{name}}', { name: 'John' });
      expect(result).toBe('Hello John');
    });

    it('should resolve object variable reference', () => {
      const obj = { id: 1, name: 'Test' };
      const result = resolveTemplate('{{data}}', { data: obj });
      expect(result).toEqual(obj);
    });

    it('should resolve array variable reference', () => {
      const arr = [1, 2, 3];
      const result = resolveTemplate('{{items}}', { items: arr });
      expect(result).toEqual(arr);
    });

    it('should resolve array of templates', () => {
      const template = ['{{a}}', '{{b}}', '{{c}}'];
      const result = resolveTemplate(template, { a: 1, b: 2, c: 3 });
      expect(result).toEqual([1, 2, 3]);
    });

    it('should resolve object with template values', () => {
      const template = { name: '{{user.name}}', age: '{{user.age}}' };
      const result = resolveTemplate(template, { user: { name: 'John', age: 30 } });
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should resolve nested objects', () => {
      const template = { user: { name: '{{name}}' } };
      const result = resolveTemplate(template, { name: 'John' });
      expect(result).toEqual({ user: { name: 'John' } });
    });

    it('should resolve array of objects', () => {
      const template = [{ name: '{{name1}}' }, { name: '{{name2}}' }];
      const result = resolveTemplate(template, { name1: 'John', name2: 'Jane' });
      expect(result).toEqual([{ name: 'John' }, { name: 'Jane' }]);
    });

    it('should preserve non-template strings', () => {
      const result = resolveTemplate('plain text', {});
      expect(result).toBe('plain text');
    });

    it('should preserve numbers', () => {
      const result = resolveTemplate(42, {});
      expect(result).toBe(42);
    });

    it('should preserve booleans', () => {
      const result = resolveTemplate(true, {});
      expect(result).toBe(true);
    });

    it('should preserve null', () => {
      const result = resolveTemplate(null, {});
      expect(result).toBeNull();
    });

    it('should preserve undefined', () => {
      const result = resolveTemplate(undefined, {});
      expect(result).toBeUndefined();
    });

    it('should handle complex nested structure', () => {
      const template = {
        title: '{{title}}',
        user: {
          name: '{{user.name}}',
          email: '{{user.email}}',
        },
        items: ['{{item1}}', '{{item2}}'],
      };

      const context = {
        title: 'Dashboard',
        user: { name: 'John', email: 'john@example.com' },
        item1: 'First',
        item2: 'Second',
      };

      const result = resolveTemplate(template, context);

      expect(result).toEqual({
        title: 'Dashboard',
        user: {
          name: 'John',
          email: 'john@example.com',
        },
        items: ['First', 'Second'],
      });
    });

    it('should return original template if variable not found', () => {
      const result = resolveTemplate('{{missing}}', {});
      expect(result).toBe('{{missing}}');
    });
  });

  describe('hasTemplateVariables', () => {
    it('should return true for simple variable', () => {
      expect(hasTemplateVariables('{{name}}')).toBe(true);
    });

    it('should return true for multiple variables', () => {
      expect(hasTemplateVariables('{{a}} and {{b}}')).toBe(true);
    });

    it('should return true for nested variable', () => {
      expect(hasTemplateVariables('{{user.name}}')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(hasTemplateVariables('plain text')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasTemplateVariables('')).toBe(false);
    });

    it('should return false for single brace', () => {
      expect(hasTemplateVariables('{name}')).toBe(false);
    });

    it('should return false for triple brace', () => {
      expect(hasTemplateVariables('{{{name}}}')).toBe(true);
    });

    it('should return true for variables with spaces', () => {
      expect(hasTemplateVariables('{{ name }}')).toBe(true);
    });

    it('should return true for adjacent variables', () => {
      expect(hasTemplateVariables('{{a}}{{b}}')).toBe(true);
    });
  });

  describe('extractTemplateVariables', () => {
    it('should extract single variable', () => {
      const result = extractTemplateVariables('{{name}}');
      expect(result).toEqual(['name']);
    });

    it('should extract multiple variables', () => {
      const result = extractTemplateVariables('{{first}} and {{second}}');
      expect(result).toEqual(['first', 'second']);
    });

    it('should extract nested variables', () => {
      const result = extractTemplateVariables('{{user.name}} and {{user.email}}');
      expect(result).toEqual(['user.name', 'user.email']);
    });

    it('should return empty array for no variables', () => {
      const result = extractTemplateVariables('plain text');
      expect(result).toEqual([]);
    });

    it('should trim whitespace from variables', () => {
      const result = extractTemplateVariables('{{ name }} and {{ email }}');
      expect(result).toEqual(['name', 'email']);
    });

    it('should handle duplicate variables', () => {
      const result = extractTemplateVariables('{{x}} and {{x}}');
      expect(result).toEqual(['x', 'x']);
    });

    it('should handle variables in complex text', () => {
      const result = extractTemplateVariables('Hello {{name}}, your email is {{email}}!');
      expect(result).toEqual(['name', 'email']);
    });

    it('should handle empty string', () => {
      const result = extractTemplateVariables('');
      expect(result).toEqual([]);
    });

    it('should handle adjacent variables', () => {
      const result = extractTemplateVariables('{{a}}{{b}}{{c}}');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle deeply nested paths', () => {
      const result = extractTemplateVariables('{{a.b.c.d}}');
      expect(result).toEqual(['a.b.c.d']);
    });
  });
});
