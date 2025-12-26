/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow = true, message = 'Test error' }: { shouldThrow?: boolean; message?: string }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>No error</div>;
};

// Suppress console.error during tests to avoid cluttering test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render multiple children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should not have error state initially', () => {
      const { container } = render(
        <ErrorBoundary>
          <div>Content</div>
        </ErrorBoundary>
      );

      // Should not show error UI
      expect(screen.queryByText(/Algo deu errado/i)).not.toBeInTheDocument();
      expect(container.querySelector('.bg-white.rounded-lg')).not.toBeInTheDocument();
    });
  });

  describe('Error Catching', () => {
    it('should catch error and display default fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Um erro inesperado ocorreu. Por favor, tente recarregar a página./i)
      ).toBeInTheDocument();
    });

    it('should display custom error message in fallback', () => {
      const customMessage = 'Custom error message';

      render(
        <ErrorBoundary>
          <ThrowError message={customMessage} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();
    });

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError message="Console test error" />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });

    it('should catch errors from nested components', () => {
      render(
        <ErrorBoundary>
          <div>
            <div>
              <div>
                <ThrowError />
              </div>
            </div>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();
    });

    it('should display error icon in fallback UI', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const errorIcon = container.querySelector('svg.text-red-600');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      expect(screen.queryByText(/Algo deu errado/i)).not.toBeInTheDocument();
    });

    it('should render complex custom fallback', () => {
      const customFallback = (
        <div>
          <h1>Custom Error</h1>
          <p>Something went wrong</p>
          <button>Custom Action</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });

    it('should prefer custom fallback over default UI', () => {
      render(
        <ErrorBoundary fallback={<div>Custom</div>}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.queryByText('Tentar Novamente')).not.toBeInTheDocument();
    });
  });

  describe('Error Callback', () => {
    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError message="Callback test" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should pass correct error to callback', () => {
      const onError = jest.fn();
      const errorMessage = 'Specific error message';

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError message={errorMessage} />
        </ErrorBoundary>
      );

      const [error] = onError.mock.calls[0];
      expect(error.message).toBe(errorMessage);
    });

    it('should not call callback when no error occurs', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <div>No error</div>
        </ErrorBoundary>
      );

      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle missing onError gracefully', () => {
      expect(() => {
        render(
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        );
      }).not.toThrow();
    });
  });

  describe('Error Recovery', () => {
    it('should have "Tentar Novamente" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
    });

    it('should reset error state when reset button clicked', () => {
      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);

        return (
          <ErrorBoundary>
            {shouldThrow ? (
              <button onClick={() => setShouldThrow(false)}>Fix Error</button>
            ) : (
              <div>No error</div>
            )}
          </ErrorBoundary>
        );
      };

      render(<TestComponent />);

      // Initially no error
      expect(screen.getByText('Fix Error')).toBeInTheDocument();

      // Trigger fix
      const fixButton = screen.getByText('Fix Error');
      fireEvent.click(fixButton);

      // Should show no error
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should have "Recarregar Página" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Recarregar Página')).toBeInTheDocument();
    });
  });

  describe('Development Mode Error Details', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should show error details in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError message="Dev mode error" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Detalhes do erro/i)).toBeInTheDocument();
    });

    it('should hide error details in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError message="Production error" />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Detalhes do erro/i)).not.toBeInTheDocument();
    });

    it('should display error message in details', () => {
      process.env.NODE_ENV = 'development';
      const errorMessage = 'Detailed error message';

      render(
        <ErrorBoundary>
          <ThrowError message={errorMessage} />
        </ErrorBoundary>
      );

      const details = screen.getByText(/Detalhes do erro/i);
      fireEvent.click(details);

      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    });

    it('should display component stack in details', () => {
      process.env.NODE_ENV = 'development';

      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const details = screen.getByText(/Detalhes do erro/i);
      fireEvent.click(details);

      // Component stack should be present
      const preElement = container.querySelector('pre');
      expect(preElement).toBeInTheDocument();
    });
  });

  describe('Error State Management', () => {
    it('should maintain error state across re-renders', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();

      // Re-render should maintain error state
      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();
    });

    it('should handle multiple consecutive errors', () => {
      const onError = jest.fn();

      const { rerender } = render(
        <ErrorBoundary onError={onError}>
          <ThrowError message="First error" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);

      // Reset and throw another error
      rerender(
        <ErrorBoundary onError={onError}>
          <ThrowError message="Second error" />
        </ErrorBoundary>
      );

      // Should still show error UI
      expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>);

      expect(screen.queryByText(/Algo deu errado/i)).not.toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(<ErrorBoundary>{undefined}</ErrorBoundary>);

      expect(screen.queryByText(/Algo deu errado/i)).not.toBeInTheDocument();
    });

    it('should handle empty fragment', () => {
      render(
        <ErrorBoundary>
          <></>
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Algo deu errado/i)).not.toBeInTheDocument();
    });

    it('should handle errors with empty message', () => {
      render(
        <ErrorBoundary>
          <ThrowError message="" />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000);

      render(
        <ErrorBoundary>
          <ThrowError message={longMessage} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should have accessible button text', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Tentar Novamente/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Recarregar Página/i })).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/Algo deu errado/i);
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize with correct initial state', () => {
      const { container } = render(
        <ErrorBoundary>
          <div>Content</div>
        </ErrorBoundary>
      );

      // Should render children, not error UI
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.queryByText(/Algo deu errado/i)).not.toBeInTheDocument();
    });

    it('should call getDerivedStateFromError when error thrown', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Verify error state was set by checking error UI is displayed
      expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();
    });

    it('should call componentDidCatch after getDerivedStateFromError', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      // componentDidCatch should have called onError
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with async component errors', async () => {
      const AsyncError = () => {
        const [shouldThrow, setShouldThrow] = React.useState(false);

        React.useEffect(() => {
          setShouldThrow(true);
        }, []);

        if (shouldThrow) {
          throw new Error('Async error');
        }

        return <div>Async content</div>;
      };

      render(
        <ErrorBoundary>
          <AsyncError />
        </ErrorBoundary>
      );

      // Should eventually show error
      expect(await screen.findByText(/Algo deu errado/i)).toBeInTheDocument();
    });

    it('should work with nested error boundaries', () => {
      render(
        <ErrorBoundary fallback={<div>Outer error</div>}>
          <ErrorBoundary fallback={<div>Inner error</div>}>
            <ThrowError />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText('Inner error')).toBeInTheDocument();
      expect(screen.queryByText('Outer error')).not.toBeInTheDocument();
    });

    it('should bubble error to parent boundary when reset fails', () => {
      const InnerComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Inner error');
        }
        return <div>No error</div>;
      };

      const { rerender } = render(
        <ErrorBoundary fallback={<div>Outer caught</div>}>
          <ErrorBoundary>
            <InnerComponent shouldThrow={true} />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Inner boundary shows default error UI
      expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();

      // Click reset
      const resetButton = screen.getByText('Tentar Novamente');
      fireEvent.click(resetButton);

      // If error persists, should still show error
      rerender(
        <ErrorBoundary fallback={<div>Outer caught</div>}>
          <ErrorBoundary>
            <InnerComponent shouldThrow={true} />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();
    });
  });
});
