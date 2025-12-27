import { useState, useCallback } from 'react';

/**
 * Hook for managing form state
 * Handles form field values and form reset
 */
export function useFormState() {
  const [formState, setFormState] = useState<Record<string, any>>({});

  const updateFormField = useCallback((fieldId: string, value: any) => {
    setFormState(prev => ({ ...prev, [fieldId]: value }));
  }, []);

  const updateFormFields = useCallback((fields: Record<string, any>) => {
    setFormState(prev => ({ ...prev, ...fields }));
  }, []);

  const resetForm = useCallback((fieldsToReset?: string[]) => {
    if (fieldsToReset) {
      setFormState(prev => {
        const newState = { ...prev };
        fieldsToReset.forEach(field => {
          newState[field] = '';
        });
        return newState;
      });
    } else {
      setFormState({});
    }
  }, []);

  const getFieldValue = useCallback((fieldId: string) => {
    return formState[fieldId];
  }, [formState]);

  return {
    formState,
    setFormState,
    updateFormField,
    updateFormFields,
    resetForm,
    getFieldValue,
  };
}
