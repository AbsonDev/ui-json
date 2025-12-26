/**
 * Tests for AI Components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RenderAIChat, RenderAIAssistant, RenderAIAnalyzer } from '../AIComponents';

// Mock fetch
global.fetch = jest.fn();

describe('RenderAIChat', () => {
  const defaultProps = {
    id: 'chat',
    appId: 'test-app',
    formData: {},
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render chat component with welcome message', () => {
    render(
      <RenderAIChat
        {...defaultProps}
        welcomeMessage="Hello! How can I help?"
      />
    );

    expect(screen.getByText('Assistente IA')).toBeInTheDocument();
    expect(screen.getByText('Hello! How can I help?')).toBeInTheDocument();
  });

  it('should render input and send button', () => {
    render(<RenderAIChat {...defaultProps} />);

    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    expect(input).toBeInTheDocument();
    expect(sendButton).toBeInTheDocument();
  });

  it('should send message when button clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'AI response' }),
    });

    render(<RenderAIChat {...defaultProps} />);

    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai/execute',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Hello AI'),
        })
      );
    });
  });

  it('should display user and AI messages', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'AI response here' }),
    });

    render(<RenderAIChat {...defaultProps} />);

    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    // User message should appear immediately
    expect(await screen.findByText('Test message')).toBeInTheDocument();

    // AI response should appear after fetch
    expect(await screen.findByText('AI response here')).toBeInTheDocument();
  });

  it('should show error when API fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'API Error' }),
    });

    render(<RenderAIChat {...defaultProps} />);

    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(sendButton);

    expect(await screen.findByText(/API Error/i)).toBeInTheDocument();
  });

  it('should clear input after sending', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'OK' }),
    });

    render(<RenderAIChat {...defaultProps} />);

    const input = screen.getByPlaceholderText('Digite sua mensagem...') as HTMLInputElement;
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Test' } });
    expect(input.value).toBe('Test');

    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should send message on Enter key press', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'OK' }),
    });

    render(<RenderAIChat {...defaultProps} />);

    const input = screen.getByPlaceholderText('Digite sua mensagem...');

    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

describe('RenderAIAssistant', () => {
  const defaultProps = {
    id: 'assistant',
    appId: 'test-app',
    prompt: 'Analyze {{field1}}',
    inputFields: ['field1'],
    outputField: 'result',
    formData: { field1: 'test value' },
    onFieldChange: jest.fn(),
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    defaultProps.onFieldChange.mockClear();
  });

  it('should render button with default text', () => {
    render(<RenderAIAssistant {...defaultProps} />);

    expect(screen.getByText('Obter Sugestão da IA')).toBeInTheDocument();
  });

  it('should render button with custom text', () => {
    render(
      <RenderAIAssistant
        {...defaultProps}
        buttonText="Custom Button Text"
      />
    );

    expect(screen.getByText('Custom Button Text')).toBeInTheDocument();
  });

  it('should call API with replaced placeholders', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'Suggestion' }),
    });

    render(<RenderAIAssistant {...defaultProps} />);

    const button = screen.getByText('Obter Sugestão da IA');
    fireEvent.click(button);

    await waitFor(() => {
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.prompt).toContain('test value');
    });
  });

  it('should display result after successful analysis', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'AI Suggestion Result' }),
    });

    render(<RenderAIAssistant {...defaultProps} />);

    const button = screen.getByText('Obter Sugestão da IA');
    fireEvent.click(button);

    expect(await screen.findByText('AI Suggestion Result')).toBeInTheDocument();
  });

  it('should call onFieldChange with result', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'AI Result' }),
    });

    render(<RenderAIAssistant {...defaultProps} />);

    const button = screen.getByText('Obter Sugestão da IA');
    fireEvent.click(button);

    await waitFor(() => {
      expect(defaultProps.onFieldChange).toHaveBeenCalledWith('result', 'AI Result');
    });
  });

  it('should show loading state while processing', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ result: 'OK' }),
      }), 100))
    );

    render(<RenderAIAssistant {...defaultProps} loadingText="Processing..." />);

    const button = screen.getByText('Obter Sugestão da IA');
    fireEvent.click(button);

    expect(await screen.findByText('Processing...')).toBeInTheDocument();
  });

  it('should show error on API failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Analysis failed' }),
    });

    render(<RenderAIAssistant {...defaultProps} />);

    const button = screen.getByText('Obter Sugestão da IA');
    fireEvent.click(button);

    expect(await screen.findByText(/Analysis failed/i)).toBeInTheDocument();
  });
});

describe('RenderAIAnalyzer', () => {
  const defaultProps = {
    id: 'analyzer',
    appId: 'test-app',
    analyzeType: 'sentiment' as const,
    sourceField: 'text',
    resultField: 'sentiment',
    formData: { text: 'This is great!' },
    onFieldChange: jest.fn(),
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    defaultProps.onFieldChange.mockClear();
  });

  it('should render analyze button when autoAnalyze is false', () => {
    render(<RenderAIAnalyzer {...defaultProps} autoAnalyze={false} />);

    expect(screen.getByText('Analisar com IA')).toBeInTheDocument();
  });

  it('should call API with sentiment analysis prompt', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'POSITIVO' }),
    });

    render(<RenderAIAnalyzer {...defaultProps} autoAnalyze={false} />);

    const button = screen.getByText('Analisar com IA');
    fireEvent.click(button);

    await waitFor(() => {
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.prompt).toContain('sentimento');
      expect(callBody.aiAction).toBe('analyze');
    });
  });

  it('should display analysis result', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'POSITIVO' }),
    });

    render(<RenderAIAnalyzer {...defaultProps} autoAnalyze={false} />);

    const button = screen.getByText('Analisar com IA');
    fireEvent.click(button);

    expect(await screen.findByText('POSITIVO')).toBeInTheDocument();
  });

  it('should call onFieldChange with result', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'POSITIVO' }),
    });

    render(<RenderAIAnalyzer {...defaultProps} autoAnalyze={false} />);

    const button = screen.getByText('Analisar com IA');
    fireEvent.click(button);

    await waitFor(() => {
      expect(defaultProps.onFieldChange).toHaveBeenCalledWith('sentiment', 'POSITIVO');
    });
  });

  it('should use correct prompt for category analysis', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'Technology' }),
    });

    render(
      <RenderAIAnalyzer
        {...defaultProps}
        analyzeType="category"
        autoAnalyze={false}
      />
    );

    const button = screen.getByText('Analisar com IA');
    fireEvent.click(button);

    await waitFor(() => {
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.prompt).toContain('Classifique');
    });
  });

  it('should use correct prompt for summary analysis', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'Short summary' }),
    });

    render(
      <RenderAIAnalyzer
        {...defaultProps}
        analyzeType="summary"
        autoAnalyze={false}
      />
    );

    const button = screen.getByText('Analisar com IA');
    fireEvent.click(button);

    await waitFor(() => {
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.prompt).toContain('Resuma');
    });
  });
});
