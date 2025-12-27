import { handlePopup } from '../popup-handler';
import { ActionContext } from '../../action-context';
import { UIAction } from '../../../../types';

describe('Popup Handler', () => {
  describe('handlePopup', () => {
    it('should call setPopup with correct popup data', () => {
      const mockSetPopup = jest.fn();
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        setPopup: mockSetPopup,
      };

      const action: Extract<UIAction, { type: 'popup' }> = {
        type: 'popup',
        title: 'Test Title',
        message: 'Test Message',
      };

      handlePopup(action, mockContext);

      expect(mockSetPopup).toHaveBeenCalledWith({
        title: 'Test Title',
        message: 'Test Message',
        variant: 'alert',
        buttons: undefined,
      });
      expect(mockSetPopup).toHaveBeenCalledTimes(1);
    });

    it('should use provided variant when specified', () => {
      const mockSetPopup = jest.fn();
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        setPopup: mockSetPopup,
      };

      const action: Extract<UIAction, { type: 'popup' }> = {
        type: 'popup',
        title: 'Confirmation',
        message: 'Are you sure?',
        variant: 'confirm',
      };

      handlePopup(action, mockContext);

      expect(mockSetPopup).toHaveBeenCalledWith({
        title: 'Confirmation',
        message: 'Are you sure?',
        variant: 'confirm',
        buttons: undefined,
      });
    });

    it('should pass buttons when provided', () => {
      const mockSetPopup = jest.fn();
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        setPopup: mockSetPopup,
      };

      const buttons = [
        { label: 'Cancel', action: { type: 'navigate' as const, target: 'home' } },
        { label: 'Confirm', action: { type: 'submit' as const, target: '/api/confirm' } },
      ];

      const action: Extract<UIAction, { type: 'popup' }> = {
        type: 'popup',
        title: 'Delete Item',
        message: 'This action cannot be undone',
        variant: 'confirm',
        buttons,
      };

      handlePopup(action, mockContext);

      expect(mockSetPopup).toHaveBeenCalledWith({
        title: 'Delete Item',
        message: 'This action cannot be undone',
        variant: 'confirm',
        buttons,
      });
    });

    it('should not call setPopup when it is undefined in context', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        setPopup: undefined,
      };

      const action: Extract<UIAction, { type: 'popup' }> = {
        type: 'popup',
        title: 'Test',
        message: 'Message',
      };

      // Should not throw error
      expect(() => handlePopup(action, mockContext)).not.toThrow();
    });

    it('should handle empty strings for title and message', () => {
      const mockSetPopup = jest.fn();
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        setPopup: mockSetPopup,
      };

      const action: Extract<UIAction, { type: 'popup' }> = {
        type: 'popup',
        title: '',
        message: '',
      };

      handlePopup(action, mockContext);

      expect(mockSetPopup).toHaveBeenCalledWith({
        title: '',
        message: '',
        variant: 'alert',
        buttons: undefined,
      });
    });

    it('should handle long text for title and message', () => {
      const mockSetPopup = jest.fn();
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        setPopup: mockSetPopup,
      };

      const longTitle = 'A'.repeat(200);
      const longMessage = 'B'.repeat(1000);

      const action: Extract<UIAction, { type: 'popup' }> = {
        type: 'popup',
        title: longTitle,
        message: longMessage,
      };

      handlePopup(action, mockContext);

      expect(mockSetPopup).toHaveBeenCalledWith({
        title: longTitle,
        message: longMessage,
        variant: 'alert',
        buttons: undefined,
      });
    });

    it('should handle special characters in title and message', () => {
      const mockSetPopup = jest.fn();
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        setPopup: mockSetPopup,
      };

      const action: Extract<UIAction, { type: 'popup' }> = {
        type: 'popup',
        title: '<script>alert("XSS")</script>',
        message: 'Line 1\nLine 2\tTabbed',
      };

      handlePopup(action, mockContext);

      expect(mockSetPopup).toHaveBeenCalledWith({
        title: '<script>alert("XSS")</script>',
        message: 'Line 1\nLine 2\tTabbed',
        variant: 'alert',
        buttons: undefined,
      });
    });

    it('should handle multiple popup calls', () => {
      const mockSetPopup = jest.fn();
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        setPopup: mockSetPopup,
      };

      const action1: Extract<UIAction, { type: 'popup' }> = {
        type: 'popup',
        title: 'First',
        message: 'Message 1',
      };

      const action2: Extract<UIAction, { type: 'popup' }> = {
        type: 'popup',
        title: 'Second',
        message: 'Message 2',
        variant: 'confirm',
      };

      handlePopup(action1, mockContext);
      handlePopup(action2, mockContext);

      expect(mockSetPopup).toHaveBeenCalledTimes(2);
      expect(mockSetPopup).toHaveBeenNthCalledWith(1, {
        title: 'First',
        message: 'Message 1',
        variant: 'alert',
        buttons: undefined,
      });
      expect(mockSetPopup).toHaveBeenNthCalledWith(2, {
        title: 'Second',
        message: 'Message 2',
        variant: 'confirm',
        buttons: undefined,
      });
    });
  });
});
