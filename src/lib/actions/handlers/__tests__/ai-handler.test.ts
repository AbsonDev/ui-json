/**
 * Tests for AI Action Handler
 */

import { handleAI } from '../ai-handler';
import { ActionContext } from '../../action-context';
import { AIAction } from '../../../../types';

// Mock fetch
global.fetch = jest.fn();

describe('handleAI', () => {
  let mockContext: ActionContext;

  beforeEach(() => {
    mockContext = {
      handleAction: jest.fn(),
      formState: {
        field1: 'value1',
        field2: 'value2',
      },
      setFormState: jest.fn(),
      currentDbData: {},
      setCurrentDbData: jest.fn(),
      session: { user: { email: 'test@example.com' } },
      setSession: jest.fn(),
      uiApp: {
        version: '1.0',
        app: {
          name: 'Test App',
        },
        screens: {},
        initialScreen: 'home',
      },
      setCurrentScreenId: jest.fn(),
      setPopup: jest.fn(),
    };

    (global.fetch as jest.Mock).mockClear();
  });

  it('should replace placeholders in prompt with form values', async () => {
    const action: AIAction = {
      type: 'ai',
      aiAction: 'suggest',
      prompt: 'Analyze {{field1}} and {{field2}}',
      saveToField: 'result',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'AI response' }),
    });

    await handleAI(action, mockContext);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.prompt).toBe('Analyze value1 and value2');
  });

  it('should send correct aiAction to API', async () => {
    const action: AIAction = {
      type: 'ai',
      aiAction: 'classify',
      prompt: 'Classify this',
      saveToField: 'category',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'Category A' }),
    });

    await handleAI(action, mockContext);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.aiAction).toBe('classify');
  });

  it('should include persona if provided', async () => {
    const action: AIAction = {
      type: 'ai',
      aiAction: 'chat',
      prompt: 'Hello',
      persona: 'You are a helpful assistant',
      saveToField: 'response',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'Hi there' }),
    });

    await handleAI(action, mockContext);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.persona).toBe('You are a helpful assistant');
  });

  it('should include context data', async () => {
    const action: AIAction = {
      type: 'ai',
      aiAction: 'analyze',
      prompt: 'Analyze',
      context: { extra: 'data' },
      saveToField: 'analysis',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'Analysis result' }),
    });

    await handleAI(action, mockContext);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.context.extra).toBe('data');
  });

  it('should save result to specified field', async () => {
    const action: AIAction = {
      type: 'ai',
      aiAction: 'suggest',
      prompt: 'Suggest something',
      saveToField: 'suggestion',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'Great suggestion' }),
    });

    await handleAI(action, mockContext);

    expect(mockContext.setFormState).toHaveBeenCalledWith({
      ...mockContext.formState,
      suggestion: 'Great suggestion',
    });
  });

  it('should execute onSuccess action if provided', async () => {
    const action: AIAction = {
      type: 'ai',
      aiAction: 'chat',
      prompt: 'Hello',
      saveToField: 'response',
      onSuccess: {
        type: 'popup',
        message: 'Success!',
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'Hi' }),
    });

    await handleAI(action, mockContext);

    expect(mockContext.handleAction).toHaveBeenCalledWith(action.onSuccess);
  });

  it('should execute onError action if API fails', async () => {
    const action: AIAction = {
      type: 'ai',
      aiAction: 'analyze',
      prompt: 'Test',
      saveToField: 'result',
      onError: {
        type: 'popup',
        message: 'Error occurred!',
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'API Error' }),
    });

    await handleAI(action, mockContext);

    expect(mockContext.handleAction).toHaveBeenCalledWith(action.onError);
  });

  it('should show default error popup if no onError provided', async () => {
    const action: AIAction = {
      type: 'ai',
      aiAction: 'suggest',
      prompt: 'Test',
      saveToField: 'result',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Something went wrong' }),
    });

    await handleAI(action, mockContext);

    expect(mockContext.setPopup).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Erro na IA',
        variant: 'alert',
      })
    );
  });

  it('should handle network errors gracefully', async () => {
    const action: AIAction = {
      type: 'ai',
      aiAction: 'chat',
      prompt: 'Test',
      saveToField: 'result',
    };

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await handleAI(action, mockContext);

    expect(mockContext.setPopup).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Network error'),
      })
    );
  });

  it('should not execute if no app context', async () => {
    const action: AIAction = {
      type: 'ai',
      aiAction: 'chat',
      prompt: 'Test',
      saveToField: 'result',
    };

    mockContext.uiApp = null;

    await handleAI(action, mockContext);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle multiple placeholders in prompt', async () => {
    mockContext.formState = {
      name: 'John',
      age: '30',
      city: 'New York',
    };

    const action: AIAction = {
      type: 'ai',
      aiAction: 'generate',
      prompt: 'Create profile for {{name}}, age {{age}}, from {{city}}',
      saveToField: 'profile',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'Profile created' }),
    });

    await handleAI(action, mockContext);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.prompt).toBe('Create profile for John, age 30, from New York');
  });

  it('should pass app name as appId', async () => {
    const action: AIAction = {
      type: 'ai',
      aiAction: 'chat',
      prompt: 'Test',
      saveToField: 'result',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'OK' }),
    });

    await handleAI(action, mockContext);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body.appId).toBe('Test App');
  });
});
