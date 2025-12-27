import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { useTheme } from 'next-themes';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

describe('ThemeSwitcher', () => {
  const mockSetTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ThemeSwitcher />);
    const button = screen.getByRole('button', { name: /Switch to dark mode/i });
    expect(button).toBeInTheDocument();
  });

  it('should show moon icon in light mode', async () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ThemeSwitcher />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Switch to dark mode/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('should show sun icon in dark mode', async () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    render(<ThemeSwitcher />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Switch to light mode/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('should toggle theme from light to dark', async () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ThemeSwitcher />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Switch to dark mode/i });
      fireEvent.click(button);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });
  });

  it('should toggle theme from dark to light', async () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    render(<ThemeSwitcher />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Switch to light mode/i });
      fireEvent.click(button);
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  it('should have proper accessibility attributes', async () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ThemeSwitcher />);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Switch to dark mode/i });
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      expect(button).toHaveAttribute('title', 'Switch to dark mode');
    });
  });

  it('should render button element', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    const { container } = render(<ThemeSwitcher />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('rounded-md');
  });
});
