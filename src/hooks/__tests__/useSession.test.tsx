/**
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { useSession, SessionContext } from '../useSession';

describe('useSession', () => {
  describe('Default Context', () => {
    it('should return default context value when used outside provider', () => {
      const { result } = renderHook(() => useSession());

      // When used outside provider, returns the default context value
      expect(result.current.session).toBeNull();
    });
  });

  describe('With Provider', () => {
    it('should return session from context', () => {
      const mockSession = { user: { id: '123', name: 'Test User' } };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionContext.Provider value={{ session: mockSession }}>
          {children}
        </SessionContext.Provider>
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.session).toEqual(mockSession);
    });

    it('should return null session when not authenticated', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionContext.Provider value={{ session: null }}>
          {children}
        </SessionContext.Provider>
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.session).toBeNull();
    });

    it('should handle session with minimal user data', () => {
      const mockSession = { user: { id: '456' } };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionContext.Provider value={{ session: mockSession }}>
          {children}
        </SessionContext.Provider>
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.session?.user.id).toBe('456');
    });

    it('should handle session with complex user data', () => {
      const mockSession = {
        user: {
          id: '789',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          metadata: {
            lastLogin: '2025-01-01',
            preferences: { theme: 'dark' },
          },
        },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionContext.Provider value={{ session: mockSession }}>
          {children}
        </SessionContext.Provider>
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.session).toEqual(mockSession);
      expect(result.current.session?.user.metadata).toBeDefined();
    });

    it('should return context value exactly as provided', () => {
      const contextValue = {
        session: { user: { id: 'test-id', custom: 'value' } },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionContext.Provider value={contextValue}>
          {children}
        </SessionContext.Provider>
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current).toBe(contextValue);
    });
  });

  describe('Context Updates', () => {
    it('should reflect context updates', () => {
      let contextValue = { session: null as { user: any } | null };

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionContext.Provider value={contextValue}>
          {children}
        </SessionContext.Provider>
      );

      const { result, rerender } = renderHook(() => useSession(), {
        wrapper: Wrapper,
      });

      expect(result.current.session).toBeNull();

      // Update context value
      contextValue = { session: { user: { id: '123' } } };
      rerender();

      expect(result.current.session).toEqual({ user: { id: '123' } });
    });
  });

  describe('SessionContext Default Value', () => {
    it('should have null session as default', () => {
      expect(SessionContext._currentValue).toEqual({ session: null });
    });
  });

  describe('Type Safety', () => {
    it('should handle user with any type', () => {
      const mockSession = {
        user: {
          id: 123, // number
          name: 'Test',
          active: true, // boolean
          tags: ['tag1', 'tag2'], // array
        },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionContext.Provider value={{ session: mockSession }}>
          {children}
        </SessionContext.Provider>
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.session?.user.id).toBe(123);
      expect(result.current.session?.user.active).toBe(true);
      expect(result.current.session?.user.tags).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user object', () => {
      const mockSession = { user: {} };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionContext.Provider value={{ session: mockSession }}>
          {children}
        </SessionContext.Provider>
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.session).toEqual({ user: {} });
    });

    it('should handle null user', () => {
      const mockSession = { user: null };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionContext.Provider value={{ session: mockSession }}>
          {children}
        </SessionContext.Provider>
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.session?.user).toBeNull();
    });

    it('should handle undefined user', () => {
      const mockSession = { user: undefined };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionContext.Provider value={{ session: mockSession }}>
          {children}
        </SessionContext.Provider>
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.session?.user).toBeUndefined();
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should return same context value for multiple instances', () => {
      const mockSession = { user: { id: 'shared-id' } };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionContext.Provider value={{ session: mockSession }}>
          {children}
        </SessionContext.Provider>
      );

      const { result: result1 } = renderHook(() => useSession(), { wrapper });
      const { result: result2 } = renderHook(() => useSession(), { wrapper });

      expect(result1.current.session).toEqual(result2.current.session);
    });
  });

  describe('Integration with SessionContext', () => {
    it('should use SessionContext correctly', () => {
      const mockSession = { user: { id: 'integration-test' } };

      const TestComponent = () => {
        const { session } = useSession();
        return <div>{session?.user.id}</div>;
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionContext.Provider value={{ session: mockSession }}>
          {children}
        </SessionContext.Provider>
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      expect(result.current.session?.user.id).toBe('integration-test');
    });
  });
});
