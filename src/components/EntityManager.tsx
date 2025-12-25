'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Database, ChevronRight, Table } from 'lucide-react';
import type { EntityResponse, EntityField, EntityFieldType } from '@/types';
import { getEntities, createEntity, updateEntity, deleteEntity } from '@/actions/entities';

interface EntityManagerProps {
  appId: string;
  onSelectEntity?: (entity: EntityResponse) => void;
}

const FIELD_TYPES: { value: EntityFieldType; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'text', label: 'Long Text' },
  { value: 'json', label: 'JSON Object' },
];

export default function EntityManager({ appId, onSelectEntity }: EntityManagerProps) {
  const [entities, setEntities] = useState<EntityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntityResponse | null>(null);

  // Form state
  const [entityName, setEntityName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<EntityField[]>([
    { name: 'id', type: 'string', displayName: 'ID', required: true },
  ]);
  const [timestamps, setTimestamps] = useState(true);
  const [softDelete, setSoftDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEntities();
  }, [appId]);

  async function loadEntities() {
    setLoading(true);
    const result = await getEntities(appId);
    if (result.success && result.entities) {
      setEntities(result.entities);
    }
    setLoading(false);
  }

  function resetForm() {
    setEntityName('');
    setDisplayName('');
    setDescription('');
    setFields([{ name: 'id', type: 'string', displayName: 'ID', required: true }]);
    setTimestamps(true);
    setSoftDelete(false);
    setError('');
    setEditingEntity(null);
  }

  function handleAddField() {
    setFields([
      ...fields,
      {
        name: '',
        type: 'string',
        required: false,
      },
    ]);
  }

  function handleRemoveField(index: number) {
    setFields(fields.filter((_, i) => i !== index));
  }

  function handleFieldChange(index: number, key: keyof EntityField, value: any) {
    const newFields = [...fields];
    (newFields[index] as any)[key] = value;
    setFields(newFields);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      if (editingEntity) {
        const result = await updateEntity(editingEntity.id, {
          displayName,
          description,
          fields,
          timestamps,
          softDelete,
        });

        if (!result.success) {
          setError(result.error || 'Failed to update entity');
          return;
        }
      } else {
        const result = await createEntity(appId, {
          name: entityName,
          displayName: displayName || entityName,
          description,
          fields,
          timestamps,
          softDelete,
        });

        if (!result.success) {
          setError(result.error || 'Failed to create entity');
          return;
        }
      }

      resetForm();
      setShowCreateDialog(false);
      loadEntities();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  }

  async function handleDelete(entityId: string) {
    if (!confirm('Are you sure you want to delete this entity? This action cannot be undone.')) {
      return;
    }

    const result = await deleteEntity(entityId);
    if (result.success) {
      loadEntities();
    } else {
      alert(result.error || 'Failed to delete entity');
    }
  }

  function handleEdit(entity: EntityResponse) {
    setEditingEntity(entity);
    setEntityName(entity.name);
    setDisplayName(entity.displayName || '');
    setDescription(entity.description || '');
    setFields(entity.fields);
    setTimestamps(entity.timestamps);
    setSoftDelete(entity.softDelete);
    setShowCreateDialog(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading entities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          <h2 className="text-xl font-bold">Backend Entities</h2>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Entity
        </button>
      </div>

      {/* Entities List */}
      {entities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No entities yet</h3>
          <p className="text-gray-500 mb-4">Create your first entity to start building your backend</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Entity
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {entities.map((entity) => (
            <div
              key={entity.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => onSelectEntity?.(entity)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Table className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{entity.displayName}</h3>
                    <span className="text-xs text-gray-500">({entity.name})</span>
                  </div>
                  {entity.description && (
                    <p className="text-sm text-gray-600 mb-2">{entity.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{entity.fields.length} fields</span>
                    <span>{entity.recordCount || 0} records</span>
                    {entity.timestamps && <span className="text-green-600">• Timestamps</span>}
                    {entity.softDelete && <span className="text-orange-600">• Soft Delete</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(entity);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit entity"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entity.id);
                    }}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete entity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-bold">
                {editingEntity ? 'Edit Entity' : 'Create New Entity'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Name (PascalCase) *
                  </label>
                  <input
                    type="text"
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    placeholder="Product"
                    disabled={!!editingEntity}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must start with uppercase letter (e.g., Product, User, Order)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Products"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this entity..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Fields */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Fields *</label>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                          placeholder="Field name (camelCase)"
                          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <select
                          value={field.type}
                          onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {FIELD_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={field.displayName || ''}
                          onChange={(e) => handleFieldChange(index, 'displayName', e.target.value)}
                          placeholder="Display name (optional)"
                          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={field.required || false}
                              onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                              className="rounded"
                            />
                            Required
                          </label>
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={field.unique || false}
                              onChange={(e) => handleFieldChange(index, 'unique', e.target.checked)}
                              className="rounded"
                            />
                            Unique
                          </label>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={timestamps}
                    onChange={(e) => setTimestamps(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    Auto-add createdAt and updatedAt timestamps
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={softDelete}
                    onChange={(e) => setSoftDelete(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    Enable soft delete (mark as deleted instead of removing)
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingEntity ? 'Update Entity' : 'Create Entity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
