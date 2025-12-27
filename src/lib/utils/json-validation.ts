/**
 * JSON Validation Utilities
 * Reusable functions for JSON validation and parsing
 */

/**
 * Check if a string is valid JSON
 */
export function isValidJson(json: string): boolean {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely parse JSON and return null if invalid
 */
export function parseJsonSafe<T = any>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Safely parse JSON with a fallback value
 */
export function parseJsonWithFallback<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Validate JSON size (in bytes)
 */
export function validateJsonSize(json: string, maxBytes: number): boolean {
  const bytes = new Blob([json]).size;
  return bytes <= maxBytes;
}

/**
 * Parse and validate JSON structure
 */
export function parseAndValidateJson<T = any>(
  json: string,
  validator?: (parsed: any) => boolean
): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(json);

    if (validator && !validator(parsed)) {
      return {
        success: false,
        error: 'JSON structure validation failed',
      };
    }

    return {
      success: true,
      data: parsed as T,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}
