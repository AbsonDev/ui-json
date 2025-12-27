/**
 * Style Helper Utilities
 * Reusable functions for generating CSS classes and styles
 */

import { UIComponent, ButtonVariant, ButtonSize, Layout, Alignment, ImageResizeMode } from '../../types';

/**
 * Get margin styles from component props with token resolution
 */
export function getMarginStyles(
  component: UIComponent,
  tokens: Record<string, any>
): React.CSSProperties {
  const resolveValue = (value: any) => {
    if (typeof value === 'string' && value.startsWith('$')) {
      const tokenName = value.substring(1);
      return tokens[tokenName] || value;
    }
    return value;
  };

  return {
    marginTop: resolveValue(component.marginTop),
    marginBottom: resolveValue(component.marginBottom),
    marginLeft: resolveValue(component.marginLeft),
    marginRight: resolveValue(component.marginRight),
  };
}

/**
 * Get Tailwind CSS classes for buttons
 */
export function getButtonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'medium',
  fullWidth = false
): string {
  let classes = 'rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';

  if (fullWidth) {
    classes += ' w-full';
  }

  // Size classes
  switch (size) {
    case 'small':
      classes += ' px-3 py-1.5 text-xs';
      break;
    case 'medium':
      classes += ' px-4 py-2 text-sm';
      break;
    case 'large':
      classes += ' px-6 py-3 text-base';
      break;
  }

  // Variant classes
  switch (variant) {
    case 'primary':
      classes += ' bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
      break;
    case 'secondary':
      classes += ' bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500';
      break;
    case 'outline':
      classes += ' border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500';
      break;
    case 'text':
      classes += ' text-blue-600 hover:bg-blue-50';
      break;
  }

  return classes;
}

/**
 * Get Tailwind CSS classes for layout (flex container)
 */
export function getLayoutClasses(
  layout: Layout = 'vertical',
  alignment?: Alignment
): string {
  const base = layout === 'horizontal' ? 'flex flex-row' : 'flex flex-col';
  let alignClass = '';

  switch (alignment) {
    case 'start':
      alignClass = 'items-start justify-start';
      break;
    case 'center':
      alignClass = 'items-center justify-center';
      break;
    case 'end':
      alignClass = 'items-end justify-end';
      break;
    case 'space-between':
      alignClass = 'justify-between';
      break;
    case 'space-around':
      alignClass = 'justify-around';
      break;
  }

  return `${base} ${alignClass}`.trim();
}

/**
 * Map ImageResizeMode to CSS object-fit property
 */
export function mapResizeModeToObjectFit(
  resizeMode?: ImageResizeMode
): React.CSSProperties['objectFit'] {
  switch (resizeMode) {
    case 'cover':
      return 'cover';
    case 'contain':
      return 'contain';
    case 'stretch':
      return 'fill';
    case 'center':
      return 'none';
    default:
      return 'contain';
  }
}

/**
 * Get padding classes from numeric value
 */
export function getPaddingClass(padding?: number): string {
  if (!padding) return '';

  // Convert to Tailwind spacing scale (p-0, p-1, p-2, etc.)
  return `p-${padding}`;
}

/**
 * Get gap classes for flex containers
 */
export function getGapClass(gap?: number): string {
  if (!gap) return '';

  // Convert to Tailwind gap scale
  return `gap-${gap}`;
}

/**
 * Combine multiple class names, filtering out empty strings
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
