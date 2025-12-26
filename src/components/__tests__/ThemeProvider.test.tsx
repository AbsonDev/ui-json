/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';

// Mock next-themes
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: any) => (
    <div data-testid="theme-provider" {...props}>
      {children}
    </div>
  ),
}));

describe('ThemeProvider', () => {
  it('should render children', () => {
    render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should pass props to NextThemesProvider', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <div>Content</div>
      </ThemeProvider>
    );

    const provider = screen.getByTestId('theme-provider');
    expect(provider).toHaveAttribute('attribute', 'class');
    expect(provider).toHaveAttribute('defaultTheme', 'dark');
  });

  it('should render multiple children', () => {
    render(
      <ThemeProvider>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ThemeProvider>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  it('should handle empty children', () => {
    render(<ThemeProvider>{null}</ThemeProvider>);

    const provider = screen.getByTestId('theme-provider');
    expect(provider).toBeInTheDocument();
  });

  it('should render without errors when additional props are provided', () => {
    const customProps = {
      enableSystem: true,
      storageKey: 'custom-theme',
      themes: ['light', 'dark', 'system'],
    };

    const { container } = render(
      <ThemeProvider {...customProps}>
        <div>Content</div>
      </ThemeProvider>
    );

    expect(container).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
