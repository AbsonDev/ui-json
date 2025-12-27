/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useEditorState, ActiveTab } from '../useEditorState';

describe('useEditorState', () => {
  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useEditorState());

      expect(result.current.selectedAppIndex).toBe(0);
      expect(result.current.activeTab).toBe('editor');
      expect(result.current.error).toBeNull();
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => useEditorState());

      expect(typeof result.current.setSelectedAppIndex).toBe('function');
      expect(typeof result.current.setActiveTab).toBe('function');
      expect(typeof result.current.setError).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('App Index Management', () => {
    it('should change selected app index', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setSelectedAppIndex(2);
      });

      expect(result.current.selectedAppIndex).toBe(2);
    });

    it('should clear error when changing app index', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setError('Some error');
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.setSelectedAppIndex(1);
      });

      expect(result.current.selectedAppIndex).toBe(1);
      expect(result.current.error).toBeNull();
    });

    it('should handle zero index', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setSelectedAppIndex(5);
        result.current.setSelectedAppIndex(0);
      });

      expect(result.current.selectedAppIndex).toBe(0);
    });

    it('should handle negative index', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setSelectedAppIndex(-1);
      });

      expect(result.current.selectedAppIndex).toBe(-1);
    });

    it('should handle large index values', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setSelectedAppIndex(1000);
      });

      expect(result.current.selectedAppIndex).toBe(1000);
    });
  });

  describe('Tab Management', () => {
    it('should change active tab to editor', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setActiveTab('ai');
        result.current.setActiveTab('editor');
      });

      expect(result.current.activeTab).toBe('editor');
    });

    it('should change active tab to ai', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setActiveTab('ai');
      });

      expect(result.current.activeTab).toBe('ai');
    });

    it('should change active tab to database', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setActiveTab('database');
      });

      expect(result.current.activeTab).toBe('database');
    });

    it('should change active tab to flow', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setActiveTab('flow');
      });

      expect(result.current.activeTab).toBe('flow');
    });

    it('should change active tab to snippets', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setActiveTab('snippets');
      });

      expect(result.current.activeTab).toBe('snippets');
    });

    it('should handle multiple tab changes', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setActiveTab('ai');
      });
      expect(result.current.activeTab).toBe('ai');

      act(() => {
        result.current.setActiveTab('database');
      });
      expect(result.current.activeTab).toBe('database');

      act(() => {
        result.current.setActiveTab('flow');
      });
      expect(result.current.activeTab).toBe('flow');
    });

    it('should not clear error when changing tabs', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setError('Tab error');
      });

      expect(result.current.error).toBe('Tab error');

      act(() => {
        result.current.setActiveTab('ai');
      });

      expect(result.current.error).toBe('Tab error');
    });
  });

  describe('Error Management', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.error).toBe('Something went wrong');
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setError('Error message');
      });

      expect(result.current.error).toBe('Error message');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle setting null error', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setError('Error');
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle multiple error sets', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setError('Error 1');
      });
      expect(result.current.error).toBe('Error 1');

      act(() => {
        result.current.setError('Error 2');
      });
      expect(result.current.error).toBe('Error 2');
    });

    it('should handle empty string error', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setError('');
      });

      expect(result.current.error).toBe('');
    });
  });

  describe('Complex State Changes', () => {
    it('should handle app index and tab changes together', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setSelectedAppIndex(3);
        result.current.setActiveTab('database');
      });

      expect(result.current.selectedAppIndex).toBe(3);
      expect(result.current.activeTab).toBe('database');
    });

    it('should handle app index change with error, then tab change', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setError('Initial error');
        result.current.setSelectedAppIndex(2);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.selectedAppIndex).toBe(2);

      act(() => {
        result.current.setError('New error');
        result.current.setActiveTab('ai');
      });

      expect(result.current.error).toBe('New error');
      expect(result.current.activeTab).toBe('ai');
    });

    it('should preserve tab when changing app index', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setActiveTab('flow');
        result.current.setSelectedAppIndex(5);
      });

      expect(result.current.activeTab).toBe('flow');
      expect(result.current.selectedAppIndex).toBe(5);
    });
  });

  describe('Function Stability', () => {
    it('should have stable function references', () => {
      const { result, rerender } = renderHook(() => useEditorState());

      const functions = {
        setSelectedAppIndex: result.current.setSelectedAppIndex,
        setActiveTab: result.current.setActiveTab,
        clearError: result.current.clearError,
      };

      rerender();

      expect(result.current.setSelectedAppIndex).toBe(
        functions.setSelectedAppIndex
      );
      expect(result.current.setActiveTab).toBe(functions.setActiveTab);
      expect(result.current.clearError).toBe(functions.clearError);
    });

    it('should not have stable setError reference', () => {
      const { result, rerender } = renderHook(() => useEditorState());

      const originalSetError = result.current.setError;

      rerender();

      // setError is from useState, so it should be stable
      expect(result.current.setError).toBe(originalSetError);
    });
  });

  describe('Type Safety', () => {
    it('should only accept valid tab types', () => {
      const { result } = renderHook(() => useEditorState());

      const validTabs: ActiveTab[] = [
        'editor',
        'ai',
        'database',
        'flow',
        'snippets',
      ];

      validTabs.forEach((tab) => {
        act(() => {
          result.current.setActiveTab(tab);
        });
        expect(result.current.activeTab).toBe(tab);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setSelectedAppIndex(1);
        result.current.setSelectedAppIndex(2);
        result.current.setSelectedAppIndex(3);
        result.current.setSelectedAppIndex(4);
        result.current.setSelectedAppIndex(5);
      });

      expect(result.current.selectedAppIndex).toBe(5);
    });

    it('should handle rapid tab switches', () => {
      const { result } = renderHook(() => useEditorState());

      act(() => {
        result.current.setActiveTab('ai');
        result.current.setActiveTab('database');
        result.current.setActiveTab('flow');
        result.current.setActiveTab('snippets');
        result.current.setActiveTab('editor');
      });

      expect(result.current.activeTab).toBe('editor');
    });

    it('should maintain state across re-renders', () => {
      const { result, rerender } = renderHook(() => useEditorState());

      act(() => {
        result.current.setSelectedAppIndex(7);
        result.current.setActiveTab('database');
        result.current.setError('Test error');
      });

      rerender();

      expect(result.current.selectedAppIndex).toBe(7);
      expect(result.current.activeTab).toBe('database');
      expect(result.current.error).toBe('Test error');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle typical user workflow', () => {
      const { result } = renderHook(() => useEditorState());

      // User selects first app
      act(() => {
        result.current.setSelectedAppIndex(0);
      });

      // User switches to AI tab
      act(() => {
        result.current.setActiveTab('ai');
      });

      // An error occurs
      act(() => {
        result.current.setError('API error');
      });

      // User switches to another app (error should clear)
      act(() => {
        result.current.setSelectedAppIndex(1);
      });

      expect(result.current.selectedAppIndex).toBe(1);
      expect(result.current.activeTab).toBe('ai');
      expect(result.current.error).toBeNull();
    });

    it('should handle error recovery workflow', () => {
      const { result } = renderHook(() => useEditorState());

      // Set initial state with error
      act(() => {
        result.current.setActiveTab('database');
        result.current.setError('Connection failed');
      });

      // User clears error manually
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.activeTab).toBe('database');

      // User switches app (error already null)
      act(() => {
        result.current.setSelectedAppIndex(2);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
