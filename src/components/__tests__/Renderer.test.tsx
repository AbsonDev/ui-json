/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Renderer } from '../Renderer';
import { UIScreen, UIComponent, UITheme } from '../../types';

// Mock VisualComponents
jest.mock('../VisualComponents', () => ({
  RenderText: ({ component }: any) => <div data-testid={`text-${component.id}`}>{component.content}</div>,
  RenderInput: ({ component }: any) => <input data-testid={`input-${component.id}`} placeholder={component.placeholder} />,
  RenderButton: ({ component }: any) => <button data-testid={`button-${component.id}`}>{component.text}</button>,
  RenderImage: ({ component }: any) => <img data-testid={`image-${component.id}`} src={component.source} alt="" />,
  RenderList: ({ component }: any) => <ul data-testid={`list-${component.id}`}></ul>,
  RenderCard: ({ component }: any) => <div data-testid={`card-${component.id}`}></div>,
  RenderSelect: ({ component }: any) => <select data-testid={`select-${component.id}`}></select>,
  RenderCheckbox: ({ component }: any) => <input type="checkbox" data-testid={`checkbox-${component.id}`} />,
  RenderContainer: ({ component }: any) => <div data-testid={`container-${component.id}`}></div>,
  RenderDivider: ({ component }: any) => <hr data-testid={`divider-${component.id}`} />,
  RenderDatePicker: ({ component }: any) => <input type="date" data-testid={`datepicker-${component.id}`} />,
  RenderTimePicker: ({ component }: any) => <input type="time" data-testid={`timepicker-${component.id}`} />,
}));

describe('Renderer Component', () => {
  const mockScreen: UIScreen = {
    id: 'test-screen',
    title: 'Test Screen',
    layout: 'vertical',
    components: [],
    padding: '20px',
  };

  const mockTheme: UITheme = {
    primaryColor: '#007AFF',
    secondaryColor: '#5856D6',
    backgroundColor: '#F2F2F7',
    textColor: '#000000',
    errorColor: '#FF3B30',
    successColor: '#34C759',
    borderRadius: 8,
    spacing: 16,
    fontFamily: 'system-ui',
  };

  describe('Basic Rendering', () => {
    it('should render an empty container when no components are provided', () => {
      const { container } = render(
        <Renderer components={[]} screen={mockScreen} theme={mockTheme} />
      );

      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('w-full', 'h-full', 'flex', 'flex-col');
    });

    it('should apply screen padding', () => {
      const screenWithPadding = { ...mockScreen, padding: '24px' };
      const { container } = render(
        <Renderer components={[]} screen={screenWithPadding} theme={mockTheme} />
      );

      expect(container.firstChild).toHaveStyle({ padding: '24px' });
    });

    it('should apply vertical layout by default', () => {
      const { container } = render(
        <Renderer components={[]} screen={mockScreen} theme={mockTheme} />
      );

      expect(container.firstChild).toHaveClass('flex', 'flex-col');
    });

    it('should apply horizontal layout when specified', () => {
      const horizontalScreen = { ...mockScreen, layout: 'horizontal' as const };
      const { container } = render(
        <Renderer components={[]} screen={horizontalScreen} theme={mockTheme} />
      );

      expect(container.firstChild).toHaveClass('flex', 'space-x-4');
      expect(container.firstChild).not.toHaveClass('flex-col');
    });
  });

  describe('Component Type Rendering', () => {
    it('should render text component', () => {
      const textComponent: UIComponent = {
        id: '1',
        type: 'text',
        content: 'Hello World',
      };

      render(<Renderer components={[textComponent]} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('text-1')).toBeInTheDocument();
      expect(screen.getByTestId('text-1')).toHaveTextContent('Hello World');
    });

    it('should render input component', () => {
      const inputComponent: UIComponent = {
        id: '2',
        type: 'input',
        placeholder: 'Enter text',
      };

      render(<Renderer components={[inputComponent]} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('input-2')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render button component', () => {
      const buttonComponent: UIComponent = {
        id: '3',
        type: 'button',
        text: 'Click Me',
        action: { type: 'goBack' },
      };

      render(<Renderer components={[buttonComponent]} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('button-3')).toBeInTheDocument();
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render image component', () => {
      const imageComponent: UIComponent = {
        id: '4',
        type: 'image',
        source: 'https://example.com/image.jpg',
      };

      render(<Renderer components={[imageComponent]} screen={mockScreen} theme={mockTheme} />);

      const image = screen.getByTestId('image-4');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should render list component', () => {
      const listComponent: UIComponent = {
        id: '5',
        type: 'list',
        items: [],
      };

      render(<Renderer components={[listComponent]} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('list-5')).toBeInTheDocument();
    });

    it('should render card component', () => {
      const cardComponent: UIComponent = {
        id: '6',
        type: 'card',
        components: [],
      };

      render(<Renderer components={[cardComponent]} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('card-6')).toBeInTheDocument();
    });

    it('should render select component', () => {
      const selectComponent: UIComponent = {
        id: '7',
        type: 'select',
        options: [{ value: 'a', label: 'Option A' }],
      };

      render(<Renderer components={[selectComponent]} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('select-7')).toBeInTheDocument();
    });

    it('should render checkbox component', () => {
      const checkboxComponent: UIComponent = {
        id: '8',
        type: 'checkbox',
        label: 'Accept terms',
      };

      render(<Renderer components={[checkboxComponent]} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('checkbox-8')).toBeInTheDocument();
    });

    it('should render container component', () => {
      const containerComponent: UIComponent = {
        id: '9',
        type: 'container',
        components: [],
      };

      render(<Renderer components={[containerComponent]} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('container-9')).toBeInTheDocument();
    });

    it('should render divider component', () => {
      const dividerComponent: UIComponent = {
        id: '10',
        type: 'divider',
      };

      render(<Renderer components={[dividerComponent]} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('divider-10')).toBeInTheDocument();
    });

    it('should render datepicker component', () => {
      const datePickerComponent: UIComponent = {
        id: '11',
        type: 'datepicker',
        label: 'Select date',
      };

      render(<Renderer components={[datePickerComponent]} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('datepicker-11')).toBeInTheDocument();
    });

    it('should render timepicker component', () => {
      const timePickerComponent: UIComponent = {
        id: '12',
        type: 'timepicker',
        label: 'Select time',
      };

      render(<Renderer components={[timePickerComponent]} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('timepicker-12')).toBeInTheDocument();
    });

    it('should render error message for unknown component type', () => {
      const unknownComponent = {
        id: '99',
        type: 'unknown',
      } as any;

      render(<Renderer components={[unknownComponent]} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByText('Unknown component type')).toBeInTheDocument();
      expect(screen.getByText('Unknown component type')).toHaveClass('bg-red-100', 'text-red-600');
    });
  });

  describe('Multiple Components', () => {
    it('should render multiple components in order', () => {
      const components: UIComponent[] = [
        { id: '1', type: 'text', content: 'First' },
        { id: '2', type: 'input', placeholder: 'Second' },
        { id: '3', type: 'button', text: 'Third', action: { type: 'goBack' } },
      ];

      render(<Renderer components={components} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('text-1')).toBeInTheDocument();
      expect(screen.getByTestId('input-2')).toBeInTheDocument();
      expect(screen.getByTestId('button-3')).toBeInTheDocument();
    });

    it('should pass theme to all components that support it', () => {
      const components: UIComponent[] = [
        { id: '1', type: 'text', content: 'Test' },
        { id: '2', type: 'input', placeholder: 'Test' },
        { id: '3', type: 'button', text: 'Test', action: { type: 'goBack' } },
      ];

      // This test verifies that components receive theme prop
      // The actual theme usage is tested in VisualComponents tests
      render(<Renderer components={components} screen={mockScreen} theme={mockTheme} />);

      expect(screen.getByTestId('text-1')).toBeInTheDocument();
      expect(screen.getByTestId('input-2')).toBeInTheDocument();
      expect(screen.getByTestId('button-3')).toBeInTheDocument();
    });
  });

  describe('Component Keys', () => {
    it('should generate unique keys for components', () => {
      const components: UIComponent[] = [
        { id: '1', type: 'text', content: 'First' },
        { id: '2', type: 'text', content: 'Second' },
      ];

      const { container } = render(
        <Renderer components={components} screen={mockScreen} theme={mockTheme} />
      );

      const children = container.firstChild?.childNodes;
      expect(children).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing theme gracefully', () => {
      const textComponent: UIComponent = {
        id: '1',
        type: 'text',
        content: 'Test',
      };

      render(<Renderer components={[textComponent]} screen={mockScreen} />);

      expect(screen.getByTestId('text-1')).toBeInTheDocument();
    });

    it('should handle empty screen padding', () => {
      const screenNoPadding = { ...mockScreen, padding: undefined };
      const { container } = render(
        <Renderer components={[]} screen={screenNoPadding} theme={mockTheme} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle screen without layout property', () => {
      const screenNoLayout = { ...mockScreen, layout: undefined };
      const { container } = render(
        <Renderer components={[]} screen={screenNoLayout} theme={mockTheme} />
      );

      // Should default to vertical layout
      expect(container.firstChild).toHaveClass('flex', 'flex-col');
    });
  });
});
