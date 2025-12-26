import { handleSubmit } from '../submit-handler';
import { ActionContext } from '../../action-context';
import { UIAction } from '../../../../types';

// Mock timers for API submission tests
jest.useFakeTimers();

describe('Submit Handler', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // Default to success
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
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
    it('should log API submission data', () => {
      const consoleSpy = jest.spyOn(console, 'log');

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {
          username: 'testuser',
          email: 'test@example.com',
        },
        setFormState: jest.fn(),
        currentDbData: {},
        setCurrentDbData: jest.fn(),
        databaseData: null,
        handleAction: jest.fn(),
      };

      const action: Extract<UIAction, { type: 'submit' }> = {
        type: 'submit',
        endpoint: '/api/users',
        fields: {
          username: 'username',
          email: 'email',
        },
      };

      handleSubmit(action, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Submitting to:',
        '/api/users',
        'with data:',
        {
          username: 'testuser',
          email: 'test@example.com',
        }
      );
    });

    it('should call onSuccess after successful API submission', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5); // Success (> 0.2)
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
        endpoint: '/api/test',
        fields: {
          data: 'data',
        },
        onSuccess: { type: 'navigate', target: 'success' },
      };

      handleSubmit(action, mockContext);

      // Fast-forward timer
      jest.advanceTimersByTime(1000);

      expect(mockHandleAction).toHaveBeenCalledWith({
        type: 'navigate',
        target: 'success',
      });
    });

    it('should call onError after failed API submission', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.1); // Failure (<= 0.2)
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
        endpoint: '/api/test',
        fields: {
          data: 'data',
        },
        onError: { type: 'popup', title: 'Error', message: 'Submission failed' },
      };

      handleSubmit(action, mockContext);

      // Fast-forward timer
      jest.advanceTimersByTime(1000);

      expect(mockHandleAction).toHaveBeenCalledWith({
        type: 'popup',
        title: 'Error',
        message: 'Submission failed',
      });
    });

    it('should not call any action if success but onSuccess not provided', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
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
        endpoint: '/api/test',
        fields: {
          data: 'data',
        },
      };

      handleSubmit(action, mockContext);
      jest.advanceTimersByTime(1000);

      expect(mockHandleAction).not.toHaveBeenCalled();
    });

    it('should not call any action if failure but onError not provided', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.1);
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
        endpoint: '/api/test',
        fields: {
          data: 'data',
        },
      };

      handleSubmit(action, mockContext);
      jest.advanceTimersByTime(1000);

      expect(mockHandleAction).not.toHaveBeenCalled();
    });

    it('should handle API submission without fields', () => {
      const consoleSpy = jest.spyOn(console, 'log');

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
        endpoint: '/api/test',
      };

      handleSubmit(action, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Submitting to:',
        '/api/test',
        'with data:',
        {}
      );
    });

    it('should handle empty formState', () => {
      const consoleSpy = jest.spyOn(console, 'log');

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
        endpoint: '/api/test',
        fields: {
          field1: 'field1',
          field2: 'field2',
        },
      };

      handleSubmit(action, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Submitting to:',
        '/api/test',
        'with data:',
        {
          field1: undefined,
          field2: undefined,
        }
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
