import { handleNavigate, handleGoBack } from '../navigation-handler';
import { ActionContext } from '../../action-context';
import { UIAction } from '../../../../types';

describe('Navigation Handler', () => {
  describe('handleNavigate', () => {
    it('should call setCurrentScreenId with target screen', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
      };

      const action: Extract<UIAction, { type: 'navigate' }> = {
        type: 'navigate',
        target: 'home',
      };

      handleNavigate(action, mockContext);

      expect(mockContext.setCurrentScreenId).toHaveBeenCalledWith('home');
      expect(mockContext.setCurrentScreenId).toHaveBeenCalledTimes(1);
    });

    it('should navigate to different screen targets', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
      };

      const screens = ['profile', 'settings', 'dashboard', 'about'];

      screens.forEach((screen) => {
        const action: Extract<UIAction, { type: 'navigate' }> = {
          type: 'navigate',
          target: screen,
        };

        handleNavigate(action, mockContext);
      });

      expect(mockContext.setCurrentScreenId).toHaveBeenCalledTimes(4);
      expect(mockContext.setCurrentScreenId).toHaveBeenNthCalledWith(1, 'profile');
      expect(mockContext.setCurrentScreenId).toHaveBeenNthCalledWith(2, 'settings');
      expect(mockContext.setCurrentScreenId).toHaveBeenNthCalledWith(3, 'dashboard');
      expect(mockContext.setCurrentScreenId).toHaveBeenNthCalledWith(4, 'about');
    });

    it('should handle screen targets with special characters', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
      };

      const action: Extract<UIAction, { type: 'navigate' }> = {
        type: 'navigate',
        target: 'screen-with-dashes',
      };

      handleNavigate(action, mockContext);

      expect(mockContext.setCurrentScreenId).toHaveBeenCalledWith('screen-with-dashes');
    });

    it('should handle empty string target', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
      };

      const action: Extract<UIAction, { type: 'navigate' }> = {
        type: 'navigate',
        target: '',
      };

      handleNavigate(action, mockContext);

      expect(mockContext.setCurrentScreenId).toHaveBeenCalledWith('');
    });
  });

  describe('handleGoBack', () => {
    it('should navigate to initial screen when uiApp is defined', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: {
              primaryColor: '#000',
              backgroundColor: '#fff',
            },
          },
          screens: {},
          initialScreen: 'home',
        },
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
      };

      const action: Extract<UIAction, { type: 'goBack' }> = {
        type: 'goBack',
      };

      handleGoBack(action, mockContext);

      expect(mockContext.setCurrentScreenId).toHaveBeenCalledWith('home');
      expect(mockContext.setCurrentScreenId).toHaveBeenCalledTimes(1);
    });

    it('should not call setCurrentScreenId when uiApp is null', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
      };

      const action: Extract<UIAction, { type: 'goBack' }> = {
        type: 'goBack',
      };

      handleGoBack(action, mockContext);

      expect(mockContext.setCurrentScreenId).not.toHaveBeenCalled();
    });

    it('should not call setCurrentScreenId when initialScreen is undefined', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: {
              primaryColor: '#000',
              backgroundColor: '#fff',
            },
          },
          screens: {},
          initialScreen: undefined as any,
        },
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
      };

      const action: Extract<UIAction, { type: 'goBack' }> = {
        type: 'goBack',
      };

      handleGoBack(action, mockContext);

      expect(mockContext.setCurrentScreenId).not.toHaveBeenCalled();
    });

    it('should navigate to different initial screens', () => {
      const initialScreens = ['home', 'welcome', 'dashboard', 'main'];

      initialScreens.forEach((screen) => {
        const mockContext: ActionContext = {
          setCurrentScreenId: jest.fn(),
          uiApp: {
            version: '1.0.0',
            app: {
              name: 'Test App',
              theme: {
                primaryColor: '#000',
                backgroundColor: '#fff',
              },
            },
            screens: {},
            initialScreen: screen,
          },
          formState: {},
          setFormState: jest.fn(),
          databaseData: null,
        };

        const action: Extract<UIAction, { type: 'goBack' }> = {
          type: 'goBack',
        };

        handleGoBack(action, mockContext);

        expect(mockContext.setCurrentScreenId).toHaveBeenCalledWith(screen);
      });
    });

    it('should handle empty string initialScreen', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: {
          version: '1.0.0',
          app: {
            name: 'Test App',
            theme: {
              primaryColor: '#000',
              backgroundColor: '#fff',
            },
          },
          screens: {},
          initialScreen: '',
        },
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
      };

      const action: Extract<UIAction, { type: 'goBack' }> = {
        type: 'goBack',
      };

      handleGoBack(action, mockContext);

      // Empty string is falsy, so should not call setCurrentScreenId
      expect(mockContext.setCurrentScreenId).not.toHaveBeenCalled();
    });
  });
});
