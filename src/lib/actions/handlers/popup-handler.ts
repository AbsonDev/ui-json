/**
 * Popup Action Handler
 * Handles popup display actions
 */

import { UIAction } from '../../../types';
import { ActionContext } from '../action-context';

export function handlePopup(
  action: Extract<UIAction, { type: 'popup' }>,
  context: ActionContext
): void {
  if (context.setPopup) {
    context.setPopup({
      title: action.title,
      message: action.message,
      variant: action.variant || 'alert',
      buttons: action.buttons,
    });
  }
}
