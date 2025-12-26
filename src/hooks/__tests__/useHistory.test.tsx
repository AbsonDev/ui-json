/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../useHistory';

describe('useHistory', () => {
  describe('Initialization', () => {
    it('should initialize with value', () => {
      const { result } = renderHook(() => useHistory(5));

      expect(result.current.state).toBe(5);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should initialize with function', () => {
      const initializer = () => ({ count: 10 });
      const { result } = renderHook(() => useHistory(initializer));

      expect(result.current.state).toEqual({ count: 10 });
    });

    it('should initialize with null', () => {
      const { result } = renderHook(() => useHistory(null));

      expect(result.current.state).toBeNull();
    });

    it('should initialize with undefined', () => {
      const { result } = renderHook(() => useHistory(undefined));

      expect(result.current.state).toBeUndefined();
    });

    it('should initialize with empty array', () => {
      const { result } = renderHook(() => useHistory([]));

      expect(result.current.state).toEqual([]);
    });

    it('should initialize with empty object', () => {
      const { result } = renderHook(() => useHistory({}));

      expect(result.current.state).toEqual({});
    });

    it('should initialize with complex nested object', () => {
      const initialState = {
        users: [{ id: 1, name: 'John' }],
        settings: { theme: 'dark' },
      };

      const { result } = renderHook(() => useHistory(initialState));

      expect(result.current.state).toEqual(initialState);
    });
  });

  describe('setState', () => {
    it('should update state with new value', () => {
      const { result } = renderHook(() => useHistory(0));

      act(() => {
        result.current.setState(5);
      });

      expect(result.current.state).toBe(5);
    });

    it('should update state with function', () => {
      const { result } = renderHook(() => useHistory(10));

      act(() => {
        result.current.setState(prev => prev + 5);
      });

      expect(result.current.state).toBe(15);
    });

    it('should add previous state to past', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('should clear future when setting new state', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
        result.current.setState(3);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.setState(4);
      });

      expect(result.current.canRedo).toBe(false);
    });

    it('should not update if value is the same (deep equality)', () => {
      const { result } = renderHook(() => useHistory({ count: 0 }));

      act(() => {
        result.current.setState({ count: 0 });
      });

      expect(result.current.canUndo).toBe(false);
    });

    it('should handle multiple sequential updates', () => {
      const { result } = renderHook(() => useHistory(0));

      act(() => {
        result.current.setState(1);
        result.current.setState(2);
        result.current.setState(3);
      });

      expect(result.current.state).toBe(3);
      expect(result.current.canUndo).toBe(true);
    });

    it('should work with different data types', () => {
      const { result } = renderHook(() => useHistory<any>('string'));

      act(() => {
        result.current.setState(123);
      });

      expect(result.current.state).toBe(123);

      act(() => {
        result.current.setState({ obj: true });
      });

      expect(result.current.state).toEqual({ obj: true });

      act(() => {
        result.current.setState([1, 2, 3]);
      });

      expect(result.current.state).toEqual([1, 2, 3]);
    });
  });

  describe('undo', () => {
    it('should undo to previous state', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe(1);
    });

    it('should do nothing when canUndo is false', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe(1);
    });

    it('should update canUndo after undo', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
      });

      expect(result.current.canUndo).toBe(true);

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
    });

    it('should add current state to future', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);
    });

    it('should handle multiple undo operations', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
        result.current.setState(3);
        result.current.setState(4);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe(3);

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe(2);

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe(1);
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('redo', () => {
    it('should redo to next state', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.state).toBe(2);
    });

    it('should do nothing when canRedo is false', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.redo();
      });

      expect(result.current.state).toBe(1);
    });

    it('should update state after redo', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
        result.current.undo();
        result.current.redo();
      });

      expect(result.current.state).toBe(2);
    });

    it('should add current state to past', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('should handle multiple redo operations', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
        result.current.setState(3);
        result.current.setState(4);
      });

      act(() => {
        result.current.undo();
        result.current.undo();
        result.current.undo();
        result.current.redo();
      });

      expect(result.current.state).toBe(2);
      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle undo-redo-setState workflow', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
        result.current.setState(3);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toBe(2);
      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.redo();
      });

      expect(result.current.state).toBe(3);

      act(() => {
        result.current.setState(4);
      });

      expect(result.current.state).toBe(4);
      expect(result.current.canRedo).toBe(false);
    });

    it('should handle very long history', () => {
      const { result } = renderHook(() => useHistory(0));

      act(() => {
        for (let i = 1; i <= 100; i++) {
          result.current.setState(i);
        }
      });

      expect(result.current.state).toBe(100);

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.undo();
        }
      });

      expect(result.current.state).toBe(50);
    });

    it('should handle alternating undo/redo', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
      });

      act(() => {
        result.current.undo();
        result.current.redo();
        result.current.undo();
        result.current.redo();
      });

      expect(result.current.state).toBe(2);
    });

    it('should work with object state', () => {
      const { result } = renderHook(() =>
        useHistory({ count: 0, name: 'test' })
      );

      act(() => {
        result.current.setState({ count: 1, name: 'test' });
      });

      act(() => {
        result.current.setState({ count: 2, name: 'updated' });
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toEqual({ count: 1, name: 'test' });
    });

    it('should work with array state', () => {
      const { result } = renderHook(() => useHistory<number[]>([]));

      act(() => {
        result.current.setState([1]);
      });

      act(() => {
        result.current.setState(prev => [...prev, 2]);
      });

      act(() => {
        result.current.setState(prev => [...prev, 3]);
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state).toEqual([1, 2]);
    });
  });

  describe('canUndo and canRedo flags', () => {
    it('should correctly report canUndo', () => {
      const { result } = renderHook(() => useHistory(1));

      expect(result.current.canUndo).toBe(false);

      act(() => {
        result.current.setState(2);
      });

      expect(result.current.canUndo).toBe(true);

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
    });

    it('should correctly report canRedo', () => {
      const { result } = renderHook(() => useHistory(1));

      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.setState(2);
        result.current.undo();
      });

      expect(result.current.state).toBe(1);
      // After undo, there should be something in future to redo
    });

    it('should clear canRedo when new state is set', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.setState(3);
      });

      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle setState with same value (no history added)', () => {
      const { result } = renderHook(() => useHistory({ value: 1 }));

      act(() => {
        result.current.setState({ value: 1 });
      });

      expect(result.current.canUndo).toBe(false);
    });

    it('should handle setState to null', () => {
      const { result } = renderHook(() => useHistory<any>('value'));

      act(() => {
        result.current.setState(null);
      });

      expect(result.current.state).toBeNull();
    });

    it('should handle setState to undefined', () => {
      const { result } = renderHook(() => useHistory<any>('value'));

      act(() => {
        result.current.setState(undefined);
      });

      expect(result.current.state).toBeUndefined();
    });

    it('should handle rapid successive setState calls', () => {
      const { result } = renderHook(() => useHistory(0));

      act(() => {
        result.current.setState(1);
        result.current.setState(2);
        result.current.setState(3);
        result.current.setState(4);
        result.current.setState(5);
      });

      expect(result.current.state).toBe(5);
      expect(result.current.canUndo).toBe(true);
    });

    it('should maintain state across re-renders', () => {
      const { result, rerender } = renderHook(() => useHistory(1));

      act(() => {
        result.current.setState(2);
      });

      rerender();

      expect(result.current.state).toBe(2);
      expect(result.current.canUndo).toBe(true);
    });

    it('should handle empty undo/redo calls', () => {
      const { result } = renderHook(() => useHistory(1));

      act(() => {
        result.current.undo();
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.state).toBe(1);

      act(() => {
        result.current.redo();
        result.current.redo();
        result.current.redo();
      });

      expect(result.current.state).toBe(1);
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useHistory(0));

      expect(result.current).toHaveProperty('state');
      expect(result.current).toHaveProperty('setState');
      expect(result.current).toHaveProperty('undo');
      expect(result.current).toHaveProperty('redo');
      expect(result.current).toHaveProperty('canUndo');
      expect(result.current).toHaveProperty('canRedo');
    });

    it('should have correct types', () => {
      const { result } = renderHook(() => useHistory(0));

      expect(typeof result.current.state).toBe('number');
      expect(typeof result.current.setState).toBe('function');
      expect(typeof result.current.undo).toBe('function');
      expect(typeof result.current.redo).toBe('function');
      expect(typeof result.current.canUndo).toBe('boolean');
      expect(typeof result.current.canRedo).toBe('boolean');
    });
  });
});
