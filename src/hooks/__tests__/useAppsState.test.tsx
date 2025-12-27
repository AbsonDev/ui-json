/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useAppsState, App } from '../useAppsState';
import { STORAGE_KEYS } from '../../lib/constants/storage-keys';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Suppress console.error for expected errors
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('useAppsState', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty array when no localStorage data', () => {
      const initialApps: App[] = [];
      const { result } = renderHook(() => useAppsState(initialApps));

      expect(result.current.apps).toEqual([]);
    });

    it('should initialize with provided initialApps when no localStorage data', () => {
      const initialApps: App[] = [
        { name: 'App 1', json: '{"key":"value1"}' },
        { name: 'App 2', json: '{"key":"value2"}' },
      ];

      const { result } = renderHook(() => useAppsState(initialApps));

      expect(result.current.apps).toEqual(initialApps);
    });

    it('should initialize from localStorage when data exists', () => {
      const savedApps: App[] = [
        { name: 'Saved App', json: '{"saved":true}' },
      ];

      localStorageMock.setItem(STORAGE_KEYS.APPS, JSON.stringify(savedApps));

      const { result } = renderHook(() => useAppsState([]));

      expect(result.current.apps).toEqual(savedApps);
    });

    it('should prefer localStorage data over initialApps', () => {
      const initialApps: App[] = [{ name: 'Initial', json: '{}' }];
      const savedApps: App[] = [{ name: 'Saved', json: '{"saved":true}' }];

      localStorageMock.setItem(STORAGE_KEYS.APPS, JSON.stringify(savedApps));

      const { result } = renderHook(() => useAppsState(initialApps));

      expect(result.current.apps).toEqual(savedApps);
      expect(result.current.apps).not.toEqual(initialApps);
    });

    it('should handle corrupted localStorage data', () => {
      const initialApps: App[] = [{ name: 'Fallback', json: '{}' }];

      localStorageMock.setItem(STORAGE_KEYS.APPS, 'invalid json {');

      const { result } = renderHook(() => useAppsState(initialApps));

      expect(result.current.apps).toEqual(initialApps);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle null localStorage data', () => {
      const initialApps: App[] = [{ name: 'App', json: '{}' }];

      localStorageMock.setItem(STORAGE_KEYS.APPS, 'null');

      const { result } = renderHook(() => useAppsState(initialApps));

      expect(result.current.apps).toEqual(null);
    });

    it('should handle undefined localStorage gracefully', () => {
      const initialApps: App[] = [{ name: 'App', json: '{}' }];

      // localStorage returns null for missing keys
      const { result } = renderHook(() => useAppsState(initialApps));

      expect(result.current.apps).toEqual(initialApps);
    });
  });

  describe('State Management', () => {
    it('should update apps state', () => {
      const { result } = renderHook(() => useAppsState([]));

      const newApps: App[] = [{ name: 'New App', json: '{"new":true}' }];

      act(() => {
        result.current.setApps(newApps);
      });

      expect(result.current.apps).toEqual(newApps);
    });

    it('should update apps state with function updater', () => {
      const initialApps: App[] = [{ name: 'App 1', json: '{}' }];
      const { result } = renderHook(() => useAppsState(initialApps));

      act(() => {
        result.current.setApps(prev => [
          ...prev,
          { name: 'App 2', json: '{"new":true}' },
        ]);
      });

      expect(result.current.apps).toHaveLength(2);
      expect(result.current.apps[1].name).toBe('App 2');
    });

    it('should handle adding multiple apps sequentially', () => {
      const { result } = renderHook(() => useAppsState([]));

      act(() => {
        result.current.setApps([{ name: 'App 1', json: '{}' }]);
      });

      act(() => {
        result.current.setApps(prev => [
          ...prev,
          { name: 'App 2', json: '{}' },
        ]);
      });

      act(() => {
        result.current.setApps(prev => [
          ...prev,
          { name: 'App 3', json: '{}' },
        ]);
      });

      expect(result.current.apps).toHaveLength(3);
    });

    it('should handle updating specific app in array', () => {
      const initialApps: App[] = [
        { name: 'App 1', json: '{"value":1}' },
        { name: 'App 2', json: '{"value":2}' },
      ];

      const { result } = renderHook(() => useAppsState(initialApps));

      act(() => {
        result.current.setApps(prev =>
          prev.map((app, index) =>
            index === 0 ? { ...app, json: '{"value":99}' } : app
          )
        );
      });

      expect(result.current.apps[0].json).toBe('{"value":99}');
      expect(result.current.apps[1].json).toBe('{"value":2}');
    });

    it('should handle removing app from array', () => {
      const initialApps: App[] = [
        { name: 'App 1', json: '{}' },
        { name: 'App 2', json: '{}' },
        { name: 'App 3', json: '{}' },
      ];

      const { result } = renderHook(() => useAppsState(initialApps));

      act(() => {
        result.current.setApps(prev => prev.filter((_, index) => index !== 1));
      });

      expect(result.current.apps).toHaveLength(2);
      expect(result.current.apps[0].name).toBe('App 1');
      expect(result.current.apps[1].name).toBe('App 3');
    });

    it('should handle clearing all apps', () => {
      const initialApps: App[] = [
        { name: 'App 1', json: '{}' },
        { name: 'App 2', json: '{}' },
      ];

      const { result } = renderHook(() => useAppsState(initialApps));

      act(() => {
        result.current.setApps([]);
      });

      expect(result.current.apps).toEqual([]);
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save apps to localStorage when updated', () => {
      const { result } = renderHook(() => useAppsState([]));

      const newApps: App[] = [{ name: 'App', json: '{}' }];

      act(() => {
        result.current.setApps(newApps);
      });

      const savedData = localStorageMock.getItem(STORAGE_KEYS.APPS);
      expect(savedData).toBe(JSON.stringify(newApps));
    });

    it('should update localStorage on every state change', () => {
      const { result } = renderHook(() => useAppsState([]));

      act(() => {
        result.current.setApps([{ name: 'App 1', json: '{}' }]);
      });

      let savedData = localStorageMock.getItem(STORAGE_KEYS.APPS);
      expect(JSON.parse(savedData!)).toHaveLength(1);

      act(() => {
        result.current.setApps(prev => [
          ...prev,
          { name: 'App 2', json: '{}' },
        ]);
      });

      savedData = localStorageMock.getItem(STORAGE_KEYS.APPS);
      expect(JSON.parse(savedData!)).toHaveLength(2);
    });

    it('should persist complex app data', () => {
      const { result } = renderHook(() => useAppsState([]));

      const complexApp: App = {
        name: 'Complex App',
        json: JSON.stringify({
          nested: {
            data: [1, 2, 3],
            object: { key: 'value' },
          },
        }),
      };

      act(() => {
        result.current.setApps([complexApp]);
      });

      const savedData = localStorageMock.getItem(STORAGE_KEYS.APPS);
      const parsed = JSON.parse(savedData!);
      expect(parsed[0]).toEqual(complexApp);
    });

    it('should save to correct localStorage key', () => {
      const { result } = renderHook(() => useAppsState([]));

      act(() => {
        result.current.setApps([{ name: 'App', json: '{}' }]);
      });

      // Verify it uses the correct key from STORAGE_KEYS
      expect(localStorageMock.getItem(STORAGE_KEYS.APPS)).toBeTruthy();
      expect(localStorageMock.getItem('wrong-key')).toBeNull();
    });
  });

  describe('Undo/Redo Functionality', () => {
    it('should have undo/redo functions', () => {
      const { result } = renderHook(() => useAppsState([]));

      expect(result.current.undo).toBeDefined();
      expect(result.current.redo).toBeDefined();
      expect(typeof result.current.undo).toBe('function');
      expect(typeof result.current.redo).toBe('function');
    });

    it('should track canUndo flag', () => {
      const { result } = renderHook(() => useAppsState([]));

      expect(result.current.canUndo).toBe(false);

      act(() => {
        result.current.setApps([{ name: 'App', json: '{}' }]);
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('should track canRedo flag', () => {
      const { result } = renderHook(() => useAppsState([]));

      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.setApps([{ name: 'App', json: '{}' }]);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);
    });

    it('should undo state change', () => {
      const initialApps: App[] = [{ name: 'Initial', json: '{}' }];
      const { result } = renderHook(() => useAppsState(initialApps));

      act(() => {
        result.current.setApps([{ name: 'Updated', json: '{}' }]);
      });

      expect(result.current.apps[0].name).toBe('Updated');

      act(() => {
        result.current.undo();
      });

      expect(result.current.apps[0].name).toBe('Initial');
    });

    it('should redo state change', () => {
      const initialApps: App[] = [{ name: 'Initial', json: '{}' }];
      const { result } = renderHook(() => useAppsState(initialApps));

      act(() => {
        result.current.setApps([{ name: 'Updated', json: '{}' }]);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.apps[0].name).toBe('Initial');

      act(() => {
        result.current.redo();
      });

      expect(result.current.apps[0].name).toBe('Updated');
    });

    it('should handle multiple undo operations', () => {
      const { result } = renderHook(() => useAppsState([]));

      act(() => {
        result.current.setApps([{ name: 'State 1', json: '{}' }]);
      });

      act(() => {
        result.current.setApps([{ name: 'State 2', json: '{}' }]);
      });

      act(() => {
        result.current.setApps([{ name: 'State 3', json: '{}' }]);
      });

      expect(result.current.apps[0].name).toBe('State 3');

      act(() => {
        result.current.undo();
      });

      expect(result.current.apps[0].name).toBe('State 2');

      act(() => {
        result.current.undo();
      });

      expect(result.current.apps[0].name).toBe('State 1');
    });

    it('should handle multiple redo operations', () => {
      const { result } = renderHook(() => useAppsState([]));

      act(() => {
        result.current.setApps([{ name: 'State 1', json: '{}' }]);
      });

      act(() => {
        result.current.setApps([{ name: 'State 2', json: '{}' }]);
      });

      // Undo twice
      act(() => {
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.apps).toEqual([]);

      // Redo twice
      act(() => {
        result.current.redo();
      });

      expect(result.current.apps[0].name).toBe('State 1');

      act(() => {
        result.current.redo();
      });

      expect(result.current.apps[0].name).toBe('State 2');
    });

    it('should clear redo history when new state is set', () => {
      const { result } = renderHook(() => useAppsState([]));

      act(() => {
        result.current.setApps([{ name: 'State 1', json: '{}' }]);
      });

      act(() => {
        result.current.setApps([{ name: 'State 2', json: '{}' }]);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      // Set new state, should clear redo history
      act(() => {
        result.current.setApps([{ name: 'New State', json: '{}' }]);
      });

      expect(result.current.canRedo).toBe(false);
    });

    it('should not undo when canUndo is false', () => {
      const { result } = renderHook(() => useAppsState([]));

      const initialState = result.current.apps;

      act(() => {
        result.current.undo();
      });

      expect(result.current.apps).toEqual(initialState);
    });

    it('should not redo when canRedo is false', () => {
      const { result } = renderHook(() => useAppsState([]));

      act(() => {
        result.current.setApps([{ name: 'App', json: '{}' }]);
      });

      const currentState = result.current.apps;

      act(() => {
        result.current.redo();
      });

      expect(result.current.apps).toEqual(currentState);
    });
  });

  describe('Edge Cases', () => {
    it('should handle apps with special characters in JSON', () => {
      const { result } = renderHook(() => useAppsState([]));

      const specialApp: App = {
        name: 'Special',
        json: '{"text":"Hello\\"World\\n\\tTab"}',
      };

      act(() => {
        result.current.setApps([specialApp]);
      });

      expect(result.current.apps[0]).toEqual(specialApp);

      const savedData = localStorageMock.getItem(STORAGE_KEYS.APPS);
      const parsed = JSON.parse(savedData!);
      expect(parsed[0]).toEqual(specialApp);
    });

    it('should handle very large apps array', () => {
      const { result } = renderHook(() => useAppsState([]));

      const largeApps: App[] = Array.from({ length: 1000 }, (_, i) => ({
        name: `App ${i}`,
        json: `{"index":${i}}`,
      }));

      act(() => {
        result.current.setApps(largeApps);
      });

      expect(result.current.apps).toHaveLength(1000);
    });

    it('should handle apps with empty names', () => {
      const { result } = renderHook(() => useAppsState([]));

      act(() => {
        result.current.setApps([{ name: '', json: '{}' }]);
      });

      expect(result.current.apps[0].name).toBe('');
    });

    it('should handle apps with empty JSON', () => {
      const { result } = renderHook(() => useAppsState([]));

      act(() => {
        result.current.setApps([{ name: 'Empty JSON', json: '' }]);
      });

      expect(result.current.apps[0].json).toBe('');
    });

    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useAppsState([]));

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.setApps([{ name: `App ${i}`, json: '{}' }]);
        }
      });

      expect(result.current.apps[0].name).toBe('App 99');
      expect(result.current.canUndo).toBe(true);
    });

    it('should maintain state across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useAppsState([]));

      act(() => {
        result.current.setApps([{ name: 'Persistent', json: '{}' }]);
      });

      rerender();

      expect(result.current.apps[0].name).toBe('Persistent');
    });
  });

  describe('Integration', () => {
    it('should work with full workflow: add, modify, undo, redo, save', () => {
      const { result } = renderHook(() => useAppsState([]));

      // Add app
      act(() => {
        result.current.setApps([{ name: 'App 1', json: '{"v":1}' }]);
      });

      expect(result.current.apps).toHaveLength(1);

      // Modify app
      act(() => {
        result.current.setApps(prev => [
          { ...prev[0], json: '{"v":2}' },
        ]);
      });

      expect(JSON.parse(result.current.apps[0].json).v).toBe(2);

      // Undo modification
      act(() => {
        result.current.undo();
      });

      expect(JSON.parse(result.current.apps[0].json).v).toBe(1);

      // Redo modification
      act(() => {
        result.current.redo();
      });

      expect(JSON.parse(result.current.apps[0].json).v).toBe(2);

      // Verify localStorage persistence
      const saved = JSON.parse(localStorageMock.getItem(STORAGE_KEYS.APPS)!);
      expect(saved[0].json).toBe('{"v":2}');
    });

    it('should restore state from localStorage on remount', () => {
      const apps: App[] = [{ name: 'Persistent App', json: '{"data":"test"}' }];

      // First mount
      const { unmount } = renderHook(() => useAppsState([]));

      act(() => {
        localStorageMock.setItem(STORAGE_KEYS.APPS, JSON.stringify(apps));
      });

      unmount();

      // Second mount - should load from localStorage
      const { result } = renderHook(() => useAppsState([]));

      expect(result.current.apps).toEqual(apps);
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useAppsState([]));

      expect(result.current).toHaveProperty('apps');
      expect(result.current).toHaveProperty('setApps');
      expect(result.current).toHaveProperty('undo');
      expect(result.current).toHaveProperty('redo');
      expect(result.current).toHaveProperty('canUndo');
      expect(result.current).toHaveProperty('canRedo');
    });

    it('should have correct types for returned values', () => {
      const { result } = renderHook(() => useAppsState([]));

      expect(Array.isArray(result.current.apps)).toBe(true);
      expect(typeof result.current.setApps).toBe('function');
      expect(typeof result.current.undo).toBe('function');
      expect(typeof result.current.redo).toBe('function');
      expect(typeof result.current.canUndo).toBe('boolean');
      expect(typeof result.current.canRedo).toBe('boolean');
    });
  });
});
