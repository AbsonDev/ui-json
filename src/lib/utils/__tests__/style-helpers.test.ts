/**
 * Tests for Style Helper Utilities
 */

import {
  getMarginStyles,
  getButtonClasses,
  getLayoutClasses,
  mapResizeModeToObjectFit,
  getPaddingClass,
  getGapClass,
  classNames,
} from '../style-helpers';

describe('Style Helper Utilities', () => {
  describe('getMarginStyles', () => {
    const mockTokens = {
      spacing1: '8px',
      spacing2: '16px',
      spacing3: '24px',
    };

    it('should return margin styles from component props', () => {
      const component = {
        type: 'text' as const,
        marginTop: 10,
        marginBottom: 20,
        marginLeft: 5,
        marginRight: 15,
      };

      const result = getMarginStyles(component, {});

      expect(result).toEqual({
        marginTop: 10,
        marginBottom: 20,
        marginLeft: 5,
        marginRight: 15,
      });
    });

    it('should resolve token references', () => {
      const component = {
        type: 'text' as const,
        marginTop: '$spacing1',
        marginBottom: '$spacing2',
        marginLeft: 10,
        marginRight: '$spacing3',
      };

      const result = getMarginStyles(component, mockTokens);

      expect(result).toEqual({
        marginTop: '8px',
        marginBottom: '16px',
        marginLeft: 10,
        marginRight: '24px',
      });
    });

    it('should keep unresolved tokens as-is', () => {
      const component = {
        type: 'text' as const,
        marginTop: '$unknownToken',
        marginBottom: 10,
      };

      const result = getMarginStyles(component, mockTokens);

      expect(result.marginTop).toBe('$unknownToken');
      expect(result.marginBottom).toBe(10);
    });

    it('should handle undefined margins', () => {
      const component = {
        type: 'text' as const,
      };

      const result = getMarginStyles(component, {});

      expect(result).toEqual({
        marginTop: undefined,
        marginBottom: undefined,
        marginLeft: undefined,
        marginRight: undefined,
      });
    });

    it('should handle numeric zero values', () => {
      const component = {
        type: 'text' as const,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
      };

      const result = getMarginStyles(component, {});

      expect(result).toEqual({
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
      });
    });

    it('should handle string values', () => {
      const component = {
        type: 'text' as const,
        marginTop: '10px',
        marginBottom: '1rem',
        marginLeft: 'auto',
        marginRight: '5%',
      };

      const result = getMarginStyles(component, {});

      expect(result).toEqual({
        marginTop: '10px',
        marginBottom: '1rem',
        marginLeft: 'auto',
        marginRight: '5%',
      });
    });
  });

  describe('getButtonClasses', () => {
    it('should return default classes for primary medium button', () => {
      const result = getButtonClasses();

      expect(result).toContain('rounded-md');
      expect(result).toContain('font-semibold');
      expect(result).toContain('px-4 py-2 text-sm');
      expect(result).toContain('bg-blue-600');
      expect(result).toContain('text-white');
    });

    it('should add w-full class when fullWidth is true', () => {
      const result = getButtonClasses('primary', 'medium', true);

      expect(result).toContain('w-full');
    });

    it('should not add w-full class when fullWidth is false', () => {
      const result = getButtonClasses('primary', 'medium', false);

      expect(result).not.toContain('w-full');
    });

    describe('Button Sizes', () => {
      it('should apply small size classes', () => {
        const result = getButtonClasses('primary', 'small');

        expect(result).toContain('px-3 py-1.5 text-xs');
        expect(result).not.toContain('px-4 py-2');
      });

      it('should apply medium size classes', () => {
        const result = getButtonClasses('primary', 'medium');

        expect(result).toContain('px-4 py-2 text-sm');
      });

      it('should apply large size classes', () => {
        const result = getButtonClasses('primary', 'large');

        expect(result).toContain('px-6 py-3 text-base');
      });
    });

    describe('Button Variants', () => {
      it('should apply primary variant classes', () => {
        const result = getButtonClasses('primary');

        expect(result).toContain('bg-blue-600');
        expect(result).toContain('text-white');
        expect(result).toContain('hover:bg-blue-700');
        expect(result).toContain('focus:ring-blue-500');
      });

      it('should apply secondary variant classes', () => {
        const result = getButtonClasses('secondary');

        expect(result).toContain('bg-gray-600');
        expect(result).toContain('text-white');
        expect(result).toContain('hover:bg-gray-700');
        expect(result).toContain('focus:ring-gray-500');
      });

      it('should apply outline variant classes', () => {
        const result = getButtonClasses('outline');

        expect(result).toContain('border border-gray-300');
        expect(result).toContain('text-gray-700');
        expect(result).toContain('bg-white');
        expect(result).toContain('hover:bg-gray-50');
      });

      it('should apply text variant classes', () => {
        const result = getButtonClasses('text');

        expect(result).toContain('text-blue-600');
        expect(result).toContain('hover:bg-blue-50');
      });
    });

    it('should combine variant, size, and fullWidth', () => {
      const result = getButtonClasses('secondary', 'large', true);

      expect(result).toContain('bg-gray-600');
      expect(result).toContain('px-6 py-3 text-base');
      expect(result).toContain('w-full');
    });

    it('should include base classes in all variants', () => {
      const variants: Array<'primary' | 'secondary' | 'outline' | 'text'> = [
        'primary',
        'secondary',
        'outline',
        'text',
      ];

      variants.forEach((variant) => {
        const result = getButtonClasses(variant);

        expect(result).toContain('rounded-md');
        expect(result).toContain('font-semibold');
        expect(result).toContain('focus:outline-none');
        expect(result).toContain('transition-colors');
      });
    });
  });

  describe('getLayoutClasses', () => {
    it('should return vertical layout by default', () => {
      const result = getLayoutClasses();

      expect(result).toContain('flex flex-col');
    });

    it('should return horizontal layout', () => {
      const result = getLayoutClasses('horizontal');

      expect(result).toContain('flex flex-row');
    });

    it('should return vertical layout explicitly', () => {
      const result = getLayoutClasses('vertical');

      expect(result).toContain('flex flex-col');
    });

    describe('Alignment', () => {
      it('should apply start alignment', () => {
        const result = getLayoutClasses('vertical', 'start');

        expect(result).toContain('items-start justify-start');
      });

      it('should apply center alignment', () => {
        const result = getLayoutClasses('vertical', 'center');

        expect(result).toContain('items-center justify-center');
      });

      it('should apply end alignment', () => {
        const result = getLayoutClasses('vertical', 'end');

        expect(result).toContain('items-end justify-end');
      });

      it('should apply space-between alignment', () => {
        const result = getLayoutClasses('vertical', 'space-between');

        expect(result).toContain('justify-between');
      });

      it('should apply space-around alignment', () => {
        const result = getLayoutClasses('vertical', 'space-around');

        expect(result).toContain('justify-around');
      });
    });

    it('should work without alignment', () => {
      const result = getLayoutClasses('horizontal');

      expect(result).toBe('flex flex-row');
    });

    it('should combine horizontal layout with alignment', () => {
      const result = getLayoutClasses('horizontal', 'center');

      expect(result).toContain('flex flex-row');
      expect(result).toContain('items-center justify-center');
    });

    it('should trim extra spaces', () => {
      const result = getLayoutClasses('vertical');

      expect(result).not.toMatch(/\s{2,}/);
      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });
  });

  describe('mapResizeModeToObjectFit', () => {
    it('should map cover to cover', () => {
      const result = mapResizeModeToObjectFit('cover');
      expect(result).toBe('cover');
    });

    it('should map contain to contain', () => {
      const result = mapResizeModeToObjectFit('contain');
      expect(result).toBe('contain');
    });

    it('should map stretch to fill', () => {
      const result = mapResizeModeToObjectFit('stretch');
      expect(result).toBe('fill');
    });

    it('should map center to none', () => {
      const result = mapResizeModeToObjectFit('center');
      expect(result).toBe('none');
    });

    it('should return contain as default for undefined', () => {
      const result = mapResizeModeToObjectFit(undefined);
      expect(result).toBe('contain');
    });

    it('should return contain for unknown values', () => {
      const result = mapResizeModeToObjectFit('unknown' as any);
      expect(result).toBe('contain');
    });
  });

  describe('getPaddingClass', () => {
    it('should return empty string for undefined', () => {
      const result = getPaddingClass(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for 0', () => {
      const result = getPaddingClass(0);
      expect(result).toBe('');
    });

    it('should return p-1 for 1', () => {
      const result = getPaddingClass(1);
      expect(result).toBe('p-1');
    });

    it('should return p-4 for 4', () => {
      const result = getPaddingClass(4);
      expect(result).toBe('p-4');
    });

    it('should return p-8 for 8', () => {
      const result = getPaddingClass(8);
      expect(result).toBe('p-8');
    });

    it('should handle large values', () => {
      const result = getPaddingClass(16);
      expect(result).toBe('p-16');
    });
  });

  describe('getGapClass', () => {
    it('should return empty string for undefined', () => {
      const result = getGapClass(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for 0', () => {
      const result = getGapClass(0);
      expect(result).toBe('');
    });

    it('should return gap-1 for 1', () => {
      const result = getGapClass(1);
      expect(result).toBe('gap-1');
    });

    it('should return gap-4 for 4', () => {
      const result = getGapClass(4);
      expect(result).toBe('gap-4');
    });

    it('should return gap-8 for 8', () => {
      const result = getGapClass(8);
      expect(result).toBe('gap-8');
    });

    it('should handle large values', () => {
      const result = getGapClass(16);
      expect(result).toBe('gap-16');
    });
  });

  describe('classNames', () => {
    it('should combine multiple classes', () => {
      const result = classNames('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should filter out undefined', () => {
      const result = classNames('class1', undefined, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should filter out null', () => {
      const result = classNames('class1', null, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should filter out false', () => {
      const result = classNames('class1', false, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should filter out empty strings', () => {
      const result = classNames('class1', '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle all falsy values', () => {
      const result = classNames('class1', undefined, null, false, '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle empty input', () => {
      const result = classNames();
      expect(result).toBe('');
    });

    it('should handle all falsy input', () => {
      const result = classNames(undefined, null, false, '');
      expect(result).toBe('');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;

      const result = classNames(
        'base',
        isActive && 'active',
        isDisabled && 'disabled'
      );

      expect(result).toBe('base active');
    });

    it('should work with complex conditionals', () => {
      const variant = 'primary';
      const size = 'large';
      const fullWidth = true;

      const result = classNames(
        'btn',
        variant === 'primary' && 'btn-primary',
        size === 'large' && 'btn-lg',
        fullWidth && 'w-full'
      );

      expect(result).toBe('btn btn-primary btn-lg w-full');
    });

    it('should handle single class', () => {
      const result = classNames('single');
      expect(result).toBe('single');
    });

    it('should preserve spacing', () => {
      const result = classNames('class1', 'class2');
      expect(result).toBe('class1 class2');
      expect(result).not.toContain('  ');
    });
  });

  describe('Integration Tests', () => {
    it('should combine button classes with classNames', () => {
      const buttonClasses = getButtonClasses('primary', 'large', true);
      const customClasses = 'custom-class';

      const result = classNames(buttonClasses, customClasses);

      expect(result).toContain('bg-blue-600');
      expect(result).toContain('px-6 py-3');
      expect(result).toContain('w-full');
      expect(result).toContain('custom-class');
    });

    it('should combine layout and gap classes', () => {
      const layoutClasses = getLayoutClasses('horizontal', 'center');
      const gapClass = getGapClass(4);

      const result = classNames(layoutClasses, gapClass);

      expect(result).toContain('flex flex-row');
      expect(result).toContain('items-center');
      expect(result).toContain('gap-4');
    });

    it('should work with margin styles and padding classes', () => {
      const component = {
        type: 'text' as const,
        marginTop: 10,
        marginBottom: 20,
      };

      const marginStyles = getMarginStyles(component, {});
      const paddingClass = getPaddingClass(4);

      expect(marginStyles.marginTop).toBe(10);
      expect(paddingClass).toBe('p-4');
    });
  });
});
