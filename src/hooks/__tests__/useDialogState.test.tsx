/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useDialogState, DialogConfig, PopupConfig } from '../useDialogState';

describe('useDialogState', () => {
  describe('Initialization', () => {
    it('should initialize with null dialog and popup', () => {
      const { result } = renderHook(() => useDialogState());

      expect(result.current.dialog).toBeNull();
      expect(result.current.popup).toBeNull();
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => useDialogState());

      expect(typeof result.current.openDialog).toBe('function');
      expect(typeof result.current.closeDialog).toBe('function');
      expect(typeof result.current.openPopup).toBe('function');
      expect(typeof result.current.closePopup).toBe('function');
      expect(typeof result.current.showAlert).toBe('function');
      expect(typeof result.current.showConfirm).toBe('function');
      expect(typeof result.current.showPrompt).toBe('function');
      expect(typeof result.current.setDialog).toBe('function');
      expect(typeof result.current.setPopup).toBe('function');
    });
  });

  describe('Dialog Management', () => {
    it('should open dialog with config', () => {
      const { result } = renderHook(() => useDialogState());
      const onConfirm = jest.fn();

      const config: DialogConfig = {
        type: 'confirm',
        title: 'Delete Item',
        message: 'Are you sure?',
        onConfirm,
      };

      act(() => {
        result.current.openDialog(config);
      });

      expect(result.current.dialog).toEqual(config);
    });

    it('should close dialog', () => {
      const { result } = renderHook(() => useDialogState());
      const config: DialogConfig = {
        type: 'alert',
        title: 'Warning',
        message: 'Please check',
        onConfirm: jest.fn(),
      };

      act(() => {
        result.current.openDialog(config);
      });

      expect(result.current.dialog).not.toBeNull();

      act(() => {
        result.current.closeDialog();
      });

      expect(result.current.dialog).toBeNull();
    });

    it('should set dialog directly', () => {
      const { result } = renderHook(() => useDialogState());
      const config: DialogConfig = {
        type: 'prompt',
        title: 'Enter Name',
        message: 'What is your name?',
        defaultValue: 'John',
        onConfirm: jest.fn(),
      };

      act(() => {
        result.current.setDialog(config);
      });

      expect(result.current.dialog).toEqual(config);
    });
  });

  describe('Popup Management', () => {
    it('should open popup with config', () => {
      const { result } = renderHook(() => useDialogState());

      const config: PopupConfig = {
        title: 'Success',
        message: 'Operation completed',
        variant: 'info',
      };

      act(() => {
        result.current.openPopup(config);
      });

      expect(result.current.popup).toEqual(config);
    });

    it('should close popup', () => {
      const { result } = renderHook(() => useDialogState());

      const config: PopupConfig = {
        message: 'Error occurred',
        variant: 'alert',
      };

      act(() => {
        result.current.openPopup(config);
      });

      expect(result.current.popup).not.toBeNull();

      act(() => {
        result.current.closePopup();
      });

      expect(result.current.popup).toBeNull();
    });

    it('should handle popup with buttons', () => {
      const { result } = renderHook(() => useDialogState());
      const action1 = jest.fn();
      const action2 = jest.fn();

      const config: PopupConfig = {
        title: 'Confirm Action',
        message: 'Do you want to proceed?',
        variant: 'confirm',
        buttons: [
          { text: 'Yes', variant: 'primary', action: action1 },
          { text: 'No', variant: 'secondary', action: action2 },
        ],
      };

      act(() => {
        result.current.openPopup(config);
      });

      expect(result.current.popup).toEqual(config);
      expect(result.current.popup?.buttons).toHaveLength(2);
    });

    it('should set popup directly', () => {
      const { result } = renderHook(() => useDialogState());

      const config: PopupConfig = {
        message: 'Direct popup',
        variant: 'info',
      };

      act(() => {
        result.current.setPopup(config);
      });

      expect(result.current.popup).toEqual(config);
    });
  });

  describe('showAlert', () => {
    it('should create alert dialog', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.showAlert('Warning', 'This is a warning message');
      });

      expect(result.current.dialog).toEqual({
        type: 'alert',
        title: 'Warning',
        message: 'This is a warning message',
        onConfirm: expect.any(Function),
      });
    });

    it('should create alert with custom onConfirm', () => {
      const { result } = renderHook(() => useDialogState());
      const onConfirm = jest.fn();

      act(() => {
        result.current.showAlert('Success', 'Operation successful', onConfirm);
      });

      expect(result.current.dialog?.type).toBe('alert');
      expect(result.current.dialog?.onConfirm).toBe(onConfirm);
    });

    it('should use empty function if no onConfirm provided', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.showAlert('Info', 'Information message');
      });

      expect(result.current.dialog?.onConfirm).toBeDefined();
      // Should not throw when called
      act(() => {
        result.current.dialog?.onConfirm();
      });
    });
  });

  describe('showConfirm', () => {
    it('should create confirm dialog', () => {
      const { result } = renderHook(() => useDialogState());
      const onConfirm = jest.fn();

      act(() => {
        result.current.showConfirm(
          'Delete Item',
          'Are you sure you want to delete this item?',
          onConfirm
        );
      });

      expect(result.current.dialog).toEqual({
        type: 'confirm',
        title: 'Delete Item',
        message: 'Are you sure you want to delete this item?',
        onConfirm,
      });
    });

    it('should call onConfirm when confirmed', () => {
      const { result } = renderHook(() => useDialogState());
      const onConfirm = jest.fn();

      act(() => {
        result.current.showConfirm('Confirm', 'Proceed?', onConfirm);
      });

      act(() => {
        result.current.dialog?.onConfirm();
      });

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('showPrompt', () => {
    it('should create prompt dialog without default value', () => {
      const { result } = renderHook(() => useDialogState());
      const onConfirm = jest.fn();

      act(() => {
        result.current.showPrompt(
          'Enter Name',
          'Please enter your name',
          onConfirm
        );
      });

      expect(result.current.dialog).toEqual({
        type: 'prompt',
        title: 'Enter Name',
        message: 'Please enter your name',
        onConfirm,
        defaultValue: undefined,
      });
    });

    it('should create prompt dialog with default value', () => {
      const { result } = renderHook(() => useDialogState());
      const onConfirm = jest.fn();

      act(() => {
        result.current.showPrompt(
          'Rename File',
          'Enter new file name',
          onConfirm,
          'document.txt'
        );
      });

      expect(result.current.dialog).toEqual({
        type: 'prompt',
        title: 'Rename File',
        message: 'Enter new file name',
        defaultValue: 'document.txt',
        onConfirm,
      });
    });

    it('should call onConfirm with value', () => {
      const { result } = renderHook(() => useDialogState());
      const onConfirm = jest.fn();

      act(() => {
        result.current.showPrompt('Input', 'Enter value', onConfirm);
      });

      act(() => {
        result.current.dialog?.onConfirm('test value');
      });

      expect(onConfirm).toHaveBeenCalledWith('test value');
    });
  });

  describe('Dialog Types', () => {
    it('should handle all dialog types', () => {
      const { result } = renderHook(() => useDialogState());

      // Alert
      act(() => {
        result.current.showAlert('Alert', 'Message');
      });
      expect(result.current.dialog?.type).toBe('alert');

      // Confirm
      act(() => {
        result.current.showConfirm('Confirm', 'Message', jest.fn());
      });
      expect(result.current.dialog?.type).toBe('confirm');

      // Prompt
      act(() => {
        result.current.showPrompt('Prompt', 'Message', jest.fn());
      });
      expect(result.current.dialog?.type).toBe('prompt');
    });
  });

  describe('Popup Variants', () => {
    it('should handle all popup variants', () => {
      const { result } = renderHook(() => useDialogState());

      // Alert
      act(() => {
        result.current.openPopup({ message: 'Error', variant: 'alert' });
      });
      expect(result.current.popup?.variant).toBe('alert');

      // Info
      act(() => {
        result.current.openPopup({ message: 'Info', variant: 'info' });
      });
      expect(result.current.popup?.variant).toBe('info');

      // Confirm
      act(() => {
        result.current.openPopup({ message: 'Confirm', variant: 'confirm' });
      });
      expect(result.current.popup?.variant).toBe('confirm');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple dialog opens', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.showAlert('First', 'First message');
      });

      const firstDialog = result.current.dialog;

      act(() => {
        result.current.showAlert('Second', 'Second message');
      });

      expect(result.current.dialog?.title).toBe('Second');
      expect(result.current.dialog).not.toBe(firstDialog);
    });

    it('should handle multiple popup opens', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.openPopup({ message: 'First', variant: 'info' });
      });

      act(() => {
        result.current.openPopup({ message: 'Second', variant: 'alert' });
      });

      expect(result.current.popup?.message).toBe('Second');
    });

    it('should handle closing null dialog', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.closeDialog();
      });

      expect(result.current.dialog).toBeNull();
    });

    it('should handle closing null popup', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.closePopup();
      });

      expect(result.current.popup).toBeNull();
    });

    it('should handle empty strings in dialog', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.showAlert('', '');
      });

      expect(result.current.dialog?.title).toBe('');
      expect(result.current.dialog?.message).toBe('');
    });

    it('should handle empty string in popup', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.openPopup({ message: '', variant: 'info' });
      });

      expect(result.current.popup?.message).toBe('');
    });
  });

  describe('Function Stability', () => {
    it('should have stable function references', () => {
      const { result, rerender } = renderHook(() => useDialogState());

      const functions = {
        openDialog: result.current.openDialog,
        closeDialog: result.current.closeDialog,
        openPopup: result.current.openPopup,
        closePopup: result.current.closePopup,
        showAlert: result.current.showAlert,
        showConfirm: result.current.showConfirm,
        showPrompt: result.current.showPrompt,
      };

      rerender();

      expect(result.current.openDialog).toBe(functions.openDialog);
      expect(result.current.closeDialog).toBe(functions.closeDialog);
      expect(result.current.openPopup).toBe(functions.openPopup);
      expect(result.current.closePopup).toBe(functions.closePopup);
      expect(result.current.showAlert).toBe(functions.showAlert);
      expect(result.current.showConfirm).toBe(functions.showConfirm);
      expect(result.current.showPrompt).toBe(functions.showPrompt);
    });
  });
});
