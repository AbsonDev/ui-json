/**
 * Submit Action Handler
 * Handles form submission to database or API
 */

import { UIAction } from '../../../types';
import { ActionContext } from '../action-context';

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
  } else {
    // Mock API call
    const body: Record<string, any> = {};
    action.fields && Object.values(action.fields).forEach(fieldId => {
      body[fieldId] = formState[fieldId];
    });

    console.log('Submitting to:', action.endpoint, 'with data:', body);

    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate

      if (success && action.onSuccess) {
        handleAction(action.onSuccess);
      } else if (!success && action.onError) {
        handleAction(action.onError);
      }
    }, 1000);
  }
}
