import { useState, useCallback } from 'react';

/**
 * Hook for managing screen navigation state
 * Handles current screen ID and navigation logic
 */
export function useScreenNavigation() {
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);

  const navigateToScreen = useCallback((screenId: string) => {
    setCurrentScreenId(screenId);
  }, []);

  const resetNavigation = useCallback(() => {
    setCurrentScreenId(null);
  }, []);

  return {
    currentScreenId,
    setCurrentScreenId,
    navigateToScreen,
    resetNavigation,
  };
}
