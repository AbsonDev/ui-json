import {
  handleAuthLogin,
  handleAuthSignup,
  handleAuthLogout,
} from '../auth-handler';
import { ActionContext } from '../../action-context';
import { UIAction } from '../../../../types';

describe('Auth Handler', () => {
  describe('handleAuthLogin', () => {
    it('should login user with correct credentials', () => {
      const mockSetSession = jest.fn();
      const mockSetCurrentScreenId = jest.fn();
      const mockSetFormState = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: mockSetCurrentScreenId,
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
            authentication: {
              userTable: 'users',
              emailField: 'email',
              passwordField: 'password',
              postLoginScreen: 'dashboard',
            },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {
          emailInput: 'user@example.com',
          passwordInput: 'password123',
        },
        setFormState: mockSetFormState,
        currentDbData: {
          users: [
            { id: '1', email: 'user@example.com', password: 'password123', name: 'Test User' },
          ],
        },
        setCurrentDbData: jest.fn(),
        databaseData: null,
        setSession: mockSetSession,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'auth:login' }> = {
        type: 'auth:login',
        fields: {
          email: 'emailInput',
          password: 'passwordInput',
        },
      };

      handleAuthLogin(action, mockContext);

      expect(mockSetSession).toHaveBeenCalledWith({
        user: { id: '1', email: 'user@example.com', password: 'password123', name: 'Test User' },
      });
      expect(mockSetCurrentScreenId).toHaveBeenCalledWith('dashboard');
      expect(mockSetFormState).toHaveBeenCalledWith({});
    });

    it('should call onError with incorrect credentials', () => {
      const mockHandleAction = jest.fn();
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
            authentication: {
              userTable: 'users',
              emailField: 'email',
              passwordField: 'password',
              postLoginScreen: 'dashboard',
            },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {
          emailInput: 'user@example.com',
          passwordInput: 'wrongpassword',
        },
        setFormState: jest.fn(),
        currentDbData: {
          users: [
            { id: '1', email: 'user@example.com', password: 'password123' },
          ],
        },
        setCurrentDbData: jest.fn(),
        databaseData: null,
        setSession: jest.fn(),
        handleAction: mockHandleAction,
      };

      const action: Extract<UIAction, { type: 'auth:login' }> = {
        type: 'auth:login',
        fields: {
          email: 'emailInput',
          password: 'passwordInput',
        },
        onError: { type: 'popup', title: 'Error', message: 'Invalid credentials' },
      };

      handleAuthLogin(action, mockContext);

      expect(mockHandleAction).toHaveBeenCalledWith({
        type: 'popup',
        title: 'Error',
        message: 'Invalid credentials',
      });
      expect(mockContext.setSession).not.toHaveBeenCalled();
    });

    it('should do nothing when authConfig is not defined', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        setSession: jest.fn(),
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'auth:login' }> = {
        type: 'auth:login',
        fields: {
          email: 'emailInput',
          password: 'passwordInput',
        },
      };

      handleAuthLogin(action, mockContext);

      expect(mockContext.setSession).not.toHaveBeenCalled();
      expect(mockContext.setCurrentScreenId).not.toHaveBeenCalled();
    });

    it('should handle empty user table', () => {
      const mockHandleAction = jest.fn();
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
            authentication: {
              userTable: 'users',
              emailField: 'email',
              passwordField: 'password',
              postLoginScreen: 'dashboard',
            },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {
          emailInput: 'user@example.com',
          passwordInput: 'password123',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        setSession: jest.fn(),
        handleAction: mockHandleAction,
      };

      const action: Extract<UIAction, { type: 'auth:login' }> = {
        type: 'auth:login',
        fields: {
          email: 'emailInput',
          password: 'passwordInput',
        },
        onError: { type: 'popup', title: 'Error', message: 'User not found' },
      };

      handleAuthLogin(action, mockContext);

      expect(mockHandleAction).toHaveBeenCalled();
      expect(mockContext.setSession).not.toHaveBeenCalled();
    });

    it('should not call onError when credentials are wrong and onError is not provided', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
            authentication: {
              userTable: 'users',
              emailField: 'email',
              passwordField: 'password',
              postLoginScreen: 'dashboard',
            },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {
          emailInput: 'user@example.com',
          passwordInput: 'wrongpassword',
        },
        setFormState: jest.fn(),
        currentDbData: {
          users: [{ id: '1', email: 'user@example.com', password: 'password123' }],
        },
        setCurrentDbData: jest.fn(),
        databaseData: null,
        setSession: jest.fn(),
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'auth:login' }> = {
        type: 'auth:login',
        fields: {
          email: 'emailInput',
          password: 'passwordInput',
        },
      };

      handleAuthLogin(action, mockContext);

      expect(mockContext.handleAction).not.toHaveBeenCalled();
      expect(mockContext.setSession).not.toHaveBeenCalled();
    });
  });

  describe('handleAuthSignup', () => {
    it('should create new user and login', () => {
      const mockSetCurrentDbData = jest.fn();
      const mockSetSession = jest.fn();
      const mockSetCurrentScreenId = jest.fn();
      const mockSetFormState = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: mockSetCurrentScreenId,
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
            authentication: {
              userTable: 'users',
              emailField: 'email',
              passwordField: 'password',
              postLoginScreen: 'dashboard',
            },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {
          emailInput: 'newuser@example.com',
          passwordInput: 'newpass123',
          nameInput: 'New User',
        },
        setFormState: mockSetFormState,
        currentDbData: {
          users: [],
        },
        setCurrentDbData: mockSetCurrentDbData,
        databaseData: null,
        setSession: mockSetSession,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'auth:signup' }> = {
        type: 'auth:signup',
        fields: {
          email: 'emailInput',
          password: 'passwordInput',
          name: 'nameInput',
        },
      };

      handleAuthSignup(action, mockContext);

      const calls = mockSetCurrentDbData.mock.calls[0][0];
      expect(calls.users).toHaveLength(1);
      expect(calls.users[0]).toMatchObject({
        email: 'newuser@example.com',
        password: 'newpass123',
        name: 'New User',
      });
      expect(calls.users[0].id).toBeDefined();

      expect(mockSetSession).toHaveBeenCalledWith({
        user: expect.objectContaining({
          email: 'newuser@example.com',
          password: 'newpass123',
          name: 'New User',
        }),
      });
      expect(mockSetCurrentScreenId).toHaveBeenCalledWith('dashboard');
      expect(mockSetFormState).toHaveBeenCalledWith({});
    });

    it('should call onError when user already exists', () => {
      const mockHandleAction = jest.fn();
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
            authentication: {
              userTable: 'users',
              emailField: 'email',
              passwordField: 'password',
              postLoginScreen: 'dashboard',
            },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {
          emailInput: 'existing@example.com',
          passwordInput: 'password123',
        },
        setFormState: jest.fn(),
        currentDbData: {
          users: [
            { id: '1', email: 'existing@example.com', password: 'oldpass' },
          ],
        },
        setCurrentDbData: jest.fn(),
        databaseData: null,
        setSession: jest.fn(),
        handleAction: mockHandleAction,
      };

      const action: Extract<UIAction, { type: 'auth:signup' }> = {
        type: 'auth:signup',
        fields: {
          email: 'emailInput',
          password: 'passwordInput',
        },
        onError: { type: 'popup', title: 'Error', message: 'User already exists' },
      };

      handleAuthSignup(action, mockContext);

      expect(mockHandleAction).toHaveBeenCalledWith({
        type: 'popup',
        title: 'Error',
        message: 'User already exists',
      });
      expect(mockContext.setCurrentDbData).not.toHaveBeenCalled();
      expect(mockContext.setSession).not.toHaveBeenCalled();
    });

    it('should do nothing when authConfig is not defined', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        setSession: jest.fn(),
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'auth:signup' }> = {
        type: 'auth:signup',
        fields: {
          email: 'emailInput',
          password: 'passwordInput',
        },
      };

      handleAuthSignup(action, mockContext);

      expect(mockContext.setCurrentDbData).not.toHaveBeenCalled();
      expect(mockContext.setSession).not.toHaveBeenCalled();
    });

    it('should not call onError when user exists but onError is not provided', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
            authentication: {
              userTable: 'users',
              emailField: 'email',
              passwordField: 'password',
              postLoginScreen: 'dashboard',
            },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {
          emailInput: 'existing@example.com',
        },
        setFormState: jest.fn(),
        currentDbData: {
          users: [{ id: '1', email: 'existing@example.com' }],
        },
        setCurrentDbData: jest.fn(),
        databaseData: null,
        setSession: jest.fn(),
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'auth:signup' }> = {
        type: 'auth:signup',
        fields: {
          email: 'emailInput',
          password: 'passwordInput',
        },
      };

      handleAuthSignup(action, mockContext);

      expect(mockContext.handleAction).not.toHaveBeenCalled();
      expect(mockContext.setCurrentDbData).not.toHaveBeenCalled();
    });

    it('should handle empty user table', () => {
      const mockSetCurrentDbData = jest.fn();
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
            authentication: {
              userTable: 'users',
              emailField: 'email',
              passwordField: 'password',
              postLoginScreen: 'dashboard',
            },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {
          emailInput: 'newuser@example.com',
          passwordInput: 'password123',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: mockSetCurrentDbData,
        databaseData: null,
        setSession: jest.fn(),
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'auth:signup' }> = {
        type: 'auth:signup',
        fields: {
          email: 'emailInput',
          password: 'passwordInput',
        },
      };

      handleAuthSignup(action, mockContext);

      expect(mockSetCurrentDbData).toHaveBeenCalled();
      const calls = mockSetCurrentDbData.mock.calls[0][0];
      expect(calls.users).toHaveLength(1);
    });
  });

  describe('handleAuthLogout', () => {
    it('should clear session and call onSuccess action', () => {
      const mockSetSession = jest.fn();
      const mockHandleAction = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        setSession: mockSetSession,
        handleAction: mockHandleAction,
      };

      const action: Extract<UIAction, { type: 'auth:logout' }> = {
        type: 'auth:logout',
        onSuccess: { type: 'navigate', target: 'login' },
      };

      handleAuthLogout(action, mockContext);

      expect(mockSetSession).toHaveBeenCalledWith(null);
      expect(mockHandleAction).toHaveBeenCalledWith({
        type: 'navigate',
        target: 'login',
      });
      expect(mockContext.setCurrentScreenId).not.toHaveBeenCalled();
    });

    it('should navigate to initial screen when onSuccess is not provided', () => {
      const mockSetSession = jest.fn();
      const mockSetCurrentScreenId = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: mockSetCurrentScreenId,
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: { primaryColor: '#000', backgroundColor: '#fff' },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        setSession: mockSetSession,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'auth:logout' }> = {
        type: 'auth:logout',
      };

      handleAuthLogout(action, mockContext);

      expect(mockSetSession).toHaveBeenCalledWith(null);
      expect(mockSetCurrentScreenId).toHaveBeenCalledWith('home');
      expect(mockContext.handleAction).not.toHaveBeenCalled();
    });

    it('should navigate to empty string when uiApp is not defined', () => {
      const mockSetSession = jest.fn();
      const mockSetCurrentScreenId = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: mockSetCurrentScreenId,
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        setSession: mockSetSession,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'auth:logout' }> = {
        type: 'auth:logout',
      };

      handleAuthLogout(action, mockContext);

      expect(mockSetSession).toHaveBeenCalledWith(null);
      expect(mockSetCurrentScreenId).toHaveBeenCalledWith('');
    });

    it('should always clear session regardless of other conditions', () => {
      const mockSetSession = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        setSession: mockSetSession,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'auth:logout' }> = {
        type: 'auth:logout',
        onSuccess: { type: 'navigate', target: 'welcome' },
      };

      handleAuthLogout(action, mockContext);

      expect(mockSetSession).toHaveBeenCalledWith(null);
      expect(mockSetSession).toHaveBeenCalledTimes(1);
    });
  });
});
