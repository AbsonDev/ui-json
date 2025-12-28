/**
 * Submit Action Handler
 * Handles form submission to database or API
 */

import { UIAction } from '@/types';
import { ActionContext } from '@/lib/actions/action-context';
import logger from '@/lib/universal-logger';

/**
 * Validate that required fields are not empty
 */
function validateFields(fields: Record<string, string>, formState: Record<string, any>): string[] {
  const errors: string[] = [];

  for (const [dbField, formFieldId] of Object.entries(fields)) {
    const value = formState[formFieldId];
    if (value === undefined || value === null || value === '') {
      errors.push(`Field '${dbField}' is required`);
    }
  }

  return errors;
}

export async function handleSubmit(
  action: Extract<UIAction, { type: 'submit' }>,
  context: ActionContext
): Promise<void> {
  const { formState, currentDbData, setCurrentDbData, setFormState, handleAction } = context;

  // Submit to database
  if (action.target === 'database' && action.table && action.fields) {
    // Validate required fields
    const validationErrors = validateFields(action.fields, formState);
    if (validationErrors.length > 0) {
      logger.warn('Validation failed', { errors: validationErrors });
      if (action.onError) {
        handleAction(action.onError);
      }
      return;
    }

    const table = action.table;
    const newRecord: Record<string, any> = { id: Date.now().toString() };

    // Map form fields to database fields
    for (const dbField in action.fields) {
      const formFieldId = action.fields[dbField];
      newRecord[dbField] = formState[formFieldId];
    }

    // Add record to database
    setCurrentDbData({
      ...currentDbData,
      [table]: [...(currentDbData[table] || []), newRecord],
    });

    // Clear form fields
    const newFormState = { ...formState };
    for (const dbField in action.fields) {
      const formFieldId = action.fields[dbField];
      newFormState[formFieldId] = '';
    }
    setFormState(newFormState);

    // Execute success action
    if (action.onSuccess) {
      handleAction(action.onSuccess);
    }
  } else if (action.target === 'api' && action.endpoint) {
    // Validate required fields if specified
    if (action.fields) {
      const validationErrors = validateFields(action.fields, formState);
      if (validationErrors.length > 0) {
        logger.warn('Validation failed', { errors: validationErrors });
        if (action.onError) {
          handleAction(action.onError);
        }
        return;
      }
    }

    // Real API call
    const body: Record<string, any> = {};

    // Map form fields to request body
    if (action.fields) {
      Object.entries(action.fields).forEach(([key, fieldId]) => {
        body[key] = formState[fieldId];
      });
    }

    const method = action.method || 'POST';
    const headers = {
      'Content-Type': 'application/json',
      ...(action.headers || {}),
    };

    // Make the actual HTTP request
    try {
      const response = await fetch(action.endpoint, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('API Success:', { data });

      // Clear form fields on success
      if (action.fields) {
        const newFormState = { ...formState };
        Object.values(action.fields).forEach((fieldId) => {
          newFormState[fieldId] = '';
        });
        setFormState(newFormState);
      }

      // Execute success action
      if (action.onSuccess) {
        handleAction(action.onSuccess);
      }
    } catch (error) {
      logger.error('API Error:', error);

      // Execute error action
      if (action.onError) {
        handleAction(action.onError);
      }
    }
  } else {
    logger.warn('Invalid submit action configuration', { action });
  }
}
