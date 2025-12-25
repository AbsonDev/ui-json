import { useState, useCallback } from 'react';

export interface Session {
  user: any;
}

/**
 * Hook for managing session state
 * Handles user authentication session
 */
export function useSessionState() {
  const [session, setSession] = useState<Session | null>(null);

  const login = useCallback((user: any) => {
    setSession({ user });
  }, []);

  const logout = useCallback(() => {
    setSession(null);
  }, []);

  const updateSession = useCallback((updates: Partial<Session>) => {
    setSession(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const isAuthenticated = session !== null;

  return {
    session,
    setSession,
    login,
    logout,
    updateSession,
    isAuthenticated,
  };
}
