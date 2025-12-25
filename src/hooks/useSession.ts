import React from 'react';

interface ISessionContext {
  session: { user: any } | null;
}

export const SessionContext = React.createContext<ISessionContext>({
  session: null,
});

export const useSession = (): ISessionContext => {
  const context = React.useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
