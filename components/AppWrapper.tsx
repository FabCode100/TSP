'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { BottomTabBar } from './BottomTabBar';
import { FABSheet } from './FABSheet';
import { usePathname } from 'next/navigation';
import { AppProvider, useAppContext } from './AppContext';
import { extractIdentityGraph, extractPatterns } from '@/lib/aiClient';
import { updateGraph, savePatterns, getEntries, getGraphData } from '@/actions/db';

function AppContent({ children }: { children: React.ReactNode }) {
  const [isFABOpen, setIsFABOpen] = useState(false);
  const pathname = usePathname();
  const { addEntry } = useAppContext();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      CapacitorUpdater.notifyAppReady();
      
      // Check for updates every time the app opens
      const checkForUpdate = async () => {
        try {
          // stats for capgo cloud
          await CapacitorUpdater.download({
            url: 'https://api.capgo.app/updates/latest',
            version: 'latest',
          });
        } catch (e) {
          console.log('[Updater] No update found or error:', e);
        }
      };

      checkForUpdate();
    }
  }, []);

  const handleSave = async (text: string, type: string) => {
    await addEntry({
      type: type,
      content: text,
    });
    
    // Process in background
    extractIdentityGraph(text).then(async (graphData) => {
      if (graphData.concepts.length > 0) {
        await updateGraph(graphData.concepts, graphData.edges);
        
        // After updating graph, check if we should extract patterns
        const [entries, currentGraph] = await Promise.all([getEntries(), getGraphData()]);
        if (entries.length % 3 === 0) { // Extract patterns every 3 entries
          const patterns = await extractPatterns(entries.slice(0, 10), currentGraph.nodes.slice(0, 10));
          if (patterns.length > 0) {
            await savePatterns(patterns);
          }
        }
      }
    }).catch(console.error);
  };

  return (
    <>
      <div className={`h-full w-full overflow-y-auto ${pathname !== '/onboarding' && pathname !== '/login' ? 'pb-[calc(60px+env(safe-area-inset-bottom,34px))]' : ''}`}>
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
