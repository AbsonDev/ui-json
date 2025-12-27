/**
 * Template Engine Utilities
 * Handles template string interpolation and resolution
 */

/**
 * Interpolate template strings with {{variable}} syntax
 * Example: "Hello {{name}}" with {name: "World"} => "Hello World"
 */
export function interpolateString(
  template: string,
  context: Record<string, any>
): string {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const trimmedKey = key.trim();
    const value = getNestedValue(context, trimmedKey);
    return value !== undefined && value !== null ? String(value) : '';
  });
}

/**
 * Get nested value from object using dot notation
 * Example: getNestedValue({user: {name: "John"}}, "user.name") => "John"
 */
export function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Resolve template in any type of value (string, object, array)
 */
export function resolveTemplate(
  template: any,
  context: Record<string, any>
): any {
  if (typeof template === 'string') {
    // Check if it's a simple variable reference like "{{fieldName}}"
    const simpleMatch = template.match(/^\{\{(.*?)\}\}$/);
    if (simpleMatch) {
      const key = simpleMatch[1].trim();
      const value = getNestedValue(context, key);
      return value !== undefined ? value : template;
    }

    // Otherwise interpolate the string
    return interpolateString(template, context);
  }

  if (Array.isArray(template)) {
    return template.map(item => resolveTemplate(item, context));
  }

  if (template && typeof template === 'object') {
    const resolved: Record<string, any> = {};
    for (const key in template) {
      resolved[key] = resolveTemplate(template[key], context);
    }
    return resolved;
  }

  return template;
}

/**
 * Check if a string contains template variables
 */
export function hasTemplateVariables(str: string): boolean {
  return /\{\{.*?\}\}/.test(str);
}

/**
 * Extract all template variable names from a string
 */
export function extractTemplateVariables(str: string): string[] {
  const matches = str.match(/\{\{(.*?)\}\}/g);
  if (!matches) return [];

  return matches.map(match => {
    const key = match.replace(/\{\{|\}\}/g, '').trim();
    return key;
  });
}
