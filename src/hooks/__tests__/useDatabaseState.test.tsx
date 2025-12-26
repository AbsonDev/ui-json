/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useDatabaseState } from '../useDatabaseState';
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

describe('useDatabaseState', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty object when no localStorage data', () => {
      const { result } = renderHook(() => useDatabaseState());

      expect(result.current.databaseData).toEqual({});
    });

    it('should initialize from localStorage when data exists', () => {
      const savedData = {
        0: {
          users: [{ id: '1', name: 'John' }],
          posts: [{ id: '1', title: 'Post 1' }],
        },
      };

      localStorageMock.setItem(
        STORAGE_KEYS.DATABASE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useDatabaseState());

      expect(result.current.databaseData).toEqual(savedData);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.setItem(STORAGE_KEYS.DATABASE, 'invalid json {');

      const { result } = renderHook(() => useDatabaseState());

      expect(result.current.databaseData).toEqual({});
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle null localStorage data', () => {
      localStorageMock.setItem(STORAGE_KEYS.DATABASE, 'null');

      const { result } = renderHook(() => useDatabaseState());

      expect(result.current.databaseData).toEqual(null);
    });

    it('should handle undefined localStorage gracefully', () => {
      const { result } = renderHook(() => useDatabaseState());

      expect(result.current.databaseData).toEqual({});
    });

    it('should initialize with multiple apps and tables', () => {
      const savedData = {
        0: {
          users: [{ id: '1', name: 'User 1' }],
          posts: [{ id: '1', title: 'Post 1' }],
        },
        1: {
          products: [{ id: '1', name: 'Product 1' }],
        },
        2: {
          orders: [{ id: '1', total: 100 }],
        },
      };

      localStorageMock.setItem(
        STORAGE_KEYS.DATABASE,
        JSON.stringify(savedData)
      );

      const { result } = renderHook(() => useDatabaseState());

      expect(result.current.databaseData).toEqual(savedData);
    });
  });

  describe('getAppData', () => {
    it('should return empty object for non-existent app', () => {
      const { result } = renderHook(() => useDatabaseState());

      const appData = result.current.getAppData(0);

      expect(appData).toEqual({});
    });

    it('should return app data when it exists', () => {
      const { result } = renderHook(() => useDatabaseState());

      const testData = {
        users: [{ id: '1', name: 'John' }],
        posts: [{ id: '1', title: 'Post' }],
      };

      act(() => {
        result.current.setAppData(0, testData);
      });

      const appData = result.current.getAppData(0);

      expect(appData).toEqual(testData);
    });

    it('should return data for specific app index', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.setAppData(0, { users: [{ id: '1' }] });
        result.current.setAppData(1, { posts: [{ id: '2' }] });
      });

      expect(result.current.getAppData(0)).toEqual({ users: [{ id: '1' }] });
      expect(result.current.getAppData(1)).toEqual({ posts: [{ id: '2' }] });
    });

    it('should handle negative app index', () => {
      const { result } = renderHook(() => useDatabaseState());

      const appData = result.current.getAppData(-1);

      expect(appData).toEqual({});
    });
  });

  describe('setAppData', () => {
    it('should set data for an app', () => {
      const { result } = renderHook(() => useDatabaseState());

      const testData = {
        users: [{ id: '1', name: 'John' }],
      };

      act(() => {
        result.current.setAppData(0, testData);
      });

      expect(result.current.databaseData[0]).toEqual(testData);
    });

    it('should overwrite existing app data', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.setAppData(0, { users: [{ id: '1' }] });
      });

      act(() => {
        result.current.setAppData(0, { posts: [{ id: '2' }] });
      });

      expect(result.current.databaseData[0]).toEqual({
        posts: [{ id: '2' }],
      });
      expect(result.current.databaseData[0]).not.toHaveProperty('users');
    });

    it('should handle multiple apps independently', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.setAppData(0, { users: [] });
        result.current.setAppData(1, { posts: [] });
        result.current.setAppData(2, { orders: [] });
      });

      expect(Object.keys(result.current.databaseData)).toHaveLength(3);
      expect(result.current.databaseData[0]).toHaveProperty('users');
      expect(result.current.databaseData[1]).toHaveProperty('posts');
      expect(result.current.databaseData[2]).toHaveProperty('orders');
    });

    it('should handle empty data object', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.setAppData(0, {});
      });

      expect(result.current.databaseData[0]).toEqual({});
    });
  });

  describe('updateTable', () => {
    it('should create and update a table', () => {
      const { result } = renderHook(() => useDatabaseState());

      const users = [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' },
      ];

      act(() => {
        result.current.updateTable(0, 'users', users);
      });

      expect(result.current.databaseData[0].users).toEqual(users);
    });

    it('should update existing table', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, 'users', [{ id: '1', name: 'John' }]);
      });

      act(() => {
        result.current.updateTable(0, 'users', [
          { id: '1', name: 'John Updated' },
          { id: '2', name: 'Jane' },
        ]);
      });

      expect(result.current.databaseData[0].users).toHaveLength(2);
      expect(result.current.databaseData[0].users[0].name).toBe(
        'John Updated'
      );
    });

    it('should preserve other tables when updating one table', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, 'users', [{ id: '1' }]);
        result.current.updateTable(0, 'posts', [{ id: '2' }]);
      });

      act(() => {
        result.current.updateTable(0, 'users', [{ id: '3' }]);
      });

      expect(result.current.databaseData[0].users).toEqual([{ id: '3' }]);
      expect(result.current.databaseData[0].posts).toEqual([{ id: '2' }]);
    });

    it('should handle multiple tables in same app', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, 'users', [{ id: '1' }]);
        result.current.updateTable(0, 'posts', [{ id: '2' }]);
        result.current.updateTable(0, 'comments', [{ id: '3' }]);
      });

      expect(Object.keys(result.current.databaseData[0])).toHaveLength(3);
    });

    it('should handle empty records array', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, 'users', []);
      });

      expect(result.current.databaseData[0].users).toEqual([]);
    });
  });

  describe('addRecord', () => {
    it('should add record to existing table', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, 'users', [{ id: '1', name: 'John' }]);
      });

      act(() => {
        result.current.addRecord(0, 'users', { id: '2', name: 'Jane' });
      });

      expect(result.current.databaseData[0].users).toHaveLength(2);
      expect(result.current.databaseData[0].users[1]).toEqual({
        id: '2',
        name: 'Jane',
      });
    });

    it('should create table if it does not exist', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.addRecord(0, 'users', { id: '1', name: 'John' });
      });

      expect(result.current.databaseData[0].users).toEqual([
        { id: '1', name: 'John' },
      ]);
    });

    it('should add multiple records sequentially', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.addRecord(0, 'users', { id: '1', name: 'User 1' });
        result.current.addRecord(0, 'users', { id: '2', name: 'User 2' });
        result.current.addRecord(0, 'users', { id: '3', name: 'User 3' });
      });

      expect(result.current.databaseData[0].users).toHaveLength(3);
    });

    it('should preserve existing records when adding new one', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, 'users', [
          { id: '1', name: 'John' },
          { id: '2', name: 'Jane' },
        ]);
      });

      act(() => {
        result.current.addRecord(0, 'users', { id: '3', name: 'Bob' });
      });

      expect(result.current.databaseData[0].users).toHaveLength(3);
      expect(result.current.databaseData[0].users[0].name).toBe('John');
      expect(result.current.databaseData[0].users[1].name).toBe('Jane');
    });

    it('should handle adding records with complex data', () => {
      const { result } = renderHook(() => useDatabaseState());

      const complexRecord = {
        id: '1',
        user: {
          name: 'John',
          email: 'john@example.com',
          address: {
            city: 'NYC',
            zip: '10001',
          },
        },
        tags: ['admin', 'verified'],
      };

      act(() => {
        result.current.addRecord(0, 'users', complexRecord);
      });

      expect(result.current.databaseData[0].users[0]).toEqual(complexRecord);
    });

    it('should create app data if app does not exist', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.addRecord(5, 'users', { id: '1' });
      });

      expect(result.current.databaseData[5]).toBeDefined();
      expect(result.current.databaseData[5].users).toEqual([{ id: '1' }]);
    });
  });

  describe('deleteRecord', () => {
    it('should delete record by id', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, 'users', [
          { id: '1', name: 'John' },
          { id: '2', name: 'Jane' },
          { id: '3', name: 'Bob' },
        ]);
      });

      act(() => {
        result.current.deleteRecord(0, 'users', '2');
      });

      expect(result.current.databaseData[0].users).toHaveLength(2);
      expect(result.current.databaseData[0].users.find((u: any) => u.id === '2')).toBeUndefined();
    });

    it('should preserve other records when deleting one', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, 'users', [
          { id: '1', name: 'John' },
          { id: '2', name: 'Jane' },
        ]);
      });

      act(() => {
        result.current.deleteRecord(0, 'users', '1');
      });

      expect(result.current.databaseData[0].users).toHaveLength(1);
      expect(result.current.databaseData[0].users[0]).toEqual({
        id: '2',
        name: 'Jane',
      });
    });

    it('should handle deleting non-existent record', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, 'users', [{ id: '1', name: 'John' }]);
      });

      act(() => {
        result.current.deleteRecord(0, 'users', '999');
      });

      expect(result.current.databaseData[0].users).toHaveLength(1);
    });

    it('should handle deleting from empty table', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, 'users', []);
      });

      act(() => {
        result.current.deleteRecord(0, 'users', '1');
      });

      expect(result.current.databaseData[0].users).toEqual([]);
    });

    it('should handle deleting from non-existent table', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.deleteRecord(0, 'users', '1');
      });

      expect(result.current.databaseData[0].users).toEqual([]);
    });

    it('should delete multiple records', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, 'users', [
          { id: '1', name: 'User 1' },
          { id: '2', name: 'User 2' },
          { id: '3', name: 'User 3' },
          { id: '4', name: 'User 4' },
        ]);
      });

      act(() => {
        result.current.deleteRecord(0, 'users', '2');
        result.current.deleteRecord(0, 'users', '4');
      });

      expect(result.current.databaseData[0].users).toHaveLength(2);
      expect(result.current.databaseData[0].users[0].id).toBe('1');
      expect(result.current.databaseData[0].users[1].id).toBe('3');
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should save to localStorage when data changes', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.setAppData(0, { users: [{ id: '1' }] });
      });

      const savedData = localStorageMock.getItem(STORAGE_KEYS.DATABASE);
      expect(savedData).toBeTruthy();
      expect(JSON.parse(savedData!)).toEqual({
        0: { users: [{ id: '1' }] },
      });
    });

    it('should update localStorage on every state change', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.addRecord(0, 'users', { id: '1' });
      });

      let savedData = JSON.parse(
        localStorageMock.getItem(STORAGE_KEYS.DATABASE)!
      );
      expect(savedData[0].users).toHaveLength(1);

      act(() => {
        result.current.addRecord(0, 'users', { id: '2' });
      });

      savedData = JSON.parse(localStorageMock.getItem(STORAGE_KEYS.DATABASE)!);
      expect(savedData[0].users).toHaveLength(2);
    });

    it('should persist complex nested data', () => {
      const { result } = renderHook(() => useDatabaseState());

      const complexData = {
        users: [
          {
            id: '1',
            profile: { name: 'John', settings: { theme: 'dark' } },
            posts: [{ id: 'p1', title: 'Post 1' }],
          },
        ],
      };

      act(() => {
        result.current.setAppData(0, complexData);
      });

      const savedData = JSON.parse(
        localStorageMock.getItem(STORAGE_KEYS.DATABASE)!
      );
      expect(savedData[0]).toEqual(complexData);
    });

    it('should use correct storage key', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.setAppData(0, { users: [] });
      });

      expect(localStorageMock.getItem(STORAGE_KEYS.DATABASE)).toBeTruthy();
      expect(localStorageMock.getItem('wrong-key')).toBeNull();
    });
  });

  describe('Direct State Management', () => {
    it('should allow direct setDatabaseData', () => {
      const { result } = renderHook(() => useDatabaseState());

      const newData = {
        0: { users: [{ id: '1' }] },
        1: { posts: [{ id: '2' }] },
      };

      act(() => {
        result.current.setDatabaseData(newData);
      });

      expect(result.current.databaseData).toEqual(newData);
    });

    it('should handle function updater in setDatabaseData', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.setDatabaseData({ 0: { users: [] } });
      });

      act(() => {
        result.current.setDatabaseData(prev => ({
          ...prev,
          1: { posts: [] },
        }));
      });

      expect(result.current.databaseData[0]).toHaveProperty('users');
      expect(result.current.databaseData[1]).toHaveProperty('posts');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large datasets', () => {
      const { result } = renderHook(() => useDatabaseState());

      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
      }));

      act(() => {
        result.current.updateTable(0, 'users', largeDataset);
      });

      expect(result.current.databaseData[0].users).toHaveLength(1000);
    });

    it('should handle special characters in table names', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, 'user-table_v2', [{ id: '1' }]);
      });

      expect(result.current.databaseData[0]['user-table_v2']).toBeDefined();
    });

    it('should handle numeric string as table name', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, '123', [{ id: '1' }]);
      });

      expect(result.current.databaseData[0]['123']).toBeDefined();
    });

    it('should handle empty string as table name', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.updateTable(0, '', [{ id: '1' }]);
      });

      expect(result.current.databaseData[0]['']).toBeDefined();
    });

    it('should maintain state across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useDatabaseState());

      act(() => {
        result.current.setAppData(0, { users: [{ id: '1' }] });
      });

      rerender();

      expect(result.current.databaseData[0].users).toEqual([{ id: '1' }]);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full CRUD workflow', () => {
      const { result } = renderHook(() => useDatabaseState());

      // Create
      act(() => {
        result.current.addRecord(0, 'users', { id: '1', name: 'John' });
        result.current.addRecord(0, 'users', { id: '2', name: 'Jane' });
      });

      expect(result.current.databaseData[0].users).toHaveLength(2);

      // Read
      const appData = result.current.getAppData(0);
      expect(appData.users).toHaveLength(2);

      // Update
      act(() => {
        result.current.updateTable(0, 'users', [
          { id: '1', name: 'John Updated' },
          { id: '2', name: 'Jane Updated' },
        ]);
      });

      expect(result.current.databaseData[0].users[0].name).toBe(
        'John Updated'
      );

      // Delete
      act(() => {
        result.current.deleteRecord(0, 'users', '1');
      });

      expect(result.current.databaseData[0].users).toHaveLength(1);
      expect(result.current.databaseData[0].users[0].id).toBe('2');
    });

    it('should handle multiple apps with multiple tables', () => {
      const { result } = renderHook(() => useDatabaseState());

      act(() => {
        // App 0
        result.current.addRecord(0, 'users', { id: '1', name: 'User 1' });
        result.current.addRecord(0, 'posts', { id: '1', title: 'Post 1' });

        // App 1
        result.current.addRecord(1, 'products', {
          id: '1',
          name: 'Product 1',
        });
        result.current.addRecord(1, 'orders', { id: '1', total: 100 });
      });

      expect(Object.keys(result.current.databaseData)).toHaveLength(2);
      expect(Object.keys(result.current.databaseData[0])).toHaveLength(2);
      expect(Object.keys(result.current.databaseData[1])).toHaveLength(2);
    });

    it('should restore state from localStorage on remount', () => {
      const initialData = {
        0: {
          users: [{ id: '1', name: 'Persistent User' }],
        },
      };

      localStorageMock.setItem(
        STORAGE_KEYS.DATABASE,
        JSON.stringify(initialData)
      );

      const { unmount, result } = renderHook(() => useDatabaseState());

      expect(result.current.databaseData).toEqual(initialData);

      unmount();

      // Remount
      const { result: result2 } = renderHook(() => useDatabaseState());

      expect(result2.current.databaseData).toEqual(initialData);
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useDatabaseState());

      expect(result.current).toHaveProperty('databaseData');
      expect(result.current).toHaveProperty('setDatabaseData');
      expect(result.current).toHaveProperty('getAppData');
      expect(result.current).toHaveProperty('setAppData');
      expect(result.current).toHaveProperty('updateTable');
      expect(result.current).toHaveProperty('addRecord');
      expect(result.current).toHaveProperty('deleteRecord');
    });

    it('should have correct types for returned values', () => {
      const { result } = renderHook(() => useDatabaseState());

      expect(typeof result.current.databaseData).toBe('object');
      expect(typeof result.current.setDatabaseData).toBe('function');
      expect(typeof result.current.getAppData).toBe('function');
      expect(typeof result.current.setAppData).toBe('function');
      expect(typeof result.current.updateTable).toBe('function');
      expect(typeof result.current.addRecord).toBe('function');
      expect(typeof result.current.deleteRecord).toBe('function');
    });
  });
});
