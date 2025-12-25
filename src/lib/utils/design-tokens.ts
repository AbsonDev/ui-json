/**
 * Design Tokens Utilities
 * Handles design token resolution with $ prefix
 */

/**
 * Resolve a design token value
 * Example: "$primaryColor" with {primaryColor: "#FF0000"} => "#FF0000"
 */
export function resolveToken(
  value: any,
  tokens: Record<string, any>
): any {
  if (typeof value === 'string' && value.startsWith('$')) {
    const tokenName = value.substring(1);
    return tokens[tokenName] !== undefined ? tokens[tokenName] : value;
  }
  return value;
}

/**
 * Check if a value is a token reference
 */
export function isTokenReference(value: any): boolean {
  return typeof value === 'string' && value.startsWith('$');
}

/**
 * Resolve all tokens in an object recursively
 */
export function resolveAllTokens(
  obj: any,
  tokens: Record<string, any>
): any {
  if (typeof obj === 'string') {
    return resolveToken(obj, tokens);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => resolveAllTokens(item, tokens));
  }

  if (obj && typeof obj === 'object') {
    const resolved: Record<string, any> = {};
    for (const key in obj) {
      resolved[key] = resolveAllTokens(obj[key], tokens);
    }
    return resolved;
  }

  return obj;
}

/**
 * Get token value by name (without $ prefix)
 */
export function getTokenValue(
  tokenName: string,
  tokens: Record<string, any>,
  fallback?: any
): any {
  return tokens[tokenName] !== undefined ? tokens[tokenName] : fallback;
}

/**
 * Validate that all token references exist in the tokens object
 */
export function validateTokenReferences(
  obj: any,
  tokens: Record<string, any>
): { valid: true } | { valid: false; missingTokens: string[] } {
  const missingTokens = new Set<string>();

  function checkTokens(value: any) {
    if (typeof value === 'string' && value.startsWith('$')) {
      const tokenName = value.substring(1);
      if (tokens[tokenName] === undefined) {
        missingTokens.add(tokenName);
      }
    } else if (Array.isArray(value)) {
      value.forEach(checkTokens);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(checkTokens);
    }
  }

  checkTokens(obj);

  if (missingTokens.size > 0) {
    return {
      valid: false,
      missingTokens: Array.from(missingTokens),
    };
  }

  return { valid: true };
}
