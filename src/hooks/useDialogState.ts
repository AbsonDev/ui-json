import { useState, useCallback } from 'react';

export interface DialogConfig {
  type: 'prompt' | 'confirm' | 'alert';
  title: string;
  message: string;
  defaultValue?: string;
  onConfirm: (value?: string) => void;
}

export interface PopupConfig {
  title?: string;
  message: string;
  variant: 'alert' | 'info' | 'confirm';
  buttons?: Array<{
    text: string;
    variant?: 'primary' | 'secondary';
    action?: any;
  }>;
}

/**
 * Hook for managing dialog and popup state
 * Handles custom dialogs and popup notifications
 */
export function useDialogState() {
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [popup, setPopup] = useState<PopupConfig | null>(null);

  const openDialog = useCallback((config: DialogConfig) => {
    setDialog(config);
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  const openPopup = useCallback((config: PopupConfig) => {
    setPopup(config);
  }, []);

  const closePopup = useCallback(() => {
    setPopup(null);
  }, []);

  const showAlert = useCallback((title: string, message: string, onConfirm?: () => void) => {
    setDialog({
      type: 'alert',
      title,
      message,
      onConfirm: onConfirm || (() => {}),
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setDialog({
      type: 'confirm',
      title,
      message,
      onConfirm,
    });
  }, []);

  const showPrompt = useCallback((
    title: string,
    message: string,
    onConfirm: (value?: string) => void,
    defaultValue?: string
  ) => {
    setDialog({
      type: 'prompt',
      title,
      message,
      defaultValue,
      onConfirm,
    });
  }, []);

  return {
    dialog,
    setDialog,
    openDialog,
    closeDialog,
    popup,
    setPopup,
    openPopup,
    closePopup,
    showAlert,
    showConfirm,
    showPrompt,
  };
}
