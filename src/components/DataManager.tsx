'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EntityResponse, EntityDataResponse, EntityField } from '@/types';
import {
  getEntityData,
  createEntityData,
  updateEntityData,
  deleteEntityData,
  restoreEntityData,
} from '@/actions/entity-data';

interface DataManagerProps {
  entity: EntityResponse;
  onBack: () => void;
}

export default function DataManager({ entity, onBack }: DataManagerProps) {
  const [records, setRecords] = useState<EntityDataResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EntityDataResponse | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  useEffect(() => {
    loadRecords();
  }, [entity.id, pagination.offset]);

  async function loadRecords() {
    setLoading(true);
    const result = await getEntityData(entity.id, {
      limit: pagination.limit,
      offset: pagination.offset,
    });

    if (result.success && result.data && result.pagination) {
      setRecords(result.data);
      setPagination(result.pagination);
    }
    setLoading(false);
  }

  function resetForm() {
    const defaults: Record<string, any> = {};
    entity.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      } else {
        switch (field.type) {
          case 'string':
          case 'email':
          case 'url':
          case 'text':
            defaults[field.name] = '';
            break;
          case 'number':
            defaults[field.name] = 0;
            break;
          case 'boolean':
            defaults[field.name] = false;
            break;
          default:
            defaults[field.name] = '';
        }
      }
    });
    setFormData(defaults);
    setError('');
    setEditingRecord(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      if (editingRecord) {
        const result = await updateEntityData(editingRecord.id, { data: formData });
        if (!result.success) {
          setError(result.error || 'Failed to update record');
          if ((result as any).validationErrors) {
            setError(Object.values((result as any).validationErrors).join(', '));
          }
          return;
        }
      } else {
        const result = await createEntityData(entity.id, { data: formData });
        if (!result.success) {
          setError(result.error || 'Failed to create record');
          if ((result as any).validationErrors) {
            setError(Object.values((result as any).validationErrors).join(', '));
          }
          return;
        }
      }

      resetForm();
      setShowDialog(false);
      loadRecords();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  }

  async function handleDelete(recordId: string) {
    if (!confirm('Are you sure you want to delete this record?')) {
      return;
    }

    const result = await deleteEntityData(recordId);
    if (result.success) {
      loadRecords();
    } else {
      alert(result.error || 'Failed to delete record');
    }
  }

  async function handleRestore(recordId: string) {
    const result = await restoreEntityData(recordId);
    if (result.success) {
      loadRecords();
    } else {
      alert(result.error || 'Failed to restore record');
    }
  }

  function handleEdit(record: EntityDataResponse) {
    setEditingRecord(record);
    setFormData({ ...record.data });
    setShowDialog(true);
  }

  function renderFieldInput(field: EntityField) {
    const value = formData[field.name] ?? '';

    switch (field.type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
            className="rounded"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: parseFloat(e.target.value) || 0 })}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'text':
        return (
          <textarea
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'json':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setFormData({ ...formData, [field.name]: parsed });
              } catch {
                setFormData({ ...formData, [field.name]: e.target.value });
              }
            }}
            placeholder={field.placeholder || '{}'}
            required={field.required}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        );

      default:
        return (
          <input
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  }

  function renderCellValue(field: EntityField, value: any) {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    switch (field.type) {
      case 'boolean':
        return (
          <span className={`px-2 py-1 rounded text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {value ? 'true' : 'false'}
          </span>
        );
      case 'json':
        return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
      case 'text':
        return <span className="text-sm line-clamp-2">{value}</span>;
      default:
        return <span className="text-sm">{String(value)}</span>;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading records...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold">{entity.displayName}</h2>
            <p className="text-sm text-gray-500">{pagination.total} records</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Record
        </button>
      </div>

      {/* Table */}
      {records.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No records yet</h3>
          <p className="text-gray-500 mb-4">Create your first record to start adding data</p>
          <button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Record
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {entity.fields.map((field) => (
                    <th key={field.name} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {field.displayName || field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className={`hover:bg-gray-50 ${record.deletedAt ? 'opacity-50' : ''}`}>
                    {entity.fields.map((field) => (
                      <td key={field.name} className="px-4 py-3">
                        {renderCellValue(field, record.data[field.name])}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record.deletedAt ? (
                          <button
                            onClick={() => handleRestore(record.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Restore"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(record)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} records
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) })}
                  disabled={pagination.offset === 0}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
                  disabled={!pagination.hasMore}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-bold">
                {editingRecord ? 'Edit Record' : 'Create New Record'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              {entity.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.displayName || field.name}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderFieldInput(field)}
                  {field.helpText && (
                    <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowDialog(false);
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
                  {editingRecord ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
