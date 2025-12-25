// FIX: Import React to provide the 'React' namespace for types like React.SetStateAction.
import React, { useState, useCallback } from 'react';

type StateInitializer<T> = T | (() => T);

export const useHistory = <T,>(initialState: StateInitializer<T>) => {
  const [history, setHistory] = useState(() => {
    const present = typeof initialState === 'function' ? (initialState as () => T)() : initialState;
    return {
      past: [] as T[],
      present: present,
      future: [] as T[],
    };
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;

    setHistory(currentHistory => {
      const { past, present, future } = currentHistory;
      const [newPresent, ...newPast] = past;
      return {
        past: newPast,
        present: newPresent,
        future: [present, ...future],
      };
    });
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    setHistory(currentHistory => {
      const { past, present, future } = currentHistory;
      const [newPresent, ...newFuture] = future;
      return {
        past: [present, ...past],
        present: newPresent,
        future: newFuture,
      };
    });
  }, [canRedo]);
  
  const setState = useCallback((action: React.SetStateAction<T>) => {
      setHistory(currentHistory => {
          const { past, present } = currentHistory;
          const newPresent = typeof action === 'function' 
              ? (action as (prevState: T) => T)(present) 
              : action;

          if (JSON.stringify(present) === JSON.stringify(newPresent)) {
              return currentHistory;
          }

          return {
              past: [present, ...past],
              present: newPresent,
              future: [], // Clear future on new state
          };
      });
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
