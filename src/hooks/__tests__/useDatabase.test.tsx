/**
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { useDatabase, DatabaseContext } from '../useDatabase';

describe('useDatabase', () => {
  describe('Default Context', () => {
    it('should return default context value when used outside provider', () => {
      const { result } = renderHook(() => useDatabase());

      expect(result.current.data).toBeNull();
    });
  });

  describe('With Provider', () => {
    it('should return database data from context', () => {
      const mockData = {
        users: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
        ],
        posts: [{ id: 1, title: 'Post 1' }],
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={{ data: mockData }}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(result.current.data).toEqual(mockData);
    });

    it('should return null data when provider has null', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={{ data: null }}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(result.current.data).toBeNull();
    });

    it('should handle empty database', () => {
      const mockData = {};

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={{ data: mockData }}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(result.current.data).toEqual({});
    });

    it('should handle database with single table', () => {
      const mockData = {
        products: [
          { id: 1, name: 'Product 1', price: 100 },
          { id: 2, name: 'Product 2', price: 200 },
        ],
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={{ data: mockData }}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(result.current.data?.products).toHaveLength(2);
    });

    it('should handle database with multiple tables', () => {
      const mockData = {
        users: [{ id: 1 }],
        posts: [{ id: 1 }, { id: 2 }],
        comments: [{ id: 1 }, { id: 2 }, { id: 3 }],
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={{ data: mockData }}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(Object.keys(result.current.data || {})).toHaveLength(3);
      expect(result.current.data?.users).toHaveLength(1);
      expect(result.current.data?.posts).toHaveLength(2);
      expect(result.current.data?.comments).toHaveLength(3);
    });

    it('should handle empty arrays in tables', () => {
      const mockData = {
        users: [],
        posts: [],
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={{ data: mockData }}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(result.current.data?.users).toEqual([]);
      expect(result.current.data?.posts).toEqual([]);
    });

    it('should handle complex nested data', () => {
      const mockData = {
        users: [
          {
            id: 1,
            name: 'User',
            profile: {
              bio: 'Test bio',
              avatar: 'url',
            },
            posts: [{ id: 1 }, { id: 2 }],
          },
        ],
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={{ data: mockData }}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(result.current.data?.users[0].profile).toBeDefined();
      expect(result.current.data?.users[0].posts).toHaveLength(2);
    });

    it('should return exact context value', () => {
      const contextValue = {
        data: {
          custom: [{ field: 'value' }],
        },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={contextValue}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(result.current).toBe(contextValue);
    });
  });

  describe('Context Updates', () => {
    it('should reflect context updates', () => {
      let contextValue = { data: { users: [{ id: 1 }] } as Record<string, any[]> | null };

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={contextValue}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result, rerender } = renderHook(() => useDatabase(), {
        wrapper: Wrapper,
      });

      expect(result.current.data?.users).toHaveLength(1);

      // Update context value
      contextValue = { data: { users: [{ id: 1 }, { id: 2 }] } };
      rerender();

      expect(result.current.data?.users).toHaveLength(2);
    });

    it('should handle transition from null to data', () => {
      let contextValue = { data: null as Record<string, any[]> | null };

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={contextValue}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result, rerender } = renderHook(() => useDatabase(), {
        wrapper: Wrapper,
      });

      expect(result.current.data).toBeNull();

      contextValue = { data: { users: [{ id: 1 }] } };
      rerender();

      expect(result.current.data?.users).toBeDefined();
    });

    it('should handle transition from data to null', () => {
      let contextValue = { data: { users: [{ id: 1 }] } as Record<string, any[]> | null };

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={contextValue}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result, rerender } = renderHook(() => useDatabase(), {
        wrapper: Wrapper,
      });

      expect(result.current.data).not.toBeNull();

      contextValue = { data: null };
      rerender();

      expect(result.current.data).toBeNull();
    });
  });

  describe('DatabaseContext Default Value', () => {
    it('should have null data as default', () => {
      expect(DatabaseContext._currentValue).toEqual({ data: null });
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should return same context value for multiple instances', () => {
      const mockData = { shared: [{ id: 'test' }] };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={{ data: mockData }}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result: result1 } = renderHook(() => useDatabase(), { wrapper });
      const { result: result2 } = renderHook(() => useDatabase(), { wrapper });

      expect(result1.current.data).toBe(result2.current.data);
    });
  });

  describe('Edge Cases', () => {
    it('should handle tables with mixed data types', () => {
      const mockData = {
        mixed: [
          { id: 1, value: 'string' },
          { id: 2, value: 123 },
          { id: 3, value: true },
          { id: 4, value: null },
        ],
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={{ data: mockData }}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(result.current.data?.mixed).toHaveLength(4);
    });

    it('should handle very large datasets', () => {
      const mockData = {
        items: Array.from({ length: 10000 }, (_, i) => ({ id: i })),
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={{ data: mockData }}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(result.current.data?.items).toHaveLength(10000);
    });

    it('should handle special characters in table names', () => {
      const mockData = {
        'table-with-dashes': [{ id: 1 }],
        'table_with_underscores': [{ id: 2 }],
        'table.with.dots': [{ id: 3 }],
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={{ data: mockData }}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(result.current.data?.['table-with-dashes']).toBeDefined();
      expect(result.current.data?.['table_with_underscores']).toBeDefined();
      expect(result.current.data?.['table.with.dots']).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should handle data as Record<string, any[]>', () => {
      const mockData: Record<string, any[]> = {
        users: [{ id: 1 }],
        posts: [{ id: 1 }],
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DatabaseContext.Provider value={{ data: mockData }}>
          {children}
        </DatabaseContext.Provider>
      );

      const { result } = renderHook(() => useDatabase(), { wrapper });

      expect(Array.isArray(result.current.data?.users)).toBe(true);
      expect(Array.isArray(result.current.data?.posts)).toBe(true);
    });
  });
});
