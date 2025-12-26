/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useSessionState } from '../useSessionState';

describe('useSessionState', () => {
  describe('Initialization', () => {
    it('should initialize with null session', () => {
      const { result } = renderHook(() => useSessionState());

      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => useSessionState());

      expect(typeof result.current.setSession).toBe('function');
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.updateSession).toBe('function');
    });
  });

  describe('Login', () => {
    it('should login user', () => {
      const { result } = renderHook(() => useSessionState());
      const user = { id: '123', email: 'test@example.com', name: 'Test User' };

      act(() => {
        result.current.login(user);
      });

      expect(result.current.session).toEqual({ user });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle user with minimal data', () => {
      const { result } = renderHook(() => useSessionState());
      const user = { id: '456' };

      act(() => {
        result.current.login(user);
      });

      expect(result.current.session?.user).toEqual(user);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle user with complex data', () => {
      const { result } = renderHook(() => useSessionState());
      const user = {
        id: '789',
        email: 'complex@example.com',
        name: 'Complex User',
        roles: ['admin', 'user'],
        metadata: {
          lastLogin: '2025-01-01',
          preferences: { theme: 'dark' },
        },
      };

      act(() => {
        result.current.login(user);
      });

      expect(result.current.session?.user).toEqual(user);
    });

    it('should override previous session on login', () => {
      const { result } = renderHook(() => useSessionState());
      const user1 = { id: '1', name: 'User 1' };
      const user2 = { id: '2', name: 'User 2' };

      act(() => {
        result.current.login(user1);
      });

      expect(result.current.session?.user.id).toBe('1');

      act(() => {
        result.current.login(user2);
      });

      expect(result.current.session?.user.id).toBe('2');
    });
  });

  describe('Logout', () => {
    it('should logout user', () => {
      const { result } = renderHook(() => useSessionState());
      const user = { id: '123', name: 'Test' };

      act(() => {
        result.current.login(user);
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle logout when not logged in', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.logout();
      });

      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle multiple consecutive logouts', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.logout();
        result.current.logout();
        result.current.logout();
      });

      expect(result.current.session).toBeNull();
    });
  });

  describe('SetSession', () => {
    it('should set session directly', () => {
      const { result } = renderHook(() => useSessionState());
      const session = { user: { id: '999', email: 'direct@example.com' } };

      act(() => {
        result.current.setSession(session);
      });

      expect(result.current.session).toEqual(session);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should set session to null', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.login({ id: '123' });
        result.current.setSession(null);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('UpdateSession', () => {
    it('should update session when logged in', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.login({ id: '123', name: 'Original' });
      });

      act(() => {
        result.current.updateSession({ user: { id: '123', name: 'Updated' } });
      });

      expect(result.current.session?.user.name).toBe('Updated');
    });

    it('should merge updates with existing session', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.setSession({
          user: { id: '123', email: 'test@example.com', name: 'Test' },
        });
      });

      act(() => {
        result.current.updateSession({ user: { id: '123', name: 'Updated Name' } });
      });

      expect(result.current.session).toEqual({
        user: { id: '123', name: 'Updated Name' },
      });
    });

    it('should not update when session is null', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.updateSession({ user: { id: '999' } });
      });

      expect(result.current.session).toBeNull();
    });

    it('should handle empty updates', () => {
      const { result } = renderHook(() => useSessionState());
      const originalSession = { user: { id: '123', name: 'Test' } };

      act(() => {
        result.current.setSession(originalSession);
      });

      act(() => {
        result.current.updateSession({});
      });

      expect(result.current.session).toEqual(originalSession);
    });

    it('should handle partial user updates', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.setSession({
          user: { id: '123', email: 'old@example.com', name: 'Old Name' },
        });
      });

      act(() => {
        result.current.updateSession({
          user: { id: '123', email: 'old@example.com', name: 'Old Name', role: 'admin' },
        });
      });

      expect(result.current.session?.user).toHaveProperty('role', 'admin');
    });
  });

  describe('isAuthenticated', () => {
    it('should be false when session is null', () => {
      const { result } = renderHook(() => useSessionState());

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should be true when session exists', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.login({ id: '123' });
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should update when session changes', () => {
      const { result } = renderHook(() => useSessionState());

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.login({ id: '123' });
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Complex Workflows', () => {
    it('should handle login -> update -> logout flow', () => {
      const { result } = renderHook(() => useSessionState());

      // Login
      act(() => {
        result.current.login({ id: '123', name: 'User' });
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Update
      act(() => {
        result.current.updateSession({ user: { id: '123', name: 'Updated User' } });
      });

      expect(result.current.session?.user.name).toBe('Updated User');

      // Logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle multiple updates', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.login({ id: '123' });
      });

      act(() => {
        result.current.updateSession({ user: { id: '123', name: 'First' } });
        result.current.updateSession({ user: { id: '123', email: 'test@example.com' } });
        result.current.updateSession({ user: { id: '123', role: 'admin' } });
      });

      expect(result.current.session?.user).toHaveProperty('role', 'admin');
    });

    it('should handle re-login after logout', () => {
      const { result } = renderHook(() => useSessionState());
      const user1 = { id: '1', name: 'First User' };
      const user2 = { id: '2', name: 'Second User' };

      act(() => {
        result.current.login(user1);
      });

      expect(result.current.session?.user.id).toBe('1');

      act(() => {
        result.current.logout();
      });

      expect(result.current.session).toBeNull();

      act(() => {
        result.current.login(user2);
      });

      expect(result.current.session?.user.id).toBe('2');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Function Stability', () => {
    it('should have stable function references', () => {
      const { result, rerender } = renderHook(() => useSessionState());

      const functions = {
        login: result.current.login,
        logout: result.current.logout,
        updateSession: result.current.updateSession,
      };

      rerender();

      expect(result.current.login).toBe(functions.login);
      expect(result.current.logout).toBe(functions.logout);
      expect(result.current.updateSession).toBe(functions.updateSession);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user in login', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.login(null);
      });

      expect(result.current.session).toEqual({ user: null });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle undefined user in login', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.login(undefined);
      });

      expect(result.current.session).toEqual({ user: undefined });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle empty object user', () => {
      const { result } = renderHook(() => useSessionState());

      act(() => {
        result.current.login({});
      });

      expect(result.current.session).toEqual({ user: {} });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should maintain state across re-renders', () => {
      const { result, rerender } = renderHook(() => useSessionState());

      act(() => {
        result.current.login({ id: '123', name: 'Test' });
      });

      rerender();

      expect(result.current.session?.user.id).toBe('123');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
