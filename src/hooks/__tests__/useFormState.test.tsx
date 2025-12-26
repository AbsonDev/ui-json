/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useFormState } from '../useFormState';

describe('useFormState', () => {
  describe('Initial State', () => {
    it('should initialize with empty form state', () => {
      const { result } = renderHook(() => useFormState());

      expect(result.current.formState).toEqual({});
    });

    it('should provide all expected methods', () => {
      const { result } = renderHook(() => useFormState());

      expect(result.current).toHaveProperty('formState');
      expect(result.current).toHaveProperty('setFormState');
      expect(result.current).toHaveProperty('updateFormField');
      expect(result.current).toHaveProperty('updateFormFields');
      expect(result.current).toHaveProperty('resetForm');
      expect(result.current).toHaveProperty('getFieldValue');
    });
  });

  describe('updateFormField', () => {
    it('should update a single form field', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormField('email', 'test@example.com');
      });

      expect(result.current.formState.email).toBe('test@example.com');
    });

    it('should update multiple fields independently', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormField('email', 'test@example.com');
        result.current.updateFormField('name', 'John Doe');
        result.current.updateFormField('age', 30);
      });

      expect(result.current.formState).toEqual({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
      });
    });

    it('should preserve existing fields when updating', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormField('field1', 'value1');
        result.current.updateFormField('field2', 'value2');
      });

      act(() => {
        result.current.updateFormField('field3', 'value3');
      });

      expect(result.current.formState).toEqual({
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
      });
    });

    it('should overwrite existing field value', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormField('email', 'old@example.com');
      });

      act(() => {
        result.current.updateFormField('email', 'new@example.com');
      });

      expect(result.current.formState.email).toBe('new@example.com');
    });

    it('should handle different value types', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormField('string', 'text');
        result.current.updateFormField('number', 42);
        result.current.updateFormField('boolean', true);
        result.current.updateFormField('array', [1, 2, 3]);
        result.current.updateFormField('object', { key: 'value' });
        result.current.updateFormField('null', null);
      });

      expect(result.current.formState).toEqual({
        string: 'text',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { key: 'value' },
        null: null,
      });
    });
  });

  describe('updateFormFields', () => {
    it('should update multiple fields at once', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormFields({
          email: 'test@example.com',
          name: 'John Doe',
          age: 30,
        });
      });

      expect(result.current.formState).toEqual({
        email: 'test@example.com',
        name: 'John Doe',
        age: 30,
      });
    });

    it('should merge with existing fields', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormField('field1', 'value1');
      });

      act(() => {
        result.current.updateFormFields({
          field2: 'value2',
          field3: 'value3',
        });
      });

      expect(result.current.formState).toEqual({
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
      });
    });

    it('should overwrite existing fields with same keys', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormFields({
          email: 'old@example.com',
          name: 'Old Name',
        });
      });

      act(() => {
        result.current.updateFormFields({
          email: 'new@example.com',
        });
      });

      expect(result.current.formState).toEqual({
        email: 'new@example.com',
        name: 'Old Name',
      });
    });

    it('should handle empty object', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormField('existing', 'value');
      });

      act(() => {
        result.current.updateFormFields({});
      });

      expect(result.current.formState).toEqual({
        existing: 'value',
      });
    });
  });

  describe('resetForm', () => {
    it('should reset entire form when called without arguments', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormFields({
          email: 'test@example.com',
          name: 'John Doe',
          age: 30,
        });
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formState).toEqual({});
    });

    it('should reset specific fields to empty string', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormFields({
          email: 'test@example.com',
          name: 'John Doe',
          age: 30,
        });
      });

      act(() => {
        result.current.resetForm(['email', 'name']);
      });

      expect(result.current.formState).toEqual({
        email: '',
        name: '',
        age: 30,
      });
    });

    it('should handle resetting non-existent fields', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormField('existing', 'value');
      });

      act(() => {
        result.current.resetForm(['existing', 'nonexistent']);
      });

      expect(result.current.formState).toEqual({
        existing: '',
        nonexistent: '',
      });
    });

    it('should handle empty array of fields', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormField('field', 'value');
      });

      act(() => {
        result.current.resetForm([]);
      });

      expect(result.current.formState).toEqual({
        field: 'value',
      });
    });
  });

  describe('getFieldValue', () => {
    it('should return field value', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormField('email', 'test@example.com');
      });

      expect(result.current.getFieldValue('email')).toBe('test@example.com');
    });

    it('should return undefined for non-existent field', () => {
      const { result } = renderHook(() => useFormState());

      expect(result.current.getFieldValue('nonexistent')).toBeUndefined();
    });

    it('should return updated value after field update', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormField('email', 'old@example.com');
      });

      expect(result.current.getFieldValue('email')).toBe('old@example.com');

      act(() => {
        result.current.updateFormField('email', 'new@example.com');
      });

      expect(result.current.getFieldValue('email')).toBe('new@example.com');
    });

    it('should handle different value types', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormFields({
          string: 'text',
          number: 42,
          boolean: true,
          array: [1, 2, 3],
          object: { key: 'value' },
        });
      });

      expect(result.current.getFieldValue('string')).toBe('text');
      expect(result.current.getFieldValue('number')).toBe(42);
      expect(result.current.getFieldValue('boolean')).toBe(true);
      expect(result.current.getFieldValue('array')).toEqual([1, 2, 3]);
      expect(result.current.getFieldValue('object')).toEqual({ key: 'value' });
    });
  });

  describe('setFormState', () => {
    it('should replace entire form state', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormField('field1', 'value1');
      });

      act(() => {
        result.current.setFormState({
          field2: 'value2',
          field3: 'value3',
        });
      });

      expect(result.current.formState).toEqual({
        field2: 'value2',
        field3: 'value3',
      });
      expect(result.current.formState).not.toHaveProperty('field1');
    });

    it('should allow setting empty state', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        result.current.updateFormFields({
          email: 'test@example.com',
          name: 'John Doe',
        });
      });

      act(() => {
        result.current.setFormState({});
      });

      expect(result.current.formState).toEqual({});
    });
  });

  describe('Hook Stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useFormState());

      const initialUpdateFormField = result.current.updateFormField;
      const initialUpdateFormFields = result.current.updateFormFields;
      const initialResetForm = result.current.resetForm;

      rerender();

      expect(result.current.updateFormField).toBe(initialUpdateFormField);
      expect(result.current.updateFormFields).toBe(initialUpdateFormFields);
      expect(result.current.resetForm).toBe(initialResetForm);
    });

    it('should update getFieldValue reference when formState changes', () => {
      const { result } = renderHook(() => useFormState());

      const initialGetFieldValue = result.current.getFieldValue;

      act(() => {
        result.current.updateFormField('email', 'test@example.com');
      });

      // getFieldValue depends on formState, so it should update
      expect(result.current.getFieldValue).not.toBe(initialGetFieldValue);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle rapid sequential updates', () => {
      const { result } = renderHook(() => useFormState());

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.updateFormField(`field${i}`, `value${i}`);
        }
      });

      expect(Object.keys(result.current.formState).length).toBe(100);
      expect(result.current.formState.field0).toBe('value0');
      expect(result.current.formState.field99).toBe('value99');
    });

    it('should handle form workflow: fill -> reset -> refill', () => {
      const { result } = renderHook(() => useFormState());

      // Fill form
      act(() => {
        result.current.updateFormFields({
          email: 'user@example.com',
          password: 'password123',
          name: 'User Name',
        });
      });

      expect(Object.keys(result.current.formState).length).toBe(3);

      // Reset form
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formState).toEqual({});

      // Refill with different data
      act(() => {
        result.current.updateFormFields({
          email: 'newuser@example.com',
          phone: '123-456-7890',
        });
      });

      expect(result.current.formState).toEqual({
        email: 'newuser@example.com',
        phone: '123-456-7890',
      });
    });

    it('should handle nested object updates', () => {
      const { result } = renderHook(() => useFormState());

      const addressData = {
        street: '123 Main St',
        city: 'New York',
        zip: '10001',
      };

      act(() => {
        result.current.updateFormField('address', addressData);
      });

      expect(result.current.getFieldValue('address')).toEqual(addressData);

      // Update nested object
      const updatedAddress = {
        ...addressData,
        city: 'Los Angeles',
      };

      act(() => {
        result.current.updateFormField('address', updatedAddress);
      });

      expect(result.current.getFieldValue('address').city).toBe('Los Angeles');
    });
  });
});
