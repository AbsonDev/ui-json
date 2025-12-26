/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { UsageIndicator } from '../UsageIndicator';

// Mock dependencies
jest.mock('@/actions/subscriptions', () => ({
  getUsageMetrics: jest.fn(),
  getUserPlanDetails: jest.fn(),
}));

jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: jest.fn(() => ({
    track: {
      trackUsageWarningShown: jest.fn(),
      trackUpgradeButtonClicked: jest.fn(),
    },
  })),
}));

jest.mock('next/link', () => {
  return ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  );
});

jest.mock('lucide-react', () => ({
  AlertTriangle: () => <svg data-testid="alert-icon" />,
  TrendingUp: () => <svg data-testid="trending-icon" />,
}));

import { getUsageMetrics, getUserPlanDetails } from '@/actions/subscriptions';
import { useAnalytics } from '@/hooks/useAnalytics';

const mockGetUsageMetrics = getUsageMetrics as jest.MockedFunction<typeof getUsageMetrics>;
const mockGetUserPlanDetails = getUserPlanDetails as jest.MockedFunction<typeof getUserPlanDetails>;
const mockUseAnalytics = useAnalytics as jest.MockedFunction<typeof useAnalytics>;

describe('UsageIndicator', () => {
  const mockTrack = {
    trackUsageWarningShown: jest.fn(),
    trackUpgradeButtonClicked: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAnalytics.mockReturnValue({ track: mockTrack } as any);
  });

  describe('Loading State', () => {
    it('should show loading skeleton initially', () => {
      mockGetUsageMetrics.mockImplementation(() => new Promise(() => {}));
      mockGetUserPlanDetails.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<UsageIndicator />);

      const loadingElement = container.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });

    it('should have animate-pulse class while loading', () => {
      mockGetUsageMetrics.mockImplementation(() => new Promise(() => {}));
      mockGetUserPlanDetails.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<UsageIndicator />);

      const loadingElement = container.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('Normal Rendering - FREE Plan', () => {
    beforeEach(() => {
      mockGetUsageMetrics.mockResolvedValue({
        apps: { current: 2, limit: 5, percentage: 40 },
        builds: { current: 0, limit: 0, percentage: 0 },
        exports: { current: 10, limit: 50, percentage: 20 },
      } as any);

      mockGetUserPlanDetails.mockResolvedValue({
        planTier: 'FREE',
      } as any);
    });

    it('should display plan tier badge', async () => {
      render(<UsageIndicator />);

      await waitFor(() => {
        expect(screen.getByText('FREE')).toBeInTheDocument();
      });
    });

    it('should display "Usage This Month" heading', async () => {
      render(<UsageIndicator />);

      await waitFor(() => {
        expect(screen.getByText('Usage This Month')).toBeInTheDocument();
      });
    });

    it('should display apps usage', async () => {
      render(<UsageIndicator />);

      await waitFor(() => {
        expect(screen.getByText('Apps')).toBeInTheDocument();
        expect(screen.getByText('2 / 5')).toBeInTheDocument();
      });
    });

    it('should display mobile builds usage', async () => {
      render(<UsageIndicator />);

      await waitFor(() => {
        expect(screen.getByText('Mobile Builds')).toBeInTheDocument();
        expect(screen.getByText('0 / 0')).toBeInTheDocument();
      });
    });

    it('should display exports usage', async () => {
      render(<UsageIndicator />);

      await waitFor(() => {
        expect(screen.getByText('Exports')).toBeInTheDocument();
        expect(screen.getByText('10 / 50')).toBeInTheDocument();
      });
    });

    it('should show upgrade button for FREE plan', async () => {
      render(<UsageIndicator />);

      await waitFor(() => {
        expect(screen.getByText('Upgrade to Pro for Unlimited')).toBeInTheDocument();
      });
    });

    it('should display message about mobile builds not available on free', async () => {
      render(<UsageIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/Mobile builds not available on Free plan/i)).toBeInTheDocument();
      });
    });
  });

  describe('Normal Rendering - PRO Plan', () => {
    beforeEach(() => {
      mockGetUsageMetrics.mockResolvedValue({
        apps: { current: 15, limit: -1, percentage: 0 },
        builds: { current: 5, limit: -1, percentage: 0 },
        exports: { current: 100, limit: -1, percentage: 0 },
      } as any);

      mockGetUserPlanDetails.mockResolvedValue({
        planTier: 'PRO',
      } as any);
    });

    it('should display PRO tier badge', async () => {
      render(<UsageIndicator />);

      await waitFor(() => {
        expect(screen.getByText('PRO')).toBeInTheDocument();
      });
    });

    it('should display unlimited symbol for apps', async () => {
      render(<UsageIndicator />);

      await waitFor(() => {
        expect(screen.getByText('15 / ∞')).toBeInTheDocument();
      });
    });

    it('should display unlimited symbol for builds', async () => {
      render(<UsageIndicator />);

      await waitFor(() => {
        expect(screen.getByText('5 / ∞')).toBeInTheDocument();
      });
    });

    it('should not show upgrade button for PRO plan', async () => {
      render(<UsageIndicator />);

      await waitFor(() => {
        expect(screen.queryByText('Upgrade to Pro for Unlimited')).not.toBeInTheDocument();
      });
    });
  });

  describe('Warning States', () => {
    it('should show warning at 80% usage (apps)', async () => {
      mockGetUsageMetrics.mockResolvedValue({
        apps: { current: 4, limit: 5, percentage: 80 },
        builds: { current: 0, limit: 0, percentage: 0 },
        exports: { current: 10, limit: 50, percentage: 20 },
      } as any);

      mockGetUserPlanDetails.mockResolvedValue({ planTier: 'FREE' } as any);

      render(<UsageIndicator />);

      await waitFor(() => {
        expect(screen.getByText(/You're close to your limit/i)).toBeInTheDocument();
        expect(screen.getByText(/for unlimited apps/i)).toBeInTheDocument();
      });
    });

    it('should show warning at 90%+ usage with red color', async () => {
      mockGetUsageMetrics.mockResolvedValue({
        apps: { current: 9, limit: 10, percentage: 90 },
        builds: { current: 0, limit: 0, percentage: 0 },
        exports: { current: 10, limit: 50, percentage: 20 },
      } as any);

      mockGetUserPlanDetails.mockResolvedValue({ planTier: 'FREE' } as any);

      const { container } = render(<UsageIndicator />);

      await waitFor(() => {
        const progressBar = container.querySelector('.bg-red-600');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should show yellow color at 70-89% usage', async () => {
      mockGetUsageMetrics.mockResolvedValue({
        apps: { current: 7, limit: 10, percentage: 70 },
        builds: { current: 0, limit: 0, percentage: 0 },
        exports: { current: 10, limit: 50, percentage: 20 },
      } as any);

      mockGetUserPlanDetails.mockResolvedValue({ planTier: 'FREE' } as any);

      const { container } = render(<UsageIndicator />);

      await waitFor(() => {
        const progressBar = container.querySelector('.bg-yellow-600');
        expect(progressBar).toBeInTheDocument();
      });
    });

    it('should show green color below 70% usage', async () => {
      mockGetUsageMetrics.mockResolvedValue({
        apps: { current: 5, limit: 10, percentage: 50 },
        builds: { current: 0, limit: 0, percentage: 0 },
        exports: { current: 10, limit: 50, percentage: 20 },
      } as any);

      mockGetUserPlanDetails.mockResolvedValue({ planTier: 'FREE' } as any);

      const { container } = render(<UsageIndicator />);

      await waitFor(() => {
        const progressBars = container.querySelectorAll('.bg-green-600');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('should track usage warning when apps at 80%', async () => {
      mockGetUsageMetrics.mockResolvedValue({
        apps: { current: 4, limit: 5, percentage: 80 },
        builds: { current: 0, limit: 0, percentage: 0 },
        exports: { current: 10, limit: 50, percentage: 20 },
      } as any);

      mockGetUserPlanDetails.mockResolvedValue({ planTier: 'FREE' } as any);

      render(<UsageIndicator />);

      await waitFor(() => {
        expect(mockTrack.trackUsageWarningShown).toHaveBeenCalledWith({
          limitType: 'apps',
          percentage: 80,
          current: 4,
          max: 5,
        });
      });
    });

    it('should track usage warning when exports at 80%', async () => {
      mockGetUsageMetrics.mockResolvedValue({
        apps: { current: 2, limit: 5, percentage: 40 },
        builds: { current: 0, limit: 0, percentage: 0 },
        exports: { current: 40, limit: 50, percentage: 80 },
      } as any);

      mockGetUserPlanDetails.mockResolvedValue({ planTier: 'FREE' } as any);

      render(<UsageIndicator />);

      await waitFor(() => {
        expect(mockTrack.trackUsageWarningShown).toHaveBeenCalledWith({
          limitType: 'exports',
          percentage: 80,
          current: 40,
          max: 50,
        });
      });
    });

    it('should track upgrade button click from main CTA', async () => {
      mockGetUsageMetrics.mockResolvedValue({
        apps: { current: 2, limit: 5, percentage: 40 },
        builds: { current: 0, limit: 0, percentage: 0 },
        exports: { current: 10, limit: 50, percentage: 20 },
      } as any);

      mockGetUserPlanDetails.mockResolvedValue({ planTier: 'FREE' } as any);

      render(<UsageIndicator />);

      await waitFor(() => {
        const upgradeButton = screen.getByText('Upgrade to Pro for Unlimited');
        fireEvent.click(upgradeButton);

        expect(mockTrack.trackUpgradeButtonClicked).toHaveBeenCalledWith({
          location: 'usage_indicator',
          targetPlan: 'PRO',
          currentPlan: 'FREE',
        });
      });
    });

    it('should track upgrade button click from warning message', async () => {
      mockGetUsageMetrics.mockResolvedValue({
        apps: { current: 4, limit: 5, percentage: 80 },
        builds: { current: 0, limit: 0, percentage: 0 },
        exports: { current: 10, limit: 50, percentage: 20 },
      } as any);

      mockGetUserPlanDetails.mockResolvedValue({ planTier: 'FREE' } as any);

      render(<UsageIndicator />);

      await waitFor(() => {
        const upgradeLink = screen.getByText('Upgrade to Pro');
        fireEvent.click(upgradeLink);

        expect(mockTrack.trackUpgradeButtonClicked).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should return null when stats fail to load', async () => {
      mockGetUsageMetrics.mockRejectedValue(new Error('API Error'));
      mockGetUserPlanDetails.mockResolvedValue({ planTier: 'FREE' } as any);

      const { container } = render(<UsageIndicator />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should log error when loading fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGetUsageMetrics.mockRejectedValue(new Error('Network Error'));
      mockGetUserPlanDetails.mockResolvedValue({ planTier: 'FREE' } as any);

      render(<UsageIndicator />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Failed to load usage stats:', expect.any(Error));
      });

      consoleError.mockRestore();
    });
  });

  describe('Progress Bar Rendering', () => {
    it('should not render progress bar when limit is unlimited (-1)', async () => {
      mockGetUsageMetrics.mockResolvedValue({
        apps: { current: 100, limit: -1, percentage: 0 },
        builds: { current: 50, limit: -1, percentage: 0 },
        exports: { current: 200, limit: -1, percentage: 0 },
      } as any);

      mockGetUserPlanDetails.mockResolvedValue({ planTier: 'PRO' } as any);

      const { container } = render(<UsageIndicator />);

      await waitFor(() => {
        const progressBars = container.querySelectorAll('.rounded-full.h-2');
        expect(progressBars).toHaveLength(0);
      });
    });

    it('should cap progress bar at 100% even if percentage exceeds', async () => {
      mockGetUsageMetrics.mockResolvedValue({
        apps: { current: 12, limit: 10, percentage: 120 },
        builds: { current: 0, limit: 0, percentage: 0 },
        exports: { current: 10, limit: 50, percentage: 20 },
      } as any);

      mockGetUserPlanDetails.mockResolvedValue({ planTier: 'FREE' } as any);

      const { container } = render(<UsageIndicator />);

      await waitFor(() => {
        const progressBar = container.querySelector('[style*="width"]') as HTMLElement;
        expect(progressBar?.style.width).toBe('100%');
      });
    });
  });
});
