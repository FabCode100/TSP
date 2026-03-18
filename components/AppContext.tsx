'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type Entry = {
  id: string;
  time: string;
  type: 'ENTRADA LIVRE' | 'INSIGHT' | 'SISTEMA' | 'MOMENTO' | 'REFLEXÃO' | 'DECISÃO';
  content: string;
  isInsight?: boolean;
};

const mockEntries: Entry[] = [
  { id: '1', time: '22:45', type: 'ENTRADA LIVRE', content: 'O silêncio não é ausência de som, mas a presença de si mesmo.' },
  { id: '2', time: '19:12', type: 'INSIGHT', content: 'Padrão recorrente identificado: introspecção após estímulo visual.', isInsight: true },
  { id: '3', time: '14:20', type: 'SISTEMA', content: 'Conexão neural estável. Processamento de dados ambientais em curso.' },
  { id: '4', time: '10:05', type: 'ENTRADA LIVRE', content: 'A fragmentação é o prelúdio da síntese.' },
  { id: '5', time: '08:30', type: 'INSIGHT', content: 'Tensão entre o desejo de isolamento e a necessidade de conexão.', isInsight: true },
];

type AppContextType = {
  entries: Entry[];
  addEntry: (entry: Omit<Entry, 'id' | 'time'>) => void;
  removeEntry: (id: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>(mockEntries);

  const addEntry = (entry: Omit<Entry, 'id' | 'time'>) => {
    const newEntry: Entry = {
      ...entry,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setEntries(prev => [newEntry, ...prev]);
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <AppContext.Provider value={{ entries, addEntry, removeEntry }}>
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
