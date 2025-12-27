import { handleDeleteRecord } from '../database-handler';
import { ActionContext } from '../../action-context';
import { UIAction } from '../../../../types';

describe('Database Handler', () => {
  describe('handleDeleteRecord', () => {
    it('should delete record from table', () => {
      const mockSetCurrentDbData = jest.fn();
      const currentDbData = {
        users: [
          { id: '1', name: 'User 1' },
          { id: '2', name: 'User 2' },
          { id: '3', name: 'User 3' },
        ],
      };

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        currentDbData,
        setCurrentDbData: mockSetCurrentDbData,
      };

      const action: Extract<UIAction, { type: 'deleteRecord' }> = {
        type: 'deleteRecord',
        table: 'users',
        recordId: '2',
      };

      handleDeleteRecord(action, mockContext);

      expect(mockSetCurrentDbData).toHaveBeenCalledWith({
        users: [
          { id: '1', name: 'User 1' },
          { id: '3', name: 'User 3' },
        ],
      });
      expect(mockSetCurrentDbData).toHaveBeenCalledTimes(1);
    });

    it('should preserve other tables when deleting from one table', () => {
      const mockSetCurrentDbData = jest.fn();
      const currentDbData = {
        users: [
          { id: '1', name: 'User 1' },
          { id: '2', name: 'User 2' },
        ],
        posts: [
          { id: '1', title: 'Post 1' },
          { id: '2', title: 'Post 2' },
        ],
      };

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        currentDbData,
        setCurrentDbData: mockSetCurrentDbData,
      };

      const action: Extract<UIAction, { type: 'deleteRecord' }> = {
        type: 'deleteRecord',
        table: 'users',
        recordId: '1',
      };

      handleDeleteRecord(action, mockContext);

      expect(mockSetCurrentDbData).toHaveBeenCalledWith({
        users: [{ id: '2', name: 'User 2' }],
        posts: [
          { id: '1', title: 'Post 1' },
          { id: '2', title: 'Post 2' },
        ],
      });
    });

    it('should handle deleting from non-existent table', () => {
      const mockSetCurrentDbData = jest.fn();
      const currentDbData = {
        users: [{ id: '1', name: 'User 1' }],
      };

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        currentDbData,
        setCurrentDbData: mockSetCurrentDbData,
      };

      const action: Extract<UIAction, { type: 'deleteRecord' }> = {
        type: 'deleteRecord',
        table: 'nonexistent',
        recordId: '1',
      };

      handleDeleteRecord(action, mockContext);

      expect(mockSetCurrentDbData).toHaveBeenCalledWith({
        users: [{ id: '1', name: 'User 1' }],
        nonexistent: [],
      });
    });

    it('should handle deleting non-existent record', () => {
      const mockSetCurrentDbData = jest.fn();
      const currentDbData = {
        users: [
          { id: '1', name: 'User 1' },
          { id: '2', name: 'User 2' },
        ],
      };

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        currentDbData,
        setCurrentDbData: mockSetCurrentDbData,
      };

      const action: Extract<UIAction, { type: 'deleteRecord' }> = {
        type: 'deleteRecord',
        table: 'users',
        recordId: '999',
      };

      handleDeleteRecord(action, mockContext);

      // Should return same array since record doesn't exist
      expect(mockSetCurrentDbData).toHaveBeenCalledWith({
        users: [
          { id: '1', name: 'User 1' },
          { id: '2', name: 'User 2' },
        ],
      });
    });

    it('should handle deleting last record from table', () => {
      const mockSetCurrentDbData = jest.fn();
      const currentDbData = {
        users: [{ id: '1', name: 'Only User' }],
      };

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        currentDbData,
        setCurrentDbData: mockSetCurrentDbData,
      };

      const action: Extract<UIAction, { type: 'deleteRecord' }> = {
        type: 'deleteRecord',
        table: 'users',
        recordId: '1',
      };

      handleDeleteRecord(action, mockContext);

      expect(mockSetCurrentDbData).toHaveBeenCalledWith({
        users: [],
      });
    });

    it('should handle empty table', () => {
      const mockSetCurrentDbData = jest.fn();
      const currentDbData = {
        users: [],
      };

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        currentDbData,
        setCurrentDbData: mockSetCurrentDbData,
      };

      const action: Extract<UIAction, { type: 'deleteRecord' }> = {
        type: 'deleteRecord',
        table: 'users',
        recordId: '1',
      };

      handleDeleteRecord(action, mockContext);

      expect(mockSetCurrentDbData).toHaveBeenCalledWith({
        users: [],
      });
    });

    it('should handle records with complex data', () => {
      const mockSetCurrentDbData = jest.fn();
      const currentDbData = {
        products: [
          {
            id: '1',
            name: 'Product 1',
            price: 100,
            metadata: { category: 'electronics', tags: ['new', 'sale'] },
          },
          {
            id: '2',
            name: 'Product 2',
            price: 200,
            metadata: { category: 'clothing', tags: ['summer'] },
          },
        ],
      };

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        currentDbData,
        setCurrentDbData: mockSetCurrentDbData,
      };

      const action: Extract<UIAction, { type: 'deleteRecord' }> = {
        type: 'deleteRecord',
        table: 'products',
        recordId: '1',
      };

      handleDeleteRecord(action, mockContext);

      expect(mockSetCurrentDbData).toHaveBeenCalledWith({
        products: [
          {
            id: '2',
            name: 'Product 2',
            price: 200,
            metadata: { category: 'clothing', tags: ['summer'] },
          },
        ],
      });
    });

    it('should handle numeric string IDs', () => {
      const mockSetCurrentDbData = jest.fn();
      const currentDbData = {
        items: [
          { id: '1', value: 'A' },
          { id: '10', value: 'B' },
          { id: '100', value: 'C' },
        ],
      };

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        currentDbData,
        setCurrentDbData: mockSetCurrentDbData,
      };

      const action: Extract<UIAction, { type: 'deleteRecord' }> = {
        type: 'deleteRecord',
        table: 'items',
        recordId: '10',
      };

      handleDeleteRecord(action, mockContext);

      expect(mockSetCurrentDbData).toHaveBeenCalledWith({
        items: [
          { id: '1', value: 'A' },
          { id: '100', value: 'C' },
        ],
      });
    });

    it('should handle UUID-style IDs', () => {
      const mockSetCurrentDbData = jest.fn();
      const uuid1 = '550e8400-e29b-41d4-a716-446655440000';
      const uuid2 = '550e8400-e29b-41d4-a716-446655440001';
      const currentDbData = {
        entities: [
          { id: uuid1, name: 'Entity 1' },
          { id: uuid2, name: 'Entity 2' },
        ],
      };

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        currentDbData,
        setCurrentDbData: mockSetCurrentDbData,
      };

      const action: Extract<UIAction, { type: 'deleteRecord' }> = {
        type: 'deleteRecord',
        table: 'entities',
        recordId: uuid1,
      };

      handleDeleteRecord(action, mockContext);

      expect(mockSetCurrentDbData).toHaveBeenCalledWith({
        entities: [{ id: uuid2, name: 'Entity 2' }],
      });
    });

    it('should handle table names with special characters', () => {
      const mockSetCurrentDbData = jest.fn();
      const currentDbData = {
        'table-with-dashes': [
          { id: '1', data: 'test1' },
          { id: '2', data: 'test2' },
        ],
      };

      const mockContext: ActionContext = {
        setCurrentScreenId: jest.fn(),
        uiApp: null,
        formState: {},
        setFormState: jest.fn(),
        databaseData: null,
        currentDbData,
        setCurrentDbData: mockSetCurrentDbData,
      };

      const action: Extract<UIAction, { type: 'deleteRecord' }> = {
        type: 'deleteRecord',
        table: 'table-with-dashes',
        recordId: '1',
      };

      handleDeleteRecord(action, mockContext);

      expect(mockSetCurrentDbData).toHaveBeenCalledWith({
        'table-with-dashes': [{ id: '2', data: 'test2' }],
      });
    });
  });
});
