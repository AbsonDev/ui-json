import { useEffect } from 'react';
import { useHistory } from './useHistory';
import { STORAGE_KEYS } from '../lib/constants/storage-keys';

export interface App {
  name: string;
  json: string;
}

/**
 * Hook for managing apps state with undo/redo capabilities
 * Handles apps array with localStorage persistence and history tracking
 */
export function useAppsState(initialApps: App[]) {
  const {
    state: apps,
    setState: setApps,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<App[]>(() => {
    const savedApps = localStorage.getItem(STORAGE_KEYS.APPS);
    if (savedApps) {
      try {
        return JSON.parse(savedApps);
      } catch (e) {
        console.error('Failed to parse saved apps from localStorage', e);
        return initialApps;
      }
    }
    return initialApps;
  });

  // Effect to save apps to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(apps));
  }, [apps]);

  return {
    apps,
    setApps,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
