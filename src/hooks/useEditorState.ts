import { useState, useCallback } from 'react';

export type ActiveTab = 'editor' | 'ai' | 'database' | 'flow' | 'snippets';

/**
 * Hook for managing editor-related state
 * Handles selected app index, active tab, and error messages
 */
export function useEditorState() {
  const [selectedAppIndex, setSelectedAppIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('editor');
  const [error, setError] = useState<string | null>(null);

  const handleAppIndexChange = useCallback((index: number) => {
    setSelectedAppIndex(index);
    setError(null); // Clear errors when switching apps
  }, []);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    selectedAppIndex,
    setSelectedAppIndex: handleAppIndexChange,
    activeTab,
    setActiveTab: handleTabChange,
    error,
    setError,
    clearError,
  };
}
