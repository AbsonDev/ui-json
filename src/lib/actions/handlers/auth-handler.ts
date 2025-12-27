/**
 * Authentication Action Handlers
 * Handles auth:login, auth:signup, and auth:logout actions
 */

import { UIAction } from '../../../types';
import { ActionContext } from '../action-context';

export function handleAuthLogin(
  action: Extract<UIAction, { type: 'auth:login' }>,
  context: ActionContext
): void {
  const { formState, currentDbData, setSession, setCurrentScreenId, setFormState, handleAction, uiApp } = context;
  const authConfig = uiApp?.app.authentication;

  if (!authConfig) return;

  const email = formState[action.fields.email];
  const password = formState[action.fields.password];
  const userTable = currentDbData[authConfig.userTable] || [];
  const user = userTable.find(
    u => u[authConfig.emailField] === email && u[authConfig.passwordField] === password
  );

  if (user) {
    setSession({ user });
    setCurrentScreenId(authConfig.postLoginScreen);
    setFormState({});
  } else if (action.onError) {
    handleAction(action.onError);
  }
}

export function handleAuthSignup(
  action: Extract<UIAction, { type: 'auth:signup' }>,
  context: ActionContext
): void {
  const { formState, currentDbData, setCurrentDbData, setSession, setCurrentScreenId, setFormState, handleAction, uiApp } = context;
  const authConfig = uiApp?.app.authentication;

  if (!authConfig) return;

  const email = formState[action.fields.email];
  const userTable = currentDbData[authConfig.userTable] || [];
  const userExists = userTable.some(u => u[authConfig.emailField] === email);

  if (userExists) {
    if (action.onError) handleAction(action.onError);
    return;
  }

  const newUser: Record<string, any> = { id: Date.now().toString() };
  for (const field in action.fields) {
    const formFieldId = action.fields[field];
    newUser[field] = formState[formFieldId];
  }

  setCurrentDbData({
    ...currentDbData,
    [authConfig.userTable]: [...userTable, newUser],
  });

  setSession({ user: newUser });
  setCurrentScreenId(authConfig.postLoginScreen);
  setFormState({});
}

export function handleAuthLogout(
  action: Extract<UIAction, { type: 'auth:logout' }>,
  context: ActionContext
): void {
  const { setSession, setCurrentScreenId, handleAction, uiApp } = context;

  setSession(null);

  if (action.onSuccess) {
    handleAction(action.onSuccess);
  } else {
    setCurrentScreenId(uiApp?.initialScreen || '');
  }
}
