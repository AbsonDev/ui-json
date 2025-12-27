/**
 * Action Context Type
 * Defines the context object passed to action handlers
 */

import { UIApp, UIAction } from '../../types';

export interface ActionContext {
  /** Recursive action handler for chaining actions */
  handleAction: (action: UIAction) => void;

  /** Current form state */
  formState: Record<string, any>;

  /** Set form state */
  setFormState: (state: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;

  /** Current database data for the active app */
  currentDbData: Record<string, any[]>;

  /** Set database data for current app */
  setCurrentDbData: (data: Record<string, any[]>) => void;

  /** Current user session */
  session: { user: any } | null;

  /** Set session */
  setSession: (session: { user: any } | null) => void;

  /** Current UI App configuration */
  uiApp: UIApp | null;

  /** Set current screen ID */
  setCurrentScreenId: (id: string) => void;

  /** Set popup */
  setPopup?: (popup: any) => void;
}
