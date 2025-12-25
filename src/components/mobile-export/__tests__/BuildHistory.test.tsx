import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BuildHistory } from '../BuildHistory';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

describe('BuildHistory', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    appId: 'test-app-123',
    isOpen: true,
    onClose: mockOnClose,
  };

  const mockBuilds = [
    {
      id: 'build-1',
      platform: 'android',
      buildType: 'debug',
      status: 'success',
      bundleId: 'com.test.app',
      appVersion: '1.0.0',
      versionCode: 1,
      appName: 'Test App',
      downloadUrl: '/api/builds/build-1/download',
      fileSize: 5242880, // 5 MB
      fileName: 'app-debug.aab',
      buildDuration: 125,
      completedAt: '2024-01-15T10:30:00.000Z',
      createdAt: '2024-01-15T10:28:00.000Z',
    },
    {
      id: 'build-2',
      platform: 'ios',
      buildType: 'release',
      status: 'failed',
      bundleId: 'com.test.app',
      appVersion: '1.0.1',
      versionCode: 2,
      appName: 'Test App',
      error: 'Xcode build failed',
      createdAt: '2024-01-14T15:00:00.000Z',
    },
    {
      id: 'build-3',
      platform: 'android',
      buildType: 'release',
      status: 'building',
      bundleId: 'com.test.app',
      appVersion: '1.1.0',
      versionCode: 3,
      appName: 'Test App',
      createdAt: '2024-01-16T09:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <BuildHistory {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render dialog when isOpen is true', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: [] }),
      });

      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Histórico de Builds')).toBeInTheDocument();
      });
    });

    it('should display header description', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: [] }),
      });

      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Visualize todos os builds mobile/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator initially', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      );

      render(<BuildHistory {...defaultProps} />);

      expect(screen.getByText('Carregando builds...')).toBeInTheDocument();
    });

    it('should fetch builds on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: [] }),
      });

      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/test-app-123/export'
        );
      });
    });
  });

  describe('Empty state', () => {
    it('should show empty message when no builds exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: [] }),
      });

      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum build realizado ainda')).toBeInTheDocument();
      });
    });

    it('should show helpful hint in empty state', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: [] }),
      });

      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Clique em "Exportar para Mobile"/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should show error message on fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to load')
      );

      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      });
    });

    it('should refetch when retry button is clicked', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ builds: mockBuilds }),
        });

      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Tentar Novamente');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Test App')).toBeInTheDocument();
      });
    });
  });

  describe('Build list display', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: mockBuilds }),
      });
    });

    it('should display all builds', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getAllByText('Test App')).toHaveLength(3);
      });
    });

    it('should show platform badges', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getAllByText('Android')).toHaveLength(2);
        expect(screen.getByText('iOS')).toBeInTheDocument();
      });
    });

    it('should show status badges', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('success')).toBeInTheDocument();
        expect(screen.getByText('failed')).toBeInTheDocument();
        expect(screen.getByText('building')).toBeInTheDocument();
      });
    });

    it('should show build type', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getAllByText('debug')).toHaveLength(1);
        expect(screen.getAllByText('release')).toHaveLength(2);
      });
    });

    it('should display bundle IDs', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        const bundleIds = screen.getAllByText('com.test.app');
        expect(bundleIds).toHaveLength(3);
      });
    });

    it('should display versions', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1.0.0')).toBeInTheDocument();
        expect(screen.getByText('1.0.1')).toBeInTheDocument();
        expect(screen.getByText('1.1.0')).toBeInTheDocument();
      });
    });

    it('should display version codes', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/code 1/i)).toBeInTheDocument();
        expect(screen.getByText(/code 2/i)).toBeInTheDocument();
        expect(screen.getByText(/code 3/i)).toBeInTheDocument();
      });
    });
  });

  describe('Build details', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: mockBuilds }),
      });
    });

    it('should format file size correctly', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('5.00 MB')).toBeInTheDocument();
      });
    });

    it('should format build duration correctly', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2m 5s')).toBeInTheDocument();
      });
    });

    it('should format dates in Portuguese', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        // Check for date components (day/month/year)
        const dateElements = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('should show error message for failed builds', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Xcode build failed/i)).toBeInTheDocument();
      });
    });

    it('should show completed timestamp for finished builds', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Concluído:/i)).toBeInTheDocument();
      });
    });
  });

  describe('Download functionality', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: mockBuilds }),
      });
    });

    it('should show download button for successful builds', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        const downloadButtons = screen.getAllByText('Download');
        expect(downloadButtons).toHaveLength(1); // Only success build
      });
    });

    it('should not show download button for failed builds', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        const builds = screen.getAllByText('Test App');
        expect(builds).toHaveLength(3);
        const downloadButtons = screen.getAllByText('Download');
        expect(downloadButtons).toHaveLength(1); // Not 3
      });
    });

    it('should not show download button for building builds', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        const downloadButtons = screen.getAllByText('Download');
        expect(downloadButtons).toHaveLength(1); // Only success
      });
    });

    it('should have correct download link', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        const downloadLink = screen.getByText('Download').closest('a');
        expect(downloadLink).toHaveAttribute('href', '/api/builds/build-1/download');
        expect(downloadLink).toHaveAttribute('download');
      });
    });
  });

  describe('Status indicators', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: mockBuilds }),
      });
    });

    it('should show success icon for successful builds', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        const successBadge = screen.getByText('success');
        expect(successBadge).toHaveClass('bg-green-100');
      });
    });

    it('should show failure icon for failed builds', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        const failedBadge = screen.getByText('failed');
        expect(failedBadge).toHaveClass('bg-red-100');
      });
    });

    it('should show building icon for in-progress builds', async () => {
      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        const buildingBadge = screen.getByText('building');
        expect(buildingBadge).toHaveClass('bg-blue-100');
      });
    });
  });

  describe('Footer', () => {
    it('should show build count', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: mockBuilds }),
      });

      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('3 builds encontrados')).toBeInTheDocument();
      });
    });

    it('should show singular form for single build', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: [mockBuilds[0]] }),
      });

      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('1 build encontrado')).toBeInTheDocument();
      });
    });

    it('should have close button', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: [] }),
      });

      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Fechar')).toBeInTheDocument();
      });
    });

    it('should call onClose when close button is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ builds: [] }),
      });

      render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        const closeButton = screen.getByText('Fechar');
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Refetching', () => {
    it('should refetch when dialog is reopened', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builds: [] }),
      });

      const { rerender } = render(<BuildHistory {...defaultProps} isOpen={false} />);

      expect(global.fetch).not.toHaveBeenCalled();

      rerender(<BuildHistory {...defaultProps} isOpen={true} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      rerender(<BuildHistory {...defaultProps} isOpen={false} />);
      rerender(<BuildHistory {...defaultProps} isOpen={true} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should refetch when appId changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ builds: [] }),
      });

      const { rerender } = render(<BuildHistory {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/test-app-123/export');
      });

      rerender(<BuildHistory {...defaultProps} appId="different-app" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/different-app/export');
      });
    });
  });
});
