/**
 * Navigation Action Handler
 * Handles navigate and goBack actions
 */

import { UIAction } from '../../../types';
import { ActionContext } from '../action-context';

export function handleNavigate(
  action: Extract<UIAction, { type: 'navigate' }>,
  context: ActionContext
): void {
  context.setCurrentScreenId(action.target);
}

export function handleGoBack(
  action: Extract<UIAction, { type: 'goBack' }>,
  context: ActionContext
): void {
  if (context.uiApp?.initialScreen) {
    context.setCurrentScreenId(context.uiApp.initialScreen);
  }
}
