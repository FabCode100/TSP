'use client';

import { useState } from 'react';
import { BottomTabBar } from './BottomTabBar';
import { FABSheet } from './FABSheet';
import { usePathname } from 'next/navigation';
import { AppProvider, useAppContext } from './AppContext';

function AppContent({ children }: { children: React.ReactNode }) {
  const [isFABOpen, setIsFABOpen] = useState(false);
  const pathname = usePathname();
  const { addEntry } = useAppContext();

  const handleSave = (text: string, type: string) => {
    setTimeout(() => {
      addEntry({
        type: type as any,
        content: text,
        isInsight: type === 'REFLEXÃO'
      });
    }, 2000);
  };

  return (
    <>
      <div className={`h-full w-full overflow-y-auto ${pathname !== '/onboarding' ? 'pb-[calc(60px+env(safe-area-inset-bottom,34px))]' : ''}`}>
        {children}
      </div>
      <BottomTabBar onFabClick={() => setIsFABOpen(true)} />
      <FABSheet isOpen={isFABOpen} onClose={() => setIsFABOpen(false)} onSave={handleSave} />
    </>
  );
}

export function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppContent>{children}</AppContent>
    </AppProvider>
  );
}
