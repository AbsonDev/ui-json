import React, { useState, useEffect, useCallback } from 'react';
import { UIApp } from '../types';
import { Trash2, Plus, FilePenLine } from 'lucide-react';

interface DatabaseEditorProps {
  uiApp: UIApp | null;
  data: Record<string, any[]>;
  onSchemaChange: (newSchema: any) => void;
  onDataChange: (newData: Record<string, any[]>) => void;
}

const getInputTypeForField = (fieldSchema: any) => {
    switch(fieldSchema?.type) {
        case 'date': return 'date';
        case 'time': return 'time';
        case 'number': return 'number';
        case 'boolean': return 'checkbox';
        default: return 'text';
    }
}


// --- Visual Schema Editor Component ---
const VisualSchemaEditor: React.FC<{ schema: any, onSchemaChange: (s: any) => void }> = ({ schema, onSchemaChange }) => {
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<{ type: 'table' | 'field'; table: string; field?: string; value: string } | null>(null);

    useEffect(() => {
        // If a table is selected but no longer exists in the schema, deselect it
        if (selectedTable && schema && !schema[selectedTable]) {
            const remainingTables = Object.keys(schema);
            setSelectedTable(remainingTables.length > 0 ? remainingTables[0] : null);
        }
        // If no table is selected and there are tables, select the first one
        else if (!selectedTable && schema && Object.keys(schema).length > 0) {
            setSelectedTable(Object.keys(schema)[0]);
        }
    }, [schema, selectedTable]);

    const handleAddTable = () => {
        const newTableName = `new_table_${Object.keys(schema || {}).length + 1}`;
        const newSchema = {
            ...(schema || {}),
            [newTableName]: {
                fields: {
                    id: { type: 'string', primaryKey: true }
                }
            }
        };
        onSchemaChange(newSchema);
        setSelectedTable(newTableName);
    };

    const handleDeleteTable = (tableName: string) => {
        const newSchema = { ...schema };
        delete newSchema[tableName];
        onSchemaChange(newSchema);
    };
    
    const handleAddField = (tableName: string) => {
        const newFieldName = `new_field_${Object.keys(schema[tableName].fields).length + 1}`;
        const newSchema = JSON.parse(JSON.stringify(schema)); // Deep copy
        newSchema[tableName].fields[newFieldName] = { type: 'string' };
        onSchemaChange(newSchema);
    }
    
    const handleDeleteField = (tableName: string, fieldName: string) => {
         const newSchema = JSON.parse(JSON.stringify(schema)); // Deep copy
         delete newSchema[tableName].fields[fieldName];
         onSchemaChange(newSchema);
    }

    const handleFieldPropChange = (tableName: string, fieldName: string, prop: string, value: any) => {
        const newSchema = JSON.parse(JSON.stringify(schema)); // Deep copy
        newSchema[tableName].fields[fieldName][prop] = value;
        onSchemaChange(newSchema);
    }

    const handleNameChange = (newName: string) => {
        if (!editingName || !newName.trim()) {
            setEditingName(null);
            return;
        };
        
        const newSchema = JSON.parse(JSON.stringify(schema)); // Deep copy
        
        if (editingName.type === 'table') {
            if (newName !== editingName.table && !newSchema[newName]) {
                const tableData = newSchema[editingName.table];
                delete newSchema[editingName.table];
                newSchema[newName] = tableData;
                if (selectedTable === editingName.table) {
                    setSelectedTable(newName);
                }
            }
        } else if (editingName.type === 'field') {
            const { table, field } = editingName;
            if (newName !== field && !newSchema[table].fields[newName]) {
                const fieldData = newSchema[table].fields[field!];
                delete newSchema[table].fields[field!];
                newSchema[table].fields[newName] = fieldData;
            }
        }

        onSchemaChange(newSchema);
        setEditingName(null);
    }
    

    return (
        <div className="flex flex-1 bg-white p-2 pb-6 gap-2">
            {/* Tables Panel */}
            <div className="w-1/3 border rounded-md p-2 flex flex-col gap-2">
                <h3 className="font-semibold text-sm text-gray-700 flex-shrink-0">Tabelas</h3>
                <div className="space-y-1 overflow-y-auto flex-grow">
                    {schema && Object.keys(schema).map(tableName => (
                         <div
                            key={tableName}
                            onClick={() => !(editingName?.type === 'table' && editingName.table === tableName) && setSelectedTable(tableName)}
                            className={`group flex justify-between items-center p-2 rounded-md cursor-pointer text-sm ${selectedTable === tableName ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100'}`}
                        >
                            {editingName?.type === 'table' && editingName.table === tableName ? (
                                <input
                                    type="text"
                                    autoFocus
                                    defaultValue={tableName}
                                    onBlur={(e) => handleNameChange(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditingName(null); }}
                                    onClick={e => e.stopPropagation()}
                                    className="w-full bg-transparent focus:outline-none focus:bg-gray-100 p-1 rounded text-gray-900"
                                />
                            ) : (
                                <span className="text-gray-900 truncate">{tableName}</span>
                            )}
                            
                            {!(editingName?.type === 'table' && editingName.table === tableName) && (
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingName({ type: 'table', table: tableName, value: tableName }); }} className="text-gray-600 hover:text-gray-800"><FilePenLine size={14} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTable(tableName); }} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                 <button onClick={handleAddTable} className="flex-shrink-0 flex items-center justify-center gap-2 w-full text-sm px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100">
                    <Plus size={16}/> Adicionar Tabela
                </button>
            </div>

            {/* Fields Panel */}
            <div className="w-2/3 border rounded-md p-2">
                {selectedTable && schema?.[selectedTable] ? (
                    <div className="flex flex-col h-full">
                        <h3 className="font-semibold mb-2 text-sm text-gray-700">Campos da Tabela: <span className="font-bold text-blue-700">{selectedTable}</span></h3>
                        <div className="flex-1 overflow-y-auto">
                           <table className="w-full text-sm">
                               <thead className="text-left text-xs text-gray-500 uppercase">
                                   <tr>
                                       <th className="p-2 w-[25%]">Nome do Campo</th>
                                       <th className="p-2 w-[40%]">Descrição</th>
                                       <th className="p-2 w-[25%]">Tipo</th>
                                       <th className="p-2 text-center">PK</th>
                                       <th className="p-2">Ações</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {Object.entries(schema[selectedTable].fields).map(([fieldName, fieldConfig]: [string, any]) => (
                                       <tr key={fieldName} className="border-b">
                                           <td className="p-2">
                                               <input type="text" defaultValue={fieldName} onBlur={(e) => handleNameChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                                                 onFocus={() => setEditingName({ type: 'field', table: selectedTable, field: fieldName, value: fieldName })}
                                                 className="w-full bg-transparent focus:outline-none focus:bg-gray-100 p-1 rounded text-gray-900" />
                                           </td>
                                           <td className="p-2">
                                                <input 
                                                    type="text" 
                                                    defaultValue={fieldConfig.description || ''}
                                                    onBlur={(e) => handleFieldPropChange(selectedTable, fieldName, 'description', e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                                                    placeholder="Adicionar descrição..."
                                                    className="w-full bg-transparent focus:outline-none focus:bg-gray-100 p-1 rounded text-gray-900 placeholder:text-gray-400 placeholder:text-xs" />
                                           </td>
                                           <td className="p-2">
                                               <select value={fieldConfig.type} onChange={e => handleFieldPropChange(selectedTable, fieldName, 'type', e.target.value)}
                                                className="w-full p-1 border rounded-md bg-white text-gray-900">
                                                   <option>string</option>
                                                   <option>number</option>
                                                   <option>boolean</option>
                                                   <option>date</option>
                                                   <option>time</option>
                                               </select>
                                           </td>
                                           <td className="p-2 text-center">
                                               <input type="checkbox" checked={!!fieldConfig.primaryKey} onChange={e => handleFieldPropChange(selectedTable, fieldName, 'primaryKey', e.target.checked)}
                                               className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                                           </td>
                                           <td className="p-2">
                                               <button onClick={() => handleDeleteField(selectedTable, fieldName)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                        </div>
                        <button onClick={() => handleAddField(selectedTable)} className="mt-2 flex items-center justify-center gap-2 w-full text-sm px-3 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100">
                           <Plus size={16}/> Adicionar Campo
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">Selecione uma tabela para ver seus campos.</div>
                )}
            </div>
        </div>
    );
};


export const DatabaseEditor: React.FC<DatabaseEditorProps> = ({ uiApp, data, onSchemaChange, onDataChange }) => {
  const [activeDbTab, setActiveDbTab] = useState<'schema' | 'data'>('data');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [schemaText, setSchemaText] = useState('');
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [schemaEditMode, setSchemaEditMode] = useState<'visual' | 'json'>('visual');

  const schema = uiApp?.app.databaseSchema;

  useEffect(() => {
    if (schema && !selectedTable && Object.keys(schema).length > 0) {
      setSelectedTable(Object.keys(schema)[0]);
    } else if (schema && Object.keys(schema).length > 0 && selectedTable && !schema[selectedTable]) {
      setSelectedTable(Object.keys(schema)[0]);
    } else if (!schema || Object.keys(schema).length === 0) {
      setSelectedTable(null);
    }
  }, [schema, selectedTable]);
  
  useEffect(() => {
    const currentSchema = uiApp?.app.databaseSchema;
    const currentSchemaString = currentSchema ? JSON.stringify(currentSchema, null, 2) : '';
    if (currentSchemaString !== schemaText) {
        setSchemaText(currentSchemaString);
    }
    setSchemaError(null);
  }, [uiApp]);

  const handleSchemaTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setSchemaText(newText);

    if (newText.trim() === '') {
        onSchemaChange({});
        setSchemaError(null);
        return;
    }

    try {
      const newSchema = JSON.parse(newText);
      onSchemaChange(newSchema);
      setSchemaError(null);
    } catch (error) {
      setSchemaError("Invalid JSON format. Please correct it.");
    }
  };

  const handleDataChange = (table: string, rowIndex: number, field: string, value: any) => {
    onDataChange({
        ...data,
        [table]: (data[table] || []).map((row, index) => 
            index === rowIndex ? { ...row, [field]: value } : row
        )
    });
  };
  
  const handleAddRow = (table: string) => {
      const newRow: Record<string, any> = { id: Date.now().toString() };
      const fields = schema?.[table]?.fields || {};
      for (const field in fields) {
        if(field !== 'id') {
            newRow[field] = fields[field].default ?? '';
        }
      }
      onDataChange({
        ...data,
        [table]: [...(data[table] || []), newRow]
      });
  };
  
  const handleDeleteRow = (table: string, rowIndex: number) => {
      onDataChange({
        ...data,
        [table]: (data[table] || []).filter((_, index) => index !== rowIndex),
      });
  };


  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-b-lg">
      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveDbTab('data')} className={`px-4 py-2 text-sm font-medium ${activeDbTab === 'data' ? 'bg-white font-semibold text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>
          Data
        </button>
        <button onClick={() => setActiveDbTab('schema')} className={`px-4 py-2 text-sm font-medium ${activeDbTab === 'schema' ? 'bg-white font-semibold text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>
          Schema
        </button>
      </div>

      {activeDbTab === 'schema' ? (
        <div className="flex-1 flex flex-col">
            <div className="p-2 border-b bg-gray-50 flex justify-end">
                <div className="flex items-center text-sm p-0.5 bg-gray-200 rounded-md">
                    <button onClick={() => setSchemaEditMode('visual')} className={`px-3 py-1 rounded ${schemaEditMode === 'visual' ? 'bg-white shadow-sm' : ''}`}>Visual</button>
                    <button onClick={() => setSchemaEditMode('json')} className={`px-3 py-1 rounded ${schemaEditMode === 'json' ? 'bg-white shadow-sm' : ''}`}>JSON</button>
                </div>
            </div>
            {schemaEditMode === 'visual' ? (
                <VisualSchemaEditor schema={schema} onSchemaChange={onSchemaChange} />
            ) : (
                <div className="p-2 flex-1 flex flex-col">
                    <textarea
                        value={schemaText}
                        onChange={handleSchemaTextChange}
                        className={`w-full flex-1 p-2 font-mono text-sm bg-white text-gray-800 border rounded-md resize-none focus:outline-none ${schemaError ? 'border-red-500' : 'border-gray-300'}`}
                        spellCheck="false"
                        placeholder="Define your database schema here..."
                    />
                    {schemaError && <div className="p-1 bg-red-100 text-red-700 text-xs font-mono">{schemaError}</div>}
                </div>
            )}
        </div>
      ) : (
        <div className="p-2 flex-1 flex flex-col overflow-auto">
          {!schema || Object.keys(schema).length === 0 ? (
            <div className="text-center text-gray-500 p-8">No schema defined. Go to the 'Schema' tab to create one.</div>
          ) : (
            <>
              <div className="mb-2">
                <select 
                    value={selectedTable || ''} 
                    onChange={e => setSelectedTable(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                >
                  {Object.keys(schema).map(tableName => (
                    <option key={tableName} value={tableName}>{tableName}</option>
                  ))}
                </select>
              </div>
              {selectedTable && schema[selectedTable] && (
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                      <tr>
                        {Object.keys(schema[selectedTable].fields).map(field => (
                          <th key={field} scope="col" className="px-4 py-2">{field}</th>
                        ))}
                        <th scope="col" className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data[selectedTable] || []).map((row, rowIndex) => (
                        <tr key={row.id || rowIndex} className="bg-white border-b hover:bg-gray-50">
                          {Object.keys(schema[selectedTable].fields).map(field => {
                            const fieldSchema = schema[selectedTable].fields[field];
                            const inputType = getInputTypeForField(fieldSchema);
                            
                            if (inputType === 'checkbox') {
                                return (
                                    <td key={field} className="px-4 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={!!row[field]}
                                            onChange={(e) => handleDataChange(selectedTable, rowIndex, field, e.target.checked)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </td>
                                );
                            }

                            return (
                                <td key={field} className="px-4 py-2">
                                    <input
                                        type={inputType}
                                        value={row[field] || ''}
                                        onChange={(e) => handleDataChange(selectedTable, rowIndex, field, e.target.value)}
                                        className="w-full bg-transparent focus:outline-none focus:bg-gray-100 p-1 rounded text-gray-900"
                                    />
                                </td>
                            );
                          })}
                          <td className="px-4 py-2">
                            <button onClick={() => handleDeleteRow(selectedTable, rowIndex)} className="text-red-500 hover:text-red-700 p-1">
                                <Trash2 size={16}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button 
                    onClick={() => handleAddRow(selectedTable)} 
                    className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700"
                   >
                    Add Row
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};