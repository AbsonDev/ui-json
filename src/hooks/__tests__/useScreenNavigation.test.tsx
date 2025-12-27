/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useScreenNavigation } from '../useScreenNavigation';

describe('useScreenNavigation', () => {
  describe('Initialization', () => {
    it('should initialize with null currentScreenId', () => {
      const { result } = renderHook(() => useScreenNavigation());

      expect(result.current.currentScreenId).toBeNull();
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => useScreenNavigation());

      expect(typeof result.current.setCurrentScreenId).toBe('function');
      expect(typeof result.current.navigateToScreen).toBe('function');
      expect(typeof result.current.resetNavigation).toBe('function');
    });
  });

  describe('navigateToScreen', () => {
    it('should navigate to a screen', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('home');
      });

      expect(result.current.currentScreenId).toBe('home');
    });

    it('should navigate to different screens', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('profile');
      });

      expect(result.current.currentScreenId).toBe('profile');

      act(() => {
        result.current.navigateToScreen('settings');
      });

      expect(result.current.currentScreenId).toBe('settings');
    });

    it('should override previous screen', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('screen1');
      });

      expect(result.current.currentScreenId).toBe('screen1');

      act(() => {
        result.current.navigateToScreen('screen2');
      });

      expect(result.current.currentScreenId).toBe('screen2');
    });

    it('should handle screen IDs with special characters', () => {
      const { result } = renderHook(() => useScreenNavigation());

      const specialIds = [
        'screen-with-dashes',
        'screen_with_underscores',
        'screen.with.dots',
        'screen/with/slashes',
        'screen:with:colons',
      ];

      specialIds.forEach((screenId) => {
        act(() => {
          result.current.navigateToScreen(screenId);
        });

        expect(result.current.currentScreenId).toBe(screenId);
      });
    });

    it('should handle numeric screen IDs as strings', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('123');
      });

      expect(result.current.currentScreenId).toBe('123');
    });

    it('should handle empty string as screen ID', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('');
      });

      expect(result.current.currentScreenId).toBe('');
    });

    it('should handle very long screen IDs', () => {
      const { result } = renderHook(() => useScreenNavigation());
      const longId = 'a'.repeat(1000);

      act(() => {
        result.current.navigateToScreen(longId);
      });

      expect(result.current.currentScreenId).toBe(longId);
    });
  });

  describe('setCurrentScreenId', () => {
    it('should set screen ID directly', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.setCurrentScreenId('direct-set');
      });

      expect(result.current.currentScreenId).toBe('direct-set');
    });

    it('should set screen ID to null', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.setCurrentScreenId('some-screen');
        result.current.setCurrentScreenId(null);
      });

      expect(result.current.currentScreenId).toBeNull();
    });
  });

  describe('resetNavigation', () => {
    it('should reset to null', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('some-screen');
      });

      expect(result.current.currentScreenId).toBe('some-screen');

      act(() => {
        result.current.resetNavigation();
      });

      expect(result.current.currentScreenId).toBeNull();
    });

    it('should work when already null', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.resetNavigation();
      });

      expect(result.current.currentScreenId).toBeNull();
    });

    it('should handle multiple consecutive resets', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('screen1');
      });

      act(() => {
        result.current.resetNavigation();
        result.current.resetNavigation();
        result.current.resetNavigation();
      });

      expect(result.current.currentScreenId).toBeNull();
    });
  });

  describe('Navigation Workflows', () => {
    it('should handle navigate -> navigate -> reset flow', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('screen1');
      });

      expect(result.current.currentScreenId).toBe('screen1');

      act(() => {
        result.current.navigateToScreen('screen2');
      });

      expect(result.current.currentScreenId).toBe('screen2');

      act(() => {
        result.current.resetNavigation();
      });

      expect(result.current.currentScreenId).toBeNull();
    });

    it('should handle reset -> navigate flow', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.resetNavigation();
      });

      expect(result.current.currentScreenId).toBeNull();

      act(() => {
        result.current.navigateToScreen('home');
      });

      expect(result.current.currentScreenId).toBe('home');
    });

    it('should handle multiple navigation steps', () => {
      const { result } = renderHook(() => useScreenNavigation());

      const screens = ['home', 'profile', 'settings', 'about', 'contact'];

      screens.forEach((screen) => {
        act(() => {
          result.current.navigateToScreen(screen);
        });

        expect(result.current.currentScreenId).toBe(screen);
      });
    });

    it('should handle back-and-forth navigation', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('home');
      });

      expect(result.current.currentScreenId).toBe('home');

      act(() => {
        result.current.navigateToScreen('settings');
      });

      expect(result.current.currentScreenId).toBe('settings');

      act(() => {
        result.current.navigateToScreen('home');
      });

      expect(result.current.currentScreenId).toBe('home');
    });

    it('should handle navigate to same screen', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('home');
      });

      act(() => {
        result.current.navigateToScreen('home');
      });

      expect(result.current.currentScreenId).toBe('home');
    });
  });

  describe('Function Stability', () => {
    it('should have stable function references', () => {
      const { result, rerender } = renderHook(() => useScreenNavigation());

      const functions = {
        navigateToScreen: result.current.navigateToScreen,
        resetNavigation: result.current.resetNavigation,
      };

      rerender();

      expect(result.current.navigateToScreen).toBe(functions.navigateToScreen);
      expect(result.current.resetNavigation).toBe(functions.resetNavigation);
    });

    it('should maintain setCurrentScreenId stability', () => {
      const { result, rerender } = renderHook(() => useScreenNavigation());

      const setCurrentScreenId = result.current.setCurrentScreenId;

      rerender();

      expect(result.current.setCurrentScreenId).toBe(setCurrentScreenId);
    });
  });

  describe('State Persistence', () => {
    it('should maintain state across re-renders', () => {
      const { result, rerender } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('persistent-screen');
      });

      rerender();

      expect(result.current.currentScreenId).toBe('persistent-screen');
    });

    it('should maintain null state across re-renders', () => {
      const { result, rerender } = renderHook(() => useScreenNavigation());

      rerender();

      expect(result.current.currentScreenId).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid navigation', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('screen1');
        result.current.navigateToScreen('screen2');
        result.current.navigateToScreen('screen3');
        result.current.navigateToScreen('screen4');
        result.current.navigateToScreen('screen5');
      });

      expect(result.current.currentScreenId).toBe('screen5');
    });

    it('should handle alternating navigate and reset', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('screen1');
        result.current.resetNavigation();
        result.current.navigateToScreen('screen2');
        result.current.resetNavigation();
        result.current.navigateToScreen('screen3');
      });

      expect(result.current.currentScreenId).toBe('screen3');
    });

    it('should handle Unicode screen IDs', () => {
      const { result } = renderHook(() => useScreenNavigation());

      const unicodeIds = ['日本語', 'Ελληνικά', 'العربية', '🏠', '👤'];

      unicodeIds.forEach((screenId) => {
        act(() => {
          result.current.navigateToScreen(screenId);
        });

        expect(result.current.currentScreenId).toBe(screenId);
      });
    });
  });

  describe('Type Validation', () => {
    it('should only accept string for navigateToScreen', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateToScreen('valid-string');
      });

      expect(result.current.currentScreenId).toBe('valid-string');
    });
  });
});
