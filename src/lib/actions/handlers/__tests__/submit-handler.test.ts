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
