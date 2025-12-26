import { useState, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../lib/constants/storage-keys';

/**
 * Hook for managing database state
 * Handles local database data with localStorage persistence
 */
export function useDatabaseState() {
  const [databaseData, setDatabaseData] = useState<Record<number, Record<string, any[]>>>(() => {
    const savedData = localStorage.getItem(STORAGE_KEYS.DATABASE);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse saved database data from localStorage', e);
        return {};
      }
    }
    return {};
  });

  // Effect to save database data to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DATABASE, JSON.stringify(databaseData));
  }, [databaseData]);

  const getAppData = useCallback((appIndex: number) => {
    return databaseData[appIndex] || {};
  }, [databaseData]);

  const setAppData = useCallback((appIndex: number, data: Record<string, any[]>) => {
    setDatabaseData(prev => ({ ...prev, [appIndex]: data }));
  }, []);

  const updateTable = useCallback((
    appIndex: number,
    tableName: string,
    records: any[]
  ) => {
    setDatabaseData(prev => ({
      ...prev,
      [appIndex]: {
        ...(prev[appIndex] || {}),
        [tableName]: records,
      },
    }));
  }, []);

  const addRecord = useCallback((
    appIndex: number,
    tableName: string,
    record: any
  ) => {
    setDatabaseData(prev => {
      const appData = prev[appIndex] || {};
      const table = appData[tableName] || [];
      return {
        ...prev,
        [appIndex]: {
          ...appData,
          [tableName]: [...table, record],
        },
      };
    });
  }, []);

  const deleteRecord = useCallback((
    appIndex: number,
    tableName: string,
    recordId: string
  ) => {
    setDatabaseData(prev => {
      const appData = prev[appIndex] || {};
      const table = appData[tableName] || [];
      return {
        ...prev,
        [appIndex]: {
          ...appData,
          [tableName]: table.filter(r => r.id !== recordId),
        },
      };
    });
  }, []);

  return {
    databaseData,
    setDatabaseData,
    getAppData,
    setAppData,
    updateTable,
    addRecord,
    deleteRecord,
  };
}
