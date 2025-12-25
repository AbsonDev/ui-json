
import React from 'react';

interface IDatabaseContext {
  data: Record<string, any[]> | null;
}

export const DatabaseContext = React.createContext<IDatabaseContext>({
  data: null,
});

export const useDatabase = (): IDatabaseContext => {
  const context = React.useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
