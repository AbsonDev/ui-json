import { handleSubmit } from '../submit-handler';
import { ActionContext } from '../../action-context';
import { UIAction } from '../../../../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('Submit Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Database Submission', () => {
    it('should add record to database table', () => {
      const mockSetCurrentDbData = jest.fn();
      const mockSetFormState = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          nameField: 'John Doe',
          emailField: 'john@example.com',
          ageField: 30,
        },
        setFormState: mockSetFormState,
        currentDbData: {
          users: [{ id: '1', name: 'Existing User' }],
        },
        setCurrentDbData: mockSetCurrentDbData,
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'database',
        table: 'users',
        fields: {
          name: 'nameField',
          email: 'emailField',
          age: 'ageField',
        },
      };

      handleSubmit(action, mockContext);

      const dbCall = mockSetCurrentDbData.mock.calls[0][0];
      expect(dbCall.users).toHaveLength(2);
      expect(dbCall.users[1]).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      });
      expect(dbCall.users[1].id).toBeDefined();

      expect(mockSetFormState).toHaveBeenCalledWith({
        nameField: '',
        emailField: '',
        ageField: '',
      });
    });

    it('should create new table if it does not exist', () => {
      const mockSetCurrentDbData = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          titleField: 'New Post',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: mockSetCurrentDbData,
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'database',
        table: 'posts',
        fields: {
          title: 'titleField',
        },
      };

      handleSubmit(action, mockContext);

      const dbCall = mockSetCurrentDbData.mock.calls[0][0];
      expect(dbCall.posts).toHaveLength(1);
      expect(dbCall.posts[0].title).toBe('New Post');
    });

    it('should call onSuccess action after database submission', () => {
      const mockHandleAction = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          dataField: 'test',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: mockHandleAction,
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'database',
        table: 'items',
        fields: {
          data: 'dataField',
        },
        onSuccess: { type: 'navigate', target: 'success' },
      };

      handleSubmit(action, mockContext);

      expect(mockHandleAction).toHaveBeenCalledWith({
        type: 'navigate',
        target: 'success',
      });
    });

    it('should preserve existing form fields not in submission', () => {
      const mockSetFormState = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          field1: 'value1',
          field2: 'value2',
          field3: 'value3',
        },
        setFormState: mockSetFormState,
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'database',
        table: 'items',
        fields: {
          data: 'field1',
        },
      };

      handleSubmit(action, mockContext);

      expect(mockSetFormState).toHaveBeenCalledWith({
        field1: '',
        field2: 'value2',
        field3: 'value3',
      });
    });

    it('should handle multiple fields mapping', () => {
      const mockSetCurrentDbData = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          input1: 'A',
          input2: 'B',
          input3: 'C',
          input4: 'D',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: mockSetCurrentDbData,
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'database',
        table: 'records',
        fields: {
          field1: 'input1',
          field2: 'input2',
          field3: 'input3',
          field4: 'input4',
        },
      };

      handleSubmit(action, mockContext);

      const dbCall = mockSetCurrentDbData.mock.calls[0][0];
      expect(dbCall.records[0]).toMatchObject({
        field1: 'A',
        field2: 'B',
        field3: 'C',
        field4: 'D',
      });
    });

    it('should not call onSuccess if not provided', () => {
      const mockHandleAction = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          field: 'value',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: mockHandleAction,
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'database',
        table: 'items',
        fields: {
          data: 'field',
        },
      };

      handleSubmit(action, mockContext);

      expect(mockHandleAction).not.toHaveBeenCalled();
    });
  });

  describe('API Submission', () => {
    it('should make POST request to external API', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, id: 123 }),
      });

      const mockSetFormState = jest.fn();
      const mockHandleAction = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          username: 'testuser',
          email: 'test@example.com',
        },
        setFormState: mockSetFormState,
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: mockHandleAction,
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/users',
        method: 'POST',
        fields: {
          username: 'username',
          email: 'email',
        },
        onSuccess: { type: 'navigate', target: 'success' },
      };

      handleSubmit(action, mockContext);

      // Wait for promises
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
        }),
      });

      expect(mockSetFormState).toHaveBeenCalledWith({
        username: '',
        email: '',
      });

      expect(mockHandleAction).toHaveBeenCalledWith({
        type: 'navigate',
        target: 'success',
      });
    });

    it('should make GET request without body', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/data',
        method: 'GET',
      };

      handleSubmit(action, mockContext);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      });
    });

    it('should include custom headers', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          token: 'abc123',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/protected',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
        fields: {
          data: 'token',
        },
      };

      handleSubmit(action, mockContext);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/protected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value',
        },
        body: JSON.stringify({
          data: 'abc123',
        }),
      });
    });

    it('should handle API errors and call onError', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const mockHandleAction = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          email: 'invalid-email',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: mockHandleAction,
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/users',
        fields: {
          email: 'email',
        },
        onError: { type: 'popup', message: 'Erro ao enviar' },
      };

      handleSubmit(action, mockContext);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockHandleAction).toHaveBeenCalledWith({
        type: 'popup',
        message: 'Erro ao enviar',
      });
    });

    it('should handle network errors', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const mockHandleAction = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error');

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          data: 'test',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: mockHandleAction,
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/test',
        fields: {
          data: 'data',
        },
        onError: { type: 'popup', message: 'Erro de rede' },
      };

      handleSubmit(action, mockContext);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'API Error:',
        expect.any(Error)
      );

      expect(mockHandleAction).toHaveBeenCalledWith({
        type: 'popup',
        message: 'Erro de rede',
      });
    });

    it('should use POST as default method', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          data: 'test',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/test',
        fields: {
          data: 'data',
        },
      };

      handleSubmit(action, mockContext);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should not call onSuccess if not provided', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const mockHandleAction = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          data: 'test',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: mockHandleAction,
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/test',
        fields: {
          data: 'data',
        },
      };

      handleSubmit(action, mockContext);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockHandleAction).not.toHaveBeenCalled();
    });

    it('should support PUT and DELETE methods', async () => {
      const mockFetch = global.fetch as jest.Mock;

      // Test PUT
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ updated: true }),
      });

      const putContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: { id: '123', name: 'Updated' },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const putAction: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/items/123',
        method: 'PUT',
        fields: { name: 'name' },
      };

      handleSubmit(putAction, putContext);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/items/123',
        expect.objectContaining({
          method: 'PUT',
        })
      );

      // Test DELETE
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deleted: true }),
      });

      const deleteAction: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/items/123',
        method: 'DELETE',
      };

      handleSubmit(deleteAction, putContext);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/items/123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('API Submission - Advanced Tests', () => {
    it('should handle different HTTP status codes', async () => {
      const mockFetch = global.fetch as jest.Mock;
      const mockHandleAction = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: mockHandleAction,
      };

      // Test 404 Not Found
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const action404: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/not-found',
        onError: { type: 'popup', message: '404 Error' },
      };

      handleSubmit(action404, mockContext);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockHandleAction).toHaveBeenCalledWith({
        type: 'popup',
        message: '404 Error',
      });

      // Test 500 Server Error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const action500: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/error',
        onError: { type: 'popup', message: '500 Error' },
      };

      handleSubmit(action500, mockContext);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockHandleAction).toHaveBeenCalledTimes(2);
    });

    it('should handle non-JSON responses gracefully', async () => {
      const mockFetch = global.fetch as jest.Mock;
      const mockHandleAction = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: mockHandleAction,
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/html',
        onError: { type: 'popup', message: 'Invalid response' },
      };

      handleSubmit(action, mockContext);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockHandleAction).toHaveBeenCalledWith({
        type: 'popup',
        message: 'Invalid response',
      });
    });

    it('should handle empty request body', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/empty',
        method: 'POST',
      };

      handleSubmit(action, mockContext);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/empty',
        expect.objectContaining({
          body: JSON.stringify({}),
        })
      );
    });

    it('should not include body in GET requests', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          query: 'test',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/search',
        method: 'GET',
        fields: {
          q: 'query',
        },
      };

      handleSubmit(action, mockContext);
      await new Promise(resolve => setTimeout(resolve, 0));

      const fetchCall = mockFetch.mock.calls[0][1];
      expect(fetchCall.body).toBeUndefined();
    });

    it('should handle missing endpoint gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        method: 'POST',
      };

      handleSubmit(action, mockContext);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Invalid submit action configuration',
        action
      );
    });

    it('should handle multiple field mappings correctly', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          age: '30',
          city: 'São Paulo',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/users',
        method: 'POST',
        fields: {
          first_name: 'firstName',
          last_name: 'lastName',
          email: 'email',
          age: 'age',
          location: 'city',
        },
      };

      handleSubmit(action, mockContext);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          body: JSON.stringify({
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            age: '30',
            location: 'São Paulo',
          }),
        })
      );
    });

    it('should preserve Content-Type when custom headers are provided', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/data',
        headers: {
          'X-Custom': 'value',
        },
      };

      handleSubmit(action, mockContext);
      await new Promise(resolve => setTimeout(resolve, 0));

      const fetchCall = mockFetch.mock.calls[0][1];
      expect(fetchCall.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      });
    });

    it('should handle PATCH method', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ patched: true }),
      });

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          status: 'active',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      // PATCH não está no tipo, mas vamos testar o comportamento
      const action: any = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/items/1',
        method: 'PATCH',
        fields: {
          status: 'status',
        },
      };

      handleSubmit(action, mockContext);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/items/1',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('should clear only submitted fields on success', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const mockSetFormState = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          name: 'John',
          email: 'john@example.com',
          otherField: 'should-remain',
          anotherField: 'also-remain',
        },
        setFormState: mockSetFormState,
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/submit',
        fields: {
          name: 'name',
          email: 'email',
        },
      };

      handleSubmit(action, mockContext);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockSetFormState).toHaveBeenCalledWith({
        name: '',
        email: '',
        otherField: 'should-remain',
        anotherField: 'also-remain',
      });
    });

    it('should not clear fields on error', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const mockSetFormState = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          name: 'John',
          email: 'invalid-email',
        },
        setFormState: mockSetFormState,
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/submit',
        fields: {
          name: 'name',
          email: 'email',
        },
        onError: { type: 'popup', message: 'Error' },
      };

      handleSubmit(action, mockContext);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Form should NOT be cleared on error
      expect(mockSetFormState).not.toHaveBeenCalled();
    });

    it('should handle concurrent API calls', async () => {
      const mockFetch = global.fetch as jest.Mock;

      // First call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      // Second call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 2 }),
      });

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: { data: 'test' },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action1: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/endpoint1',
      };

      const action2: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/endpoint2',
      };

      // Trigger both calls
      handleSubmit(action1, mockContext);
      handleSubmit(action2, mockContext);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://api.example.com/endpoint1',
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.example.com/endpoint2',
        expect.any(Object)
      );
    });

    it('should handle undefined field values', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          existingField: 'value',
          // nonExistentField is not in formState
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'api',
        endpoint: 'https://api.example.com/submit',
        fields: {
          field1: 'existingField',
          field2: 'nonExistentField',
        },
      };

      handleSubmit(action, mockContext);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/submit',
        expect.objectContaining({
          body: JSON.stringify({
            field1: 'value',
            field2: undefined,
          }),
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle database submission with no table specified', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          field: 'value',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'database',
        fields: {
          data: 'field',
        },
      };

      // Should fall through to API submission path
      expect(() => handleSubmit(action, mockContext)).not.toThrow();
    });

    it('should handle database submission with no fields specified', () => {
      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'database',
        table: 'items',
      };

      // Should fall through to API submission path
      expect(() => handleSubmit(action, mockContext)).not.toThrow();
    });

    it('should generate timestamp-based IDs for database records', () => {
      const mockSetCurrentDbData = jest.fn();

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          field: 'value',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: mockSetCurrentDbData,
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        target: 'database',
        table: 'items',
        fields: {
          data: 'field',
        },
      };

      handleSubmit(action, mockContext);

      const dbCall = mockSetCurrentDbData.mock.calls[0][0];
      const id = dbCall.items[0].id;

      // ID should be a timestamp string
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(Number(id)).toBeGreaterThan(0);
    });
  });
});
