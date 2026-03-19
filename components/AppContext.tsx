'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getEntries, addEntry as dbAddEntry, removeEntry as dbRemoveEntry, getAuthToken } from '@/actions/db';

export type Entry = {
  id: string;
  time: string;
  type: string;
  content: string;
  isInsight?: boolean;
};

type AppContextType = {
  entries: Entry[];
  addEntry: (entry: { content: string; type: string }) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  refreshEntries: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);

  const refreshEntries = async () => {
    const token = await getAuthToken();
    if (!token) {
        console.log('[AppContext] No token found, skipping refreshEntries');
        return;
    }
    
    try {
      const data = await getEntries();
      const formatted = data.map((e: any) => ({
        id: e.id,
        time: new Date(e.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: e.type,
        content: e.content,
        isInsight: e.type === 'INSIGHT',
      }));
      setEntries(formatted);
    } catch (error) {
       console.error('[AppContext] Failed to refresh entries:', error);
    }
  };

  useEffect(() => {
    refreshEntries();
  }, []);

  const addEntry = async (entry: { content: string; type: string }) => {
    await dbAddEntry(entry.content, entry.type);
    await refreshEntries();
  };

  const removeEntry = async (id: string) => {
    await dbRemoveEntry(id);
    await refreshEntries();
  };

  return (
    <AppContext.Provider value={{ entries, addEntry, removeEntry, refreshEntries }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
