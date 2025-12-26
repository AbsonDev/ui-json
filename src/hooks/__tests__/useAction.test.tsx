/**
 * @jest-environment jsdom
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { useAction, ActionContext } from '../useAction';

describe('useAction', () => {
  describe('Error Handling', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAction());
      }).toThrow('useAction must be used within an ActionProvider');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('With Provider', () => {
    it('should return context value from provider', () => {
      const mockHandleAction = jest.fn();
      const mockFormState = { field1: 'value1' };
      const mockSetFormState = jest.fn();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: mockHandleAction,
            formState: mockFormState,
            setFormState: mockSetFormState,
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      expect(result.current.handleAction).toBe(mockHandleAction);
      expect(result.current.formState).toBe(mockFormState);
      expect(result.current.setFormState).toBe(mockSetFormState);
    });

    it('should provide handleAction function', () => {
      const mockHandleAction = jest.fn();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: mockHandleAction,
            formState: {},
            setFormState: jest.fn(),
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      expect(typeof result.current.handleAction).toBe('function');
    });

    it('should provide formState', () => {
      const mockFormState = {
        username: 'testuser',
        email: 'test@example.com',
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: jest.fn(),
            formState: mockFormState,
            setFormState: jest.fn(),
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      expect(result.current.formState).toEqual(mockFormState);
    });

    it('should provide setFormState function', () => {
      const mockSetFormState = jest.fn();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: jest.fn(),
            formState: {},
            setFormState: mockSetFormState,
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      expect(result.current.setFormState).toBe(mockSetFormState);
    });
  });

  describe('handleAction', () => {
    it('should be callable with action object', () => {
      const mockHandleAction = jest.fn();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: mockHandleAction,
            formState: {},
            setFormState: jest.fn(),
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      const testAction = { type: 'NAVIGATE', payload: { screen: 'home' } };
      result.current.handleAction(testAction);

      expect(mockHandleAction).toHaveBeenCalledWith(testAction);
      expect(mockHandleAction).toHaveBeenCalledTimes(1);
    });

    it('should handle different action types', () => {
      const mockHandleAction = jest.fn();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: mockHandleAction,
            formState: {},
            setFormState: jest.fn(),
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      const actions = [
        { type: 'NAVIGATE', payload: { screen: 'home' } },
        { type: 'SUBMIT', payload: { form: 'login' } },
        { type: 'OPEN_POPUP', payload: { message: 'Hello' } },
      ];

      actions.forEach((action) => {
        result.current.handleAction(action);
      });

      expect(mockHandleAction).toHaveBeenCalledTimes(3);
      expect(mockHandleAction).toHaveBeenNthCalledWith(1, actions[0]);
      expect(mockHandleAction).toHaveBeenNthCalledWith(2, actions[1]);
      expect(mockHandleAction).toHaveBeenNthCalledWith(3, actions[2]);
    });
  });

  describe('formState', () => {
    it('should handle empty form state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: jest.fn(),
            formState: {},
            setFormState: jest.fn(),
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      expect(result.current.formState).toEqual({});
    });

    it('should handle complex form state', () => {
      const complexFormState = {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        metadata: {
          lastUpdated: '2025-01-01',
        },
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: jest.fn(),
            formState: complexFormState,
            setFormState: jest.fn(),
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      expect(result.current.formState).toEqual(complexFormState);
    });

    it('should handle form state with arrays', () => {
      const formStateWithArrays = {
        items: ['item1', 'item2', 'item3'],
        tags: [1, 2, 3],
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: jest.fn(),
            formState: formStateWithArrays,
            setFormState: jest.fn(),
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      expect(result.current.formState.items).toHaveLength(3);
      expect(result.current.formState.tags).toEqual([1, 2, 3]);
    });
  });

  describe('setFormState', () => {
    it('should be React.Dispatch type function', () => {
      const mockSetFormState = jest.fn();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: jest.fn(),
            formState: {},
            setFormState: mockSetFormState,
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      expect(typeof result.current.setFormState).toBe('function');
    });

    it('should be callable', () => {
      const mockSetFormState = jest.fn();

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: jest.fn(),
            formState: {},
            setFormState: mockSetFormState,
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      const newState = { field: 'value' };
      result.current.setFormState(newState);

      expect(mockSetFormState).toHaveBeenCalledWith(newState);
    });
  });

  describe('ActionContext Default Value', () => {
    it('should have null as default value', () => {
      expect(ActionContext._currentValue).toBeNull();
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should return same context value for multiple instances', () => {
      const mockHandleAction = jest.fn();
      const mockFormState = { shared: 'value' };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: mockHandleAction,
            formState: mockFormState,
            setFormState: jest.fn(),
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result: result1 } = renderHook(() => useAction(), { wrapper });
      const { result: result2 } = renderHook(() => useAction(), { wrapper });

      expect(result1.current.formState).toBe(result2.current.formState);
      expect(result1.current.handleAction).toBe(result2.current.handleAction);
    });
  });

  describe('Context Updates', () => {
    it('should reflect context updates', () => {
      let contextValue = {
        handleAction: jest.fn(),
        formState: { initial: 'value' } as Record<string, any>,
        setFormState: jest.fn() as React.Dispatch<
          React.SetStateAction<Record<string, any>>
        >,
      };

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider value={contextValue}>
          {children}
        </ActionContext.Provider>
      );

      const { result, rerender } = renderHook(() => useAction(), {
        wrapper: Wrapper,
      });

      expect(result.current.formState).toEqual({ initial: 'value' });

      // Update context value
      contextValue = {
        handleAction: jest.fn(),
        formState: { updated: 'value' },
        setFormState: jest.fn() as React.Dispatch<
          React.SetStateAction<Record<string, any>>
        >,
      };
      rerender();

      expect(result.current.formState).toEqual({ updated: 'value' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null formState values', () => {
      const formState = {
        field1: null,
        field2: 'value',
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: jest.fn(),
            formState,
            setFormState: jest.fn(),
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      expect(result.current.formState.field1).toBeNull();
      expect(result.current.formState.field2).toBe('value');
    });

    it('should handle undefined formState values', () => {
      const formState = {
        field1: undefined,
        field2: 'value',
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: jest.fn(),
            formState,
            setFormState: jest.fn(),
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      expect(result.current.formState.field1).toBeUndefined();
    });

    it('should handle different data types in formState', () => {
      const formState = {
        string: 'text',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        nullValue: null,
        undefinedValue: undefined,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ActionContext.Provider
          value={{
            handleAction: jest.fn(),
            formState,
            setFormState: jest.fn(),
          }}
        >
          {children}
        </ActionContext.Provider>
      );

      const { result } = renderHook(() => useAction(), { wrapper });

      expect(result.current.formState).toEqual(formState);
    });
  });
});
