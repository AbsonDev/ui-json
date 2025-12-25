import React from 'react';
import { UIAction } from '../types';

interface IActionContext {
  handleAction: (action: UIAction) => void;
  formState: Record<string, any>;
  setFormState: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export const ActionContext = React.createContext<IActionContext | null>(null);

export const useAction = (): IActionContext => {
  const context = React.useContext(ActionContext);
  if (!context) {
    throw new Error('useAction must be used within an ActionProvider');
  }
  return context;
};
