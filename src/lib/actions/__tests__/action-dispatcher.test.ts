import {
  dispatchAction,
  registerActionHandler,
  hasActionHandler,
} from '../action-dispatcher';
import { ActionContext } from '../action-context';
import { UIAction } from '../../../types';

// Mock all handlers
jest.mock('../handlers/navigation-handler');
jest.mock('../handlers/popup-handler');
jest.mock('../handlers/submit-handler');
jest.mock('../handlers/database-handler');
jest.mock('../handlers/auth-handler');

import { handleNavigate, handleGoBack } from '../handlers/navigation-handler';
import { handlePopup } from '../handlers/popup-handler';
import { handleSubmit } from '../handlers/submit-handler';
import { handleDeleteRecord } from '../handlers/database-handler';
import {
  handleAuthLogin,
  handleAuthSignup,
  handleAuthLogout,
} from '../handlers/auth-handler';

describe('Action Dispatcher', () => {
  let mockContext: ActionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    mockContext = {
      handleAction: jest.fn(),
      formState: {},
      setFormState: jest.fn(),
      currentDbData: {},
      setCurrentDbData: jest.fn(),
      session: null,
      setSession: jest.fn(),
      uiApp: null,
      setCurrentScreenId: jest.fn(),
      setPopup: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('dispatchAction', () => {
    describe('Navigation Actions', () => {
      it('should dispatch navigate action to handleNavigate', () => {
        const action: Extract<UIAction, { type: 'navigate' }> = {
          type: 'navigate',
          target: 'home',
        };

        dispatchAction(action, mockContext);

        expect(handleNavigate).toHaveBeenCalledWith(action, mockContext);
        expect(handleNavigate).toHaveBeenCalledTimes(1);
      });

      it('should dispatch goBack action to handleGoBack', () => {
        const action: Extract<UIAction, { type: 'goBack' }> = {
          type: 'goBack',
        };

        dispatchAction(action, mockContext);

        expect(handleGoBack).toHaveBeenCalledWith(action, mockContext);
        expect(handleGoBack).toHaveBeenCalledTimes(1);
      });
    });

    describe('Popup Actions', () => {
      it('should dispatch popup action to handlePopup', () => {
        const action: Extract<UIAction, { type: 'popup' }> = {
          type: 'popup',
          title: 'Test',
          message: 'Message',
        };

        dispatchAction(action, mockContext);

        expect(handlePopup).toHaveBeenCalledWith(action, mockContext);
        expect(handlePopup).toHaveBeenCalledTimes(1);
      });
    });

    describe('Submit Actions', () => {
      it('should dispatch submit action to handleSubmit', () => {
        const action: Extract<UIAction, { type: 'submit' }> = {
          type: 'submit',
          endpoint: '/api/test',
        };

        dispatchAction(action, mockContext);

        expect(handleSubmit).toHaveBeenCalledWith(action, mockContext);
        expect(handleSubmit).toHaveBeenCalledTimes(1);
      });
    });

    describe('Database Actions', () => {
      it('should dispatch deleteRecord action to handleDeleteRecord', () => {
        const action: Extract<UIAction, { type: 'deleteRecord' }> = {
          type: 'deleteRecord',
          table: 'users',
          recordId: '1',
        };

        dispatchAction(action, mockContext);

        expect(handleDeleteRecord).toHaveBeenCalledWith(action, mockContext);
        expect(handleDeleteRecord).toHaveBeenCalledTimes(1);
      });
    });

    describe('Auth Actions', () => {
      it('should dispatch auth:login action to handleAuthLogin', () => {
        const action: Extract<UIAction, { type: 'auth:login' }> = {
          type: 'auth:login',
          fields: {
            email: 'emailField',
            password: 'passwordField',
          },
        };

        dispatchAction(action, mockContext);

        expect(handleAuthLogin).toHaveBeenCalledWith(action, mockContext);
        expect(handleAuthLogin).toHaveBeenCalledTimes(1);
      });

      it('should dispatch auth:signup action to handleAuthSignup', () => {
        const action: Extract<UIAction, { type: 'auth:signup' }> = {
          type: 'auth:signup',
          fields: {
            email: 'emailField',
            password: 'passwordField',
          },
        };

        dispatchAction(action, mockContext);

        expect(handleAuthSignup).toHaveBeenCalledWith(action, mockContext);
        expect(handleAuthSignup).toHaveBeenCalledTimes(1);
      });

      it('should dispatch auth:logout action to handleAuthLogout', () => {
        const action: Extract<UIAction, { type: 'auth:logout' }> = {
          type: 'auth:logout',
        };

        dispatchAction(action, mockContext);

        expect(handleAuthLogout).toHaveBeenCalledWith(action, mockContext);
        expect(handleAuthLogout).toHaveBeenCalledTimes(1);
      });
    });

    describe('Error Handling', () => {
      it('should warn when action is null', () => {
        const consoleSpy = jest.spyOn(console, 'warn');

        dispatchAction(null as any, mockContext);

        expect(consoleSpy).toHaveBeenCalledWith('Invalid action:', null);
        expect(handleNavigate).not.toHaveBeenCalled();
      });

      it('should warn when action is undefined', () => {
        const consoleSpy = jest.spyOn(console, 'warn');

        dispatchAction(undefined as any, mockContext);

        expect(consoleSpy).toHaveBeenCalledWith('Invalid action:', undefined);
      });

      it('should warn when action has no type', () => {
        const consoleSpy = jest.spyOn(console, 'warn');

        dispatchAction({} as any, mockContext);

        expect(consoleSpy).toHaveBeenCalledWith('Invalid action:', {});
      });

      it('should warn when action type is unknown', () => {
        const consoleSpy = jest.spyOn(console, 'warn');

        const action = { type: 'unknown' } as any;

        dispatchAction(action, mockContext);

        expect(consoleSpy).toHaveBeenCalledWith('Unknown action type:', 'unknown');
      });

      it('should catch and log errors from handlers', () => {
        const consoleSpy = jest.spyOn(console, 'error');
        const error = new Error('Handler error');

        (handleNavigate as jest.Mock).mockImplementation(() => {
          throw error;
        });

        const action: Extract<UIAction, { type: 'navigate' }> = {
          type: 'navigate',
          target: 'home',
        };

        dispatchAction(action, mockContext);

        expect(consoleSpy).toHaveBeenCalledWith('Error handling action navigate:', error);
      });

      it('should not propagate errors from handlers', () => {
        (handleNavigate as jest.Mock).mockImplementation(() => {
          throw new Error('Handler error');
        });

        const action: Extract<UIAction, { type: 'navigate' }> = {
          type: 'navigate',
          target: 'home',
        };

        expect(() => dispatchAction(action, mockContext)).not.toThrow();
      });
    });
  });

  describe('registerActionHandler', () => {
    it('should register a custom action handler', () => {
      const customHandler = jest.fn();
      const customType = 'customAction' as any;

      registerActionHandler(customType, customHandler);

      expect(hasActionHandler(customType)).toBe(true);
    });

    it('should allow custom handler to be dispatched', () => {
      const customHandler = jest.fn();
      const customType = 'customAction' as any;

      registerActionHandler(customType, customHandler);

      const action = { type: customType, data: 'test' } as any;

      dispatchAction(action, mockContext);

      expect(customHandler).toHaveBeenCalledWith(action, mockContext);
    });

    it('should allow overriding existing action handlers', () => {
      const customNavigateHandler = jest.fn();

      registerActionHandler('navigate', customNavigateHandler);

      const action: Extract<UIAction, { type: 'navigate' }> = {
        type: 'navigate',
        target: 'home',
      };

      dispatchAction(action, mockContext);

      expect(customNavigateHandler).toHaveBeenCalledWith(action, mockContext);
      expect(handleNavigate).not.toHaveBeenCalled();
    });

    it('should register multiple custom handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      registerActionHandler('custom1' as any, handler1);
      registerActionHandler('custom2' as any, handler2);

      expect(hasActionHandler('custom1')).toBe(true);
      expect(hasActionHandler('custom2')).toBe(true);

      dispatchAction({ type: 'custom1' } as any, mockContext);
      dispatchAction({ type: 'custom2' } as any, mockContext);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasActionHandler', () => {
    it('should return true for built-in action types', () => {
      expect(hasActionHandler('navigate')).toBe(true);
      expect(hasActionHandler('goBack')).toBe(true);
      expect(hasActionHandler('popup')).toBe(true);
      expect(hasActionHandler('submit')).toBe(true);
      expect(hasActionHandler('deleteRecord')).toBe(true);
      expect(hasActionHandler('auth:login')).toBe(true);
      expect(hasActionHandler('auth:signup')).toBe(true);
      expect(hasActionHandler('auth:logout')).toBe(true);
    });

    it('should return false for unknown action types', () => {
      expect(hasActionHandler('unknownAction')).toBe(false);
      expect(hasActionHandler('randomType')).toBe(false);
      expect(hasActionHandler('')).toBe(false);
    });

    it('should return true after registering custom handler', () => {
      const customType = 'myCustomAction';

      expect(hasActionHandler(customType)).toBe(false);

      registerActionHandler(customType as any, jest.fn());

      expect(hasActionHandler(customType)).toBe(true);
    });

    it('should handle type checking for various input types', () => {
      expect(hasActionHandler('navigate')).toBe(true);
      expect(hasActionHandler('NAVIGATE')).toBe(false); // Case sensitive
      expect(hasActionHandler('Navigate')).toBe(false);
    });
  });

  describe('Integration', () => {
    beforeEach(() => {
      // Restore original handlers before integration tests
      registerActionHandler('navigate', handleNavigate as any);
      registerActionHandler('goBack', handleGoBack as any);
      registerActionHandler('popup', handlePopup as any);
      registerActionHandler('submit', handleSubmit as any);
      registerActionHandler('deleteRecord', handleDeleteRecord as any);
      registerActionHandler('auth:login', handleAuthLogin as any);
      registerActionHandler('auth:signup', handleAuthSignup as any);
      registerActionHandler('auth:logout', handleAuthLogout as any);
      jest.clearAllMocks();
    });

    it('should dispatch multiple actions sequentially', () => {
      const action1: Extract<UIAction, { type: 'navigate' }> = {
        type: 'navigate',
        target: 'screen1',
      };
      const action2: Extract<UIAction, { type: 'popup' }> = {
        type: 'popup',
        title: 'Test',
        message: 'Message',
      };
      const action3: Extract<UIAction, { type: 'auth:logout' }> = {
        type: 'auth:logout',
      };

      dispatchAction(action1, mockContext);
      dispatchAction(action2, mockContext);
      dispatchAction(action3, mockContext);

      expect(handleNavigate).toHaveBeenCalledTimes(1);
      expect(handlePopup).toHaveBeenCalledTimes(1);
      expect(handleAuthLogout).toHaveBeenCalledTimes(1);
    });

    it('should handle action with complex context', () => {

      const complexContext: ActionContext = {
        handleAction: jest.fn(),
        formState: {
          field1: 'value1',
          field2: 'value2',
          nested: { data: 'test' },
        },
        setFormState: jest.fn(),
        currentDbData: {
          users: [{ id: '1', name: 'User 1' }],
          posts: [{ id: '1', title: 'Post 1' }],
        },
        setCurrentDbData: jest.fn(),
        session: { user: { id: '1', email: 'user@example.com' } },
        setSession: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
          },
          screens: {},
          initialScreen: 'home',
        },
        setCurrentScreenId: jest.fn(),
        setPopup: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'navigate' }> = {
        type: 'navigate',
        target: 'dashboard',
      };

      dispatchAction(action, complexContext);

      expect(handleNavigate).toHaveBeenCalledWith(action, complexContext);
    });

    it('should allow handlers to access context properties', () => {
      const customHandler = jest.fn((action, context) => {
        // Handler can access context
        context.setFormState({ test: 'value' });
        context.setCurrentScreenId('newScreen');
      });

      registerActionHandler('testAction' as any, customHandler);

      const action = { type: 'testAction' } as any;

      dispatchAction(action, mockContext);

      expect(mockContext.setFormState).toHaveBeenCalledWith({ test: 'value' });
      expect(mockContext.setCurrentScreenId).toHaveBeenCalledWith('newScreen');
    });
  });
});
