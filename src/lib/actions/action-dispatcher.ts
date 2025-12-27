/**
 * Action Dispatcher
 * Central dispatcher for all UI actions using the Strategy Pattern
 *
 * This replaces the large switch statement in App.tsx with a modular,
 * extensible system where each action type has its own handler.
 */

import { UIAction } from '../../types';
import { ActionContext } from './action-context';
import { handleNavigate, handleGoBack } from './handlers/navigation-handler';
import { handlePopup } from './handlers/popup-handler';
import { handleSubmit } from './handlers/submit-handler';
import { handleDeleteRecord } from './handlers/database-handler';
import { handleAuthLogin, handleAuthSignup, handleAuthLogout } from './handlers/auth-handler';
import { handleAI } from './handlers/ai-handler';
import logger, { logError } from '../logger';

/**
 * Type for action handler functions
 * Can be sync or async
 */
type ActionHandler<T extends UIAction = UIAction> = (
  action: T,
  context: ActionContext
) => void | Promise<void>;

/**
 * Registry of action handlers
 * Maps action type to handler function
 */
const actionHandlers: Record<UIAction['type'], ActionHandler<any>> = {
  navigate: handleNavigate,
  goBack: handleGoBack,
  popup: handlePopup,
  submit: handleSubmit,
  deleteRecord: handleDeleteRecord,
  'auth:login': handleAuthLogin,
  'auth:signup': handleAuthSignup,
  'auth:logout': handleAuthLogout,
  ai: handleAI,
};

/**
 * Dispatch an action to the appropriate handler
 *
 * @param action - The action to dispatch
 * @param context - The context containing state and callbacks
 */
export async function dispatchAction(action: UIAction, context: ActionContext): Promise<void> {
  if (!action || !action.type) {
    logger.warn('Invalid action:', { action });
    return;
  }

  const handler = actionHandlers[action.type];

  if (handler) {
    try {
      await handler(action, context);
    } catch (error) {
      logError(
        error instanceof Error ? error : new Error(`Error handling action ${action.type}`),
        { actionType: action.type }
      );
    }
  } else {
    logger.warn('Unknown action type:', { actionType: action.type });
  }
}

/**
 * Register a custom action handler
 * Allows extending the dispatcher with new action types
 *
 * @param type - The action type
 * @param handler - The handler function
 */
export function registerActionHandler<T extends UIAction>(
  type: T['type'],
  handler: ActionHandler<T>
): void {
  actionHandlers[type] = handler;
}

/**
 * Check if an action type has a registered handler
 */
export function hasActionHandler(type: string): boolean {
  return type in actionHandlers;
}
