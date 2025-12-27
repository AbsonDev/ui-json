/**
 * Submit Action Handler
 * Handles form submission to database or API
 */

import { UIAction } from '../../../types';
import { ActionContext } from '../action-context';
import logger, { logError } from '../../logger';

export function handleSubmit(
  action: Extract<UIAction, { type: 'submit' }>,
  context: ActionContext
): void {
  const { formState, currentDbData, setCurrentDbData, setFormState, handleAction } = context;

  // Submit to database
  if (action.target === 'database' && action.table && action.fields) {
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
    fetch(action.endpoint, {
      method,
      headers,
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
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
      })
      .catch((error) => {
        logError(error instanceof Error ? error : new Error('API Error'));

        // Execute error action
        if (action.onError) {
          handleAction(action.onError);
        }
      });
  } else {
    logger.warn('Invalid submit action configuration', { action });
  }
}
