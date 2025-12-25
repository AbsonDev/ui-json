import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileExportDialog } from '../MobileExportDialog';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

describe('MobileExportDialog', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    projectId: 'test-project-123',
    projectName: 'Test App',
    isOpen: true,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <MobileExportDialog {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render dialog when isOpen is true', () => {
      render(<MobileExportDialog {...defaultProps} />);
      expect(screen.getByText('Exportar para Mobile')).toBeInTheDocument();
    });

    it('should display platform selection buttons', () => {
      render(<MobileExportDialog {...defaultProps} />);
      expect(screen.getByText('Android')).toBeInTheDocument();
      expect(screen.getByText('iOS')).toBeInTheDocument();
    });

    it('should display build type selector', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Debug (teste)')).toBeInTheDocument();
    });

    it('should display bundle ID input', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('com.myapp.myproject');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('com.myapp.test-project-123');
    });

    it('should display version inputs', () => {
      render(<MobileExportDialog {...defaultProps} />);
      expect(screen.getByDisplayValue('1.0.0')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });

    it('should display description textarea', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Descrição do aplicativo...');
      expect(textarea).toBeInTheDocument();
    });

    it('should display action buttons', () => {
      render(<MobileExportDialog {...defaultProps} />);
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('Exportar')).toBeInTheDocument();
    });
  });

  describe('Platform selection', () => {
    it('should default to Android platform', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const androidButton = screen.getByText('Android').closest('button');
      expect(androidButton).toHaveClass('border-green-500');
    });

    it('should allow switching to iOS platform', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const iosButton = screen.getByText('iOS').closest('button');

      fireEvent.click(iosButton!);

      expect(iosButton).toHaveClass('border-blue-500');
    });

    it('should show iOS warning when iOS is selected', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const iosButton = screen.getByText('iOS').closest('button');

      fireEvent.click(iosButton!);

      expect(screen.getByText(/Build iOS requer macOS/i)).toBeInTheDocument();
    });
  });

  describe('Form inputs', () => {
    it('should allow changing bundle ID', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('com.myapp.myproject') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'com.custom.bundle' } });

      expect(input.value).toBe('com.custom.bundle');
    });

    it('should allow changing version', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('1.0.0') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '2.0.0' } });

      expect(input.value).toBe('2.0.0');
    });

    it('should allow changing version code', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const inputs = screen.getAllByRole('spinbutton');
      const versionCodeInput = inputs.find(
        input => (input as HTMLInputElement).value === '1'
      ) as HTMLInputElement;

      fireEvent.change(versionCodeInput, { target: { value: '5' } });

      expect(versionCodeInput.value).toBe('5');
    });

    it('should allow changing description', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const textarea = screen.getByPlaceholderText('Descrição do aplicativo...') as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: 'My app description' } });

      expect(textarea.value).toBe('My app description');
    });

    it('should allow changing build type', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;

      fireEvent.change(select, { target: { value: 'release' } });

      expect(select.value).toBe('release');
    });

    it('should show warning for release builds', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const select = screen.getByRole('combobox');

      fireEvent.change(select, { target: { value: 'release' } });

      expect(screen.getByText(/Build de release requer certificados/i)).toBeInTheDocument();
    });
  });

  describe('Export functionality', () => {
    it('should send export request when Export is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          downloadUrl: '/api/builds/123/download',
        }),
      });

      render(<MobileExportDialog {...defaultProps} />);
      const exportButton = screen.getByText('Exportar');

      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/test-project-123/export',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('should include correct data in export request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success' }),
      });

      render(<MobileExportDialog {...defaultProps} />);

      // Change some values
      const bundleInput = screen.getByPlaceholderText('com.myapp.myproject');
      fireEvent.change(bundleInput, { target: { value: 'com.test.app' } });

      const exportButton = screen.getByText('Exportar');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('com.test.app'),
          })
        );
      });
    });

    it('should disable buttons while building', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<MobileExportDialog {...defaultProps} />);
      const exportButton = screen.getByText('Exportar');

      fireEvent.click(exportButton);

      expect(screen.getByText('Gerando...')).toBeInTheDocument();
      expect(exportButton).toBeDisabled();
      expect(screen.getByText('Cancelar')).toBeDisabled();
    });

    it('should show success message on successful export', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          downloadUrl: '/api/builds/123/download',
        }),
      });

      render(<MobileExportDialog {...defaultProps} />);
      const exportButton = screen.getByText('Exportar');

      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/Build concluído/i)).toBeInTheDocument();
      });
    });

    it('should show pending message for async builds', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'pending',
        }),
      });

      render(<MobileExportDialog {...defaultProps} />);
      const exportButton = screen.getByText('Exportar');

      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/Build iniciado/i)).toBeInTheDocument();
      });
    });

    it('should show error message on failed export', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Build failed: Missing dependencies',
        }),
      });

      render(<MobileExportDialog {...defaultProps} />);
      const exportButton = screen.getByText('Exportar');

      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/Missing dependencies/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<MobileExportDialog {...defaultProps} />);
      const exportButton = screen.getByText('Exportar');

      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should trigger download on successful build', async () => {
      const mockWindowOpen = jest.spyOn(window, 'open').mockImplementation();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          downloadUrl: '/api/builds/123/download',
        }),
      });

      render(<MobileExportDialog {...defaultProps} />);
      const exportButton = screen.getByText('Exportar');

      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith(
          '/api/builds/123/download',
          '_blank'
        );
      });

      mockWindowOpen.mockRestore();
    });
  });

  describe('Dialog controls', () => {
    it('should call onClose when Cancel is clicked', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const cancelButton = screen.getByText('Cancelar');

      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not allow closing while building', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<MobileExportDialog {...defaultProps} />);
      const exportButton = screen.getByText('Exportar');

      fireEvent.click(exportButton);

      const cancelButton = screen.getByText('Cancelar');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long project names', () => {
      render(
        <MobileExportDialog
          {...defaultProps}
          projectName="A".repeat(100)}
        />
      );
      expect(screen.getByText('Exportar para Mobile')).toBeInTheDocument();
    });

    it('should handle special characters in bundle ID', () => {
      render(<MobileExportDialog {...defaultProps} />);
      const input = screen.getByPlaceholderText('com.myapp.myproject');

      fireEvent.change(input, { target: { value: 'com.test-app.my_app' } });

      expect(input).toHaveValue('com.test-app.my_app');
    });

    it('should clear error when trying new export', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'First error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'success' }),
        });

      render(<MobileExportDialog {...defaultProps} />);
      const exportButton = screen.getByText('Exportar');

      // First export (fails)
      fireEvent.click(exportButton);
      await waitFor(() => {
        expect(screen.getByText(/First error/i)).toBeInTheDocument();
      });

      // Second export (succeeds)
      fireEvent.click(exportButton);
      await waitFor(() => {
        expect(screen.queryByText(/First error/i)).not.toBeInTheDocument();
      });
    });
  });
});
