/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Snippets } from '../Snippets';

// Mock constants
jest.mock('../../constants', () => ({
  snippets: [
    {
      name: 'Login Form',
      description: 'A simple login form with email and password',
      json: '{"type":"form","fields":["email","password"]}',
    },
    {
      name: 'User Card',
      description: 'Display user information in a card',
      json: '{"type":"card","content":"user"}',
    },
    {
      name: 'Data Table',
      description: 'A table to display data',
      json: '{"type":"table","columns":["name","email","role"]}',
    },
  ],
}));

describe('Snippets', () => {
  const mockOnAddSnippet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all snippets', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      expect(screen.getByText('Login Form')).toBeInTheDocument();
      expect(screen.getByText('User Card')).toBeInTheDocument();
      expect(screen.getByText('Data Table')).toBeInTheDocument();
    });

    it('should render snippet descriptions', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      expect(screen.getByText('A simple login form with email and password')).toBeInTheDocument();
      expect(screen.getByText('Display user information in a card')).toBeInTheDocument();
      expect(screen.getByText('A table to display data')).toBeInTheDocument();
    });

    it('should render instructions text', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      expect(
        screen.getByText(/Clique em "Adicionar" para inserir um componente/i)
      ).toBeInTheDocument();
    });

    it('should render "Adicionar" buttons for each snippet', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const buttons = screen.getAllByRole('button', { name: /Adicionar/i });
      expect(buttons).toHaveLength(3);
    });

    it('should apply correct CSS classes', () => {
      const { container } = render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('p-4', 'flex', 'flex-col', 'h-full', 'bg-gray-50');
    });
  });

  describe('Interactions', () => {
    it('should call onAddSnippet when clicking first snippet button', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const buttons = screen.getAllByRole('button', { name: /Adicionar/i });
      fireEvent.click(buttons[0]);

      expect(mockOnAddSnippet).toHaveBeenCalledTimes(1);
      expect(mockOnAddSnippet).toHaveBeenCalledWith('{"type":"form","fields":["email","password"]}');
    });

    it('should call onAddSnippet when clicking second snippet button', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const buttons = screen.getAllByRole('button', { name: /Adicionar/i });
      fireEvent.click(buttons[1]);

      expect(mockOnAddSnippet).toHaveBeenCalledTimes(1);
      expect(mockOnAddSnippet).toHaveBeenCalledWith('{"type":"card","content":"user"}');
    });

    it('should call onAddSnippet when clicking third snippet button', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const buttons = screen.getAllByRole('button', { name: /Adicionar/i });
      fireEvent.click(buttons[2]);

      expect(mockOnAddSnippet).toHaveBeenCalledTimes(1);
      expect(mockOnAddSnippet).toHaveBeenCalledWith('{"type":"table","columns":["name","email","role"]}');
    });

    it('should call onAddSnippet multiple times when clicking different snippets', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const buttons = screen.getAllByRole('button', { name: /Adicionar/i });
      
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[1]);
      fireEvent.click(buttons[2]);

      expect(mockOnAddSnippet).toHaveBeenCalledTimes(3);
    });

    it('should call onAddSnippet multiple times when clicking same snippet', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const buttons = screen.getAllByRole('button', { name: /Adicionar/i });
      
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[0]);

      expect(mockOnAddSnippet).toHaveBeenCalledTimes(3);
      expect(mockOnAddSnippet).toHaveBeenCalledWith('{"type":"form","fields":["email","password"]}');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const buttons = screen.getAllByRole('button', { name: /Adicionar/i });
      buttons.forEach((button) => {
        expect(button).toBeInTheDocument();
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have proper heading structure', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(3);
    });

    it('should have visible text for all headings', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const loginHeading = screen.getByRole('heading', { name: 'Login Form' });
      const cardHeading = screen.getByRole('heading', { name: 'User Card' });
      const tableHeading = screen.getByRole('heading', { name: 'Data Table' });

      expect(loginHeading).toBeVisible();
      expect(cardHeading).toBeVisible();
      expect(tableHeading).toBeVisible();
    });
  });

  describe('Layout', () => {
    it('should render snippets in a vertical layout', () => {
      const { container } = render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const snippetsContainer = container.querySelector('.space-y-3');
      expect(snippetsContainer).toBeInTheDocument();
    });

    it('should render each snippet in a card', () => {
      const { container } = render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const cards = container.querySelectorAll('.bg-white.p-4.rounded-lg');
      expect(cards).toHaveLength(3);
    });

    it('should have overflow scrolling enabled', () => {
      const { container } = render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('overflow-y-auto');
    });
  });

  describe('Edge Cases', () => {
    it('should not crash when onAddSnippet is called with empty snippets', () => {
      jest.resetModules();
      jest.doMock('../../constants', () => ({
        snippets: [],
      }));

      const { Snippets: EmptySnippets } = require('../Snippets');

      const { container } = render(<EmptySnippets onAddSnippet={mockOnAddSnippet} />);

      expect(container).toBeInTheDocument();
    });

    it('should handle rapid consecutive clicks', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const button = screen.getAllByRole('button', { name: /Adicionar/i })[0];
      
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      expect(mockOnAddSnippet).toHaveBeenCalledTimes(10);
    });
  });

  describe('Button Styling', () => {
    it('should have proper button styling classes', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const buttons = screen.getAllByRole('button', { name: /Adicionar/i });
      
      buttons.forEach((button) => {
        expect(button).toHaveClass('px-3', 'py-1', 'bg-blue-600', 'text-white');
      });
    });

    it('should have hover and focus styles', () => {
      render(<Snippets onAddSnippet={mockOnAddSnippet} />);

      const button = screen.getAllByRole('button', { name: /Adicionar/i })[0];
      
      expect(button).toHaveClass('hover:bg-blue-700', 'focus:outline-none');
    });
  });
});
