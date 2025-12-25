/**
 * Database Action Handler
 * Handles database record operations
 */

import { UIAction } from '../../../types';
import { ActionContext } from '../action-context';

export function handleDeleteRecord(
  action: Extract<UIAction, { type: 'deleteRecord' }>,
  context: ActionContext
): void {
  const { currentDbData, setCurrentDbData } = context;

  setCurrentDbData({
    ...currentDbData,
    [action.table]: (currentDbData[action.table] || []).filter(
      r => r.id !== action.recordId
    ),
  });
}
