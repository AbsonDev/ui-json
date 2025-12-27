/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useSecondAppPrompt,
  useAfterExportPrompt,
  useThirdDayPrompt,
  useAILimitPrompt,
  useBuildOpportunityPrompt,
  clearAllPromptDismissals,
} from '../useProactivePrompts';

// Mock timers
jest.useFakeTimers();

describe('useProactivePrompts', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('useSecondAppPrompt', () => {
    it('should not show initially with 1 app', () => {
      const { result } = renderHook(() => useSecondAppPrompt(1));
      expect(result.current).toBe(false);
    });

    it('should show prompt after delay with 2 apps', async () => {
      const { result } = renderHook(() => useSecondAppPrompt(2));

      // Initially false
      expect(result.current).toBe(false);

      // Advance timers by 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Wait for state update
      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should not show before 2 second delay', () => {
      const { result } = renderHook(() => useSecondAppPrompt(2));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current).toBe(false);
    });

    it('should not show with 3 apps', () => {
      const { result } = renderHook(() => useSecondAppPrompt(3));

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current).toBe(false);
    });

    it('should not show when previously dismissed within 7 days', async () => {
      const now = Date.now();
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
      localStorage.setItem('prompt_dismissed_second_app', threeDaysAgo.toString());

      const { result } = renderHook(() => useSecondAppPrompt(2));

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current).toBe(false);
    });

    it('should show when dismissed more than 7 days ago', async () => {
      const now = Date.now();
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
      localStorage.setItem('prompt_dismissed_second_app', eightDaysAgo.toString());

      const { result } = renderHook(() => useSecondAppPrompt(2));

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should hide when app count changes from 2 to 3', async () => {
      const { result, rerender } = renderHook(
        ({ count }) => useSecondAppPrompt(count),
        { initialProps: { count: 2 } }
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      // Change to 3 apps
      rerender({ count: 3 });

      expect(result.current).toBe(false);
    });

    it('should cleanup timer on unmount', () => {
      const { unmount } = renderHook(() => useSecondAppPrompt(2));

      unmount();

      // Timer should be cleared - no error should occur
      act(() => {
        jest.advanceTimersByTime(2000);
      });
    });
  });

  describe('useAfterExportPrompt', () => {
    it('should not show initially with 0 exports', () => {
      const { result } = renderHook(() => useAfterExportPrompt(0));
      expect(result.current).toBe(false);
    });

    it('should not show with first export', () => {
      localStorage.setItem('last_export_count', '0');
      const { result } = renderHook(() => useAfterExportPrompt(1));
      expect(result.current).toBe(false);
    });

    it('should show with 2nd export', () => {
      localStorage.setItem('last_export_count', '1');
      const { result } = renderHook(() => useAfterExportPrompt(2));
      expect(result.current).toBe(true);
    });

    it('should update last export count in localStorage', () => {
      localStorage.setItem('last_export_count', '1');
      renderHook(() => useAfterExportPrompt(2));
      expect(localStorage.getItem('last_export_count')).toBe('2');
    });

    it('should not show when dismissed', () => {
      localStorage.setItem('last_export_count', '1');
      localStorage.setItem('prompt_dismissed_after_export', 'true');
      const { result } = renderHook(() => useAfterExportPrompt(2));
      expect(result.current).toBe(false);
    });

    it('should auto-hide after 30 seconds', async () => {
      localStorage.setItem('last_export_count', '1');
      const { result } = renderHook(() => useAfterExportPrompt(2));

      expect(result.current).toBe(true);

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it('should not show if export count did not increase', () => {
      localStorage.setItem('last_export_count', '2');
      const { result } = renderHook(() => useAfterExportPrompt(2));
      expect(result.current).toBe(false);
    });

    it('should cleanup timer on unmount', () => {
      localStorage.setItem('last_export_count', '1');
      const { unmount } = renderHook(() => useAfterExportPrompt(2));

      unmount();

      // Timer should be cleared - no error should occur
      act(() => {
        jest.advanceTimersByTime(30000);
      });
    });

    it('should show with higher export counts', () => {
      localStorage.setItem('last_export_count', '4');
      const { result } = renderHook(() => useAfterExportPrompt(5));
      expect(result.current).toBe(true);
    });
  });

  describe('useThirdDayPrompt', () => {
    it('should not show on day 1', () => {
      const createdAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const { result } = renderHook(() => useThirdDayPrompt(createdAt));
      expect(result.current).toBe(false);
    });

    it('should not show on day 2', () => {
      const createdAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const { result } = renderHook(() => useThirdDayPrompt(createdAt));
      expect(result.current).toBe(false);
    });

    it('should show on day 3', () => {
      const createdAt = new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000); // 3.5 days ago
      const { result } = renderHook(() => useThirdDayPrompt(createdAt));
      expect(result.current).toBe(true);
    });

    it('should not show on day 5', () => {
      const createdAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const { result } = renderHook(() => useThirdDayPrompt(createdAt));
      expect(result.current).toBe(false);
    });

    it('should set localStorage flag when shown', () => {
      const createdAt = new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000);
      renderHook(() => useThirdDayPrompt(createdAt));
      expect(localStorage.getItem('third_day_prompt_shown')).toBe('true');
    });

    it('should not show if already shown before', () => {
      localStorage.setItem('third_day_prompt_shown', 'true');
      const createdAt = new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000);
      const { result } = renderHook(() => useThirdDayPrompt(createdAt));
      expect(result.current).toBe(false);
    });

    it('should not show when dismissed', () => {
      localStorage.setItem('prompt_dismissed_third_day', 'true');
      const createdAt = new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000);
      const { result } = renderHook(() => useThirdDayPrompt(createdAt));
      expect(result.current).toBe(false);
    });

    it('should handle string date input', () => {
      const createdAt = new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString();
      const { result } = renderHook(() => useThirdDayPrompt(createdAt));
      expect(result.current).toBe(true);
    });

    it('should show at exactly 3 days', () => {
      const createdAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const { result } = renderHook(() => useThirdDayPrompt(createdAt));
      expect(result.current).toBe(true);
    });

    it('should not show at exactly 4 days', () => {
      const createdAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
      const { result } = renderHook(() => useThirdDayPrompt(createdAt));
      expect(result.current).toBe(false);
    });
  });

  describe('useAILimitPrompt', () => {
    beforeEach(() => {
      // Mock Date for consistent testing
      jest.spyOn(Date.prototype, 'toDateString').mockReturnValue('Mon Jan 01 2025');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not show at 0% of limit', () => {
      const { result } = renderHook(() => useAILimitPrompt(0, 100));
      expect(result.current).toBe(false);
    });

    it('should not show at 50% of limit', () => {
      const { result } = renderHook(() => useAILimitPrompt(50, 100));
      expect(result.current).toBe(false);
    });

    it('should not show at 79% of limit', () => {
      const { result } = renderHook(() => useAILimitPrompt(79, 100));
      expect(result.current).toBe(false);
    });

    it('should show at 80% of limit', () => {
      const { result } = renderHook(() => useAILimitPrompt(80, 100));
      expect(result.current).toBe(true);
    });

    it('should show at 90% of limit', () => {
      const { result } = renderHook(() => useAILimitPrompt(90, 100));
      expect(result.current).toBe(true);
    });

    it('should show at 100% of limit', () => {
      const { result } = renderHook(() => useAILimitPrompt(100, 100));
      expect(result.current).toBe(true);
    });

    it('should store last shown date in localStorage', () => {
      renderHook(() => useAILimitPrompt(80, 100));
      expect(localStorage.getItem('ai_limit_prompt_last_shown')).toBe('Mon Jan 01 2025');
    });

    it('should not show if already shown today', () => {
      localStorage.setItem('ai_limit_prompt_last_shown', 'Mon Jan 01 2025');
      const { result } = renderHook(() => useAILimitPrompt(80, 100));
      expect(result.current).toBe(false);
    });

    it('should not show if dismissed today', () => {
      localStorage.setItem('prompt_dismissed_ai_limit', 'Mon Jan 01 2025');
      const { result } = renderHook(() => useAILimitPrompt(80, 100));
      expect(result.current).toBe(false);
    });

    it('should hide when usage drops below 80%', () => {
      const { result, rerender } = renderHook(
        ({ current, max }) => useAILimitPrompt(current, max),
        { initialProps: { current: 80, max: 100 } }
      );

      expect(result.current).toBe(true);

      rerender({ current: 75, max: 100 });

      expect(result.current).toBe(false);
    });

    it('should handle different max limits correctly', () => {
      const { result } = renderHook(() => useAILimitPrompt(40, 50));
      expect(result.current).toBe(true); // 40/50 = 80%
    });

    it('should handle edge case of max 0', () => {
      const { result } = renderHook(() => useAILimitPrompt(0, 0));
      expect(result.current).toBe(false);
    });
  });

  describe('useBuildOpportunityPrompt', () => {
    it('should not show when build not attempted', () => {
      const { result } = renderHook(() => useBuildOpportunityPrompt(false));
      expect(result.current).toBe(false);
    });

    it('should show when build is attempted', () => {
      const { result } = renderHook(() => useBuildOpportunityPrompt(true));
      expect(result.current).toBe(true);
    });

    it('should not show when dismissed within 24 hours', () => {
      const now = Date.now();
      const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
      localStorage.setItem('prompt_dismissed_build_opportunity', twelveHoursAgo.toString());

      const { result } = renderHook(() => useBuildOpportunityPrompt(true));
      expect(result.current).toBe(false);
    });

    it('should show when dismissed more than 24 hours ago', () => {
      const now = Date.now();
      const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
      localStorage.setItem(
        'prompt_dismissed_build_opportunity',
        twentyFiveHoursAgo.toString()
      );

      const { result } = renderHook(() => useBuildOpportunityPrompt(true));
      expect(result.current).toBe(true);
    });

    it('should show on first attempt', () => {
      const { result } = renderHook(() => useBuildOpportunityPrompt(true));
      expect(result.current).toBe(true);
    });

    it('should persist state when attemptedBuild remains true', () => {
      const { result, rerender } = renderHook(() => useBuildOpportunityPrompt(true));

      expect(result.current).toBe(true);

      rerender();

      expect(result.current).toBe(true);
    });
  });

  describe('clearAllPromptDismissals', () => {
    it('should clear all prompt-related localStorage items', () => {
      // Set all items
      localStorage.setItem('prompt_dismissed_second_app', 'true');
      localStorage.setItem('prompt_dismissed_after_export', 'true');
      localStorage.setItem('prompt_dismissed_third_day', 'true');
      localStorage.setItem('prompt_dismissed_ai_limit', 'true');
      localStorage.setItem('prompt_dismissed_build_opportunity', 'true');
      localStorage.setItem('last_export_count', '5');
      localStorage.setItem('third_day_prompt_shown', 'true');
      localStorage.setItem('ai_limit_prompt_last_shown', 'Mon Jan 01 2025');

      // Clear all
      clearAllPromptDismissals();

      // Verify all are cleared
      expect(localStorage.getItem('prompt_dismissed_second_app')).toBeNull();
      expect(localStorage.getItem('prompt_dismissed_after_export')).toBeNull();
      expect(localStorage.getItem('prompt_dismissed_third_day')).toBeNull();
      expect(localStorage.getItem('prompt_dismissed_ai_limit')).toBeNull();
      expect(localStorage.getItem('prompt_dismissed_build_opportunity')).toBeNull();
      expect(localStorage.getItem('last_export_count')).toBeNull();
      expect(localStorage.getItem('third_day_prompt_shown')).toBeNull();
      expect(localStorage.getItem('ai_limit_prompt_last_shown')).toBeNull();
    });

    it('should not throw error when localStorage is empty', () => {
      expect(() => clearAllPromptDismissals()).not.toThrow();
    });

    it('should allow prompts to show again after clearing', () => {
      localStorage.setItem('prompt_dismissed_build_opportunity', Date.now().toString());

      let { result } = renderHook(() => useBuildOpportunityPrompt(true));
      expect(result.current).toBe(false);

      clearAllPromptDismissals();

      ({ result } = renderHook(() => useBuildOpportunityPrompt(true)));
      expect(result.current).toBe(true);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle multiple prompts independently', () => {
      const result1 = renderHook(() => useSecondAppPrompt(2));
      const result2 = renderHook(() => useBuildOpportunityPrompt(true));

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result2.result.current).toBe(true);
    });

    it('should handle invalid localStorage values', () => {
      localStorage.setItem('last_export_count', 'invalid');

      const { result } = renderHook(() => useAfterExportPrompt(2));

      // Should parse as NaN/0 and still work
      expect(typeof result.current).toBe('boolean');
    });

    it('should handle very large timestamps', () => {
      const veryFarFuture = Date.now() + 365 * 24 * 60 * 60 * 1000;
      localStorage.setItem('prompt_dismissed_second_app', veryFarFuture.toString());

      const { result } = renderHook(() => useSecondAppPrompt(2));

      // Should not show since "dismissed" is in the future
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current).toBe(false);
    });

    it('should handle negative app counts', () => {
      const { result } = renderHook(() => useSecondAppPrompt(-1));
      expect(result.current).toBe(false);
    });

    it('should handle negative export counts', () => {
      const { result } = renderHook(() => useAfterExportPrompt(-1));
      expect(result.current).toBe(false);
    });

    it('should handle zero max requests', () => {
      const { result } = renderHook(() => useAILimitPrompt(0, 0));
      // 0/0 = NaN, which is not >= 80
      expect(result.current).toBe(false);
    });

    it('should handle rapid prop changes', () => {
      const { result, rerender } = renderHook(
        ({ count }) => useSecondAppPrompt(count),
        { initialProps: { count: 1 } }
      );

      rerender({ count: 2 });
      rerender({ count: 1 });
      rerender({ count: 2 });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should handle rapid changes without errors
      expect(typeof result.current).toBe('boolean');
    });
  });
});
