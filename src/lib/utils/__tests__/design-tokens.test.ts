/**
 * Tests for Design Tokens Utilities
 */

import {
  resolveToken,
  isTokenReference,
  resolveAllTokens,
  getTokenValue,
  validateTokenReferences,
} from '../design-tokens';

describe('Design Tokens Utilities', () => {
  const mockTokens = {
    primaryColor: '#FF0000',
    secondaryColor: '#00FF00',
    fontSize: '16px',
    spacing: 8,
    isActive: true,
    config: { theme: 'dark' },
  };

  describe('resolveToken', () => {
    it('should resolve token reference with $ prefix', () => {
      const result = resolveToken('$primaryColor', mockTokens);
      expect(result).toBe('#FF0000');
    });

    it('should return original value if not a token reference', () => {
      const result = resolveToken('normalString', mockTokens);
      expect(result).toBe('normalString');
    });

    it('should return original value if token not found', () => {
      const result = resolveToken('$unknownToken', mockTokens);
      expect(result).toBe('$unknownToken');
    });

    it('should resolve numeric token', () => {
      const result = resolveToken('$spacing', mockTokens);
      expect(result).toBe(8);
    });

    it('should resolve boolean token', () => {
      const result = resolveToken('$isActive', mockTokens);
      expect(result).toBe(true);
    });

    it('should resolve object token', () => {
      const result = resolveToken('$config', mockTokens);
      expect(result).toEqual({ theme: 'dark' });
    });

    it('should handle non-string values', () => {
      expect(resolveToken(123, mockTokens)).toBe(123);
      expect(resolveToken(true, mockTokens)).toBe(true);
      expect(resolveToken(null, mockTokens)).toBe(null);
      expect(resolveToken(undefined, mockTokens)).toBe(undefined);
    });

    it('should handle empty tokens object', () => {
      const result = resolveToken('$primaryColor', {});
      expect(result).toBe('$primaryColor');
    });

    it('should handle token with value 0', () => {
      const result = resolveToken('$zero', { zero: 0 });
      expect(result).toBe(0);
    });

    it('should handle token with value false', () => {
      const result = resolveToken('$falseValue', { falseValue: false });
      expect(result).toBe(false);
    });

    it('should handle token with value empty string', () => {
      const result = resolveToken('$empty', { empty: '' });
      expect(result).toBe('');
    });
  });

  describe('isTokenReference', () => {
    it('should return true for token reference', () => {
      expect(isTokenReference('$primaryColor')).toBe(true);
    });

    it('should return false for normal string', () => {
      expect(isTokenReference('normalString')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isTokenReference('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isTokenReference(123)).toBe(false);
      expect(isTokenReference(true)).toBe(false);
      expect(isTokenReference(null)).toBe(false);
      expect(isTokenReference(undefined)).toBe(false);
      expect(isTokenReference({})).toBe(false);
      expect(isTokenReference([])).toBe(false);
    });

    it('should return true for $ followed by any characters', () => {
      expect(isTokenReference('$a')).toBe(true);
      expect(isTokenReference('$123')).toBe(true);
      expect(isTokenReference('$-test')).toBe(true);
    });

    it('should return true for only $', () => {
      expect(isTokenReference('$')).toBe(true);
    });

    it('should return false for $ not at start', () => {
      expect(isTokenReference('test$token')).toBe(false);
      expect(isTokenReference(' $token')).toBe(false);
    });
  });

  describe('resolveAllTokens', () => {
    it('should resolve string token', () => {
      const result = resolveAllTokens('$primaryColor', mockTokens);
      expect(result).toBe('#FF0000');
    });

    it('should resolve tokens in object', () => {
      const input = {
        color: '$primaryColor',
        size: '$fontSize',
      };

      const result = resolveAllTokens(input, mockTokens);

      expect(result).toEqual({
        color: '#FF0000',
        size: '16px',
      });
    });

    it('should resolve tokens in array', () => {
      const input = ['$primaryColor', '$secondaryColor', 'normalValue'];

      const result = resolveAllTokens(input, mockTokens);

      expect(result).toEqual(['#FF0000', '#00FF00', 'normalValue']);
    });

    it('should resolve tokens in nested objects', () => {
      const input = {
        theme: {
          colors: {
            primary: '$primaryColor',
            secondary: '$secondaryColor',
          },
          typography: {
            base: '$fontSize',
          },
        },
      };

      const result = resolveAllTokens(input, mockTokens);

      expect(result).toEqual({
        theme: {
          colors: {
            primary: '#FF0000',
            secondary: '#00FF00',
          },
          typography: {
            base: '16px',
          },
        },
      });
    });

    it('should resolve tokens in nested arrays', () => {
      const input = [
        ['$primaryColor', '$secondaryColor'],
        ['$fontSize'],
      ];

      const result = resolveAllTokens(input, mockTokens);

      expect(result).toEqual([
        ['#FF0000', '#00FF00'],
        ['16px'],
      ]);
    });

    it('should handle mixed structures', () => {
      const input = {
        colors: ['$primaryColor', '$secondaryColor'],
        config: {
          active: '$isActive',
          spacing: '$spacing',
        },
      };

      const result = resolveAllTokens(input, mockTokens);

      expect(result).toEqual({
        colors: ['#FF0000', '#00FF00'],
        config: {
          active: true,
          spacing: 8,
        },
      });
    });

    it('should preserve non-token values', () => {
      const input = {
        color: 'blue',
        size: 100,
        active: false,
      };

      const result = resolveAllTokens(input, mockTokens);

      expect(result).toEqual(input);
    });

    it('should handle unknown tokens', () => {
      const input = {
        color: '$unknownToken',
        size: '$fontSize',
      };

      const result = resolveAllTokens(input, mockTokens);

      expect(result).toEqual({
        color: '$unknownToken',
        size: '16px',
      });
    });

    it('should handle null and undefined', () => {
      expect(resolveAllTokens(null, mockTokens)).toBeNull();
      expect(resolveAllTokens(undefined, mockTokens)).toBeUndefined();
    });

    it('should handle primitive values', () => {
      expect(resolveAllTokens(123, mockTokens)).toBe(123);
      expect(resolveAllTokens(true, mockTokens)).toBe(true);
    });

    it('should handle empty object', () => {
      const result = resolveAllTokens({}, mockTokens);
      expect(result).toEqual({});
    });

    it('should handle empty array', () => {
      const result = resolveAllTokens([], mockTokens);
      expect(result).toEqual([]);
    });

    it('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              level4: {
                color: '$primaryColor',
              },
            },
          },
        },
      };

      const result = resolveAllTokens(input, mockTokens);

      expect(result.level1.level2.level3.level4.color).toBe('#FF0000');
    });
  });

  describe('getTokenValue', () => {
    it('should get token value by name', () => {
      const result = getTokenValue('primaryColor', mockTokens);
      expect(result).toBe('#FF0000');
    });

    it('should return undefined for unknown token without fallback', () => {
      const result = getTokenValue('unknownToken', mockTokens);
      expect(result).toBeUndefined();
    });

    it('should return fallback for unknown token', () => {
      const result = getTokenValue('unknownToken', mockTokens, 'default');
      expect(result).toBe('default');
    });

    it('should handle token with value 0', () => {
      const result = getTokenValue('zero', { zero: 0 });
      expect(result).toBe(0);
    });

    it('should handle token with value false', () => {
      const result = getTokenValue('falseValue', { falseValue: false });
      expect(result).toBe(false);
    });

    it('should handle token with value empty string', () => {
      const result = getTokenValue('empty', { empty: '' });
      expect(result).toBe('');
    });

    it('should return token value even if it equals fallback', () => {
      const result = getTokenValue('primaryColor', mockTokens, '#FF0000');
      expect(result).toBe('#FF0000');
    });

    it('should handle empty tokens object', () => {
      const result = getTokenValue('anyToken', {}, 'fallback');
      expect(result).toBe('fallback');
    });

    it('should handle numeric fallback', () => {
      const result = getTokenValue('unknownToken', mockTokens, 42);
      expect(result).toBe(42);
    });

    it('should handle object fallback', () => {
      const fallback = { default: true };
      const result = getTokenValue('unknownToken', mockTokens, fallback);
      expect(result).toEqual(fallback);
    });

    it('should get nested token value', () => {
      const tokensWithNested = { nested: { value: 'test' } };
      const result = getTokenValue('nested', tokensWithNested);
      expect(result).toEqual({ value: 'test' });
    });
  });

  describe('validateTokenReferences', () => {
    it('should return valid for object with all tokens present', () => {
      const obj = {
        color: '$primaryColor',
        size: '$fontSize',
      };

      const result = validateTokenReferences(obj, mockTokens);

      expect(result.valid).toBe(true);
    });

    it('should return invalid with missing tokens', () => {
      const obj = {
        color: '$unknownToken',
        size: '$fontSize',
      };

      const result = validateTokenReferences(obj, mockTokens);

      expect(result.valid).toBe(false);
      expect((result as any).missingTokens).toContain('unknownToken');
    });

    it('should find multiple missing tokens', () => {
      const obj = {
        color: '$unknownToken1',
        bg: '$unknownToken2',
        size: '$fontSize',
      };

      const result = validateTokenReferences(obj, mockTokens);

      expect(result.valid).toBe(false);
      expect((result as any).missingTokens).toHaveLength(2);
      expect((result as any).missingTokens).toContain('unknownToken1');
      expect((result as any).missingTokens).toContain('unknownToken2');
    });

    it('should validate tokens in arrays', () => {
      const obj = ['$primaryColor', '$unknownToken'];

      const result = validateTokenReferences(obj, mockTokens);

      expect(result.valid).toBe(false);
      expect((result as any).missingTokens).toContain('unknownToken');
    });

    it('should validate tokens in nested objects', () => {
      const obj = {
        theme: {
          colors: {
            primary: '$primaryColor',
            tertiary: '$unknownToken',
          },
        },
      };

      const result = validateTokenReferences(obj, mockTokens);

      expect(result.valid).toBe(false);
      expect((result as any).missingTokens).toContain('unknownToken');
    });

    it('should validate tokens in nested arrays', () => {
      const obj = {
        colors: [
          ['$primaryColor', '$secondaryColor'],
          ['$unknownToken'],
        ],
      };

      const result = validateTokenReferences(obj, mockTokens);

      expect(result.valid).toBe(false);
      expect((result as any).missingTokens).toContain('unknownToken');
    });

    it('should handle objects with no tokens', () => {
      const obj = {
        color: 'blue',
        size: 100,
      };

      const result = validateTokenReferences(obj, mockTokens);

      expect(result.valid).toBe(true);
    });

    it('should handle primitives', () => {
      expect(validateTokenReferences('$primaryColor', mockTokens).valid).toBe(true);
      expect(validateTokenReferences('$unknownToken', mockTokens).valid).toBe(false);
      expect(validateTokenReferences(123, mockTokens).valid).toBe(true);
    });

    it('should handle empty object', () => {
      const result = validateTokenReferences({}, mockTokens);
      expect(result.valid).toBe(true);
    });

    it('should handle empty array', () => {
      const result = validateTokenReferences([], mockTokens);
      expect(result.valid).toBe(true);
    });

    it('should not duplicate missing tokens', () => {
      const obj = {
        color1: '$unknownToken',
        color2: '$unknownToken',
        color3: '$unknownToken',
      };

      const result = validateTokenReferences(obj, mockTokens);

      expect(result.valid).toBe(false);
      expect((result as any).missingTokens).toHaveLength(1);
      expect((result as any).missingTokens).toContain('unknownToken');
    });

    it('should handle null and undefined', () => {
      expect(validateTokenReferences(null, mockTokens).valid).toBe(true);
      expect(validateTokenReferences(undefined, mockTokens).valid).toBe(true);
    });

    it('should validate complex nested structure', () => {
      const obj = {
        theme: {
          light: {
            colors: ['$primaryColor', '$secondaryColor'],
            spacing: '$spacing',
          },
          dark: {
            colors: ['$darkPrimary', '$darkSecondary'],
          },
        },
      };

      const result = validateTokenReferences(obj, mockTokens);

      expect(result.valid).toBe(false);
      expect((result as any).missingTokens).toContain('darkPrimary');
      expect((result as any).missingTokens).toContain('darkSecondary');
    });
  });
});
