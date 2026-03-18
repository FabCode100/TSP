'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '@/components/AppContext';

export default function Pulso() {
  const { entries, removeEntry } = useAppContext();

  const handleDragEnd = (event: any, info: any, id: string) => {
    if (info.offset.x < -100) {
      // Archive
      removeEntry(id);
    } else if (info.offset.x > 100) {
      // Pin (just visual feedback for now)
      console.log('Pinned', id);
    }
  };

  return (
    <div className="min-h-full w-full bg-void flex flex-col relative">
      <header className="sticky top-0 z-10 bg-void/80 backdrop-blur-md px-6 pt-12 pb-4">
        <h1 className="font-display text-[28px] text-signal leading-none">Pulso</h1>
        <div className="font-interface text-[12px] text-whisper mt-1 uppercase">
          {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(' de ', ' ').replace('.', '')}
        </div>
      </header>

      <div className="relative flex-1 px-4 py-6">
        {/* Vertical Line */}
        <div className="absolute top-0 bottom-0 left-[16px] w-[1px] bg-pulse/40" />

        <div className="flex flex-col gap-6 relative z-10">
          <AnimatePresence>
            {entries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center font-body italic text-whisper mt-20"
              >
                O silêncio ecoa. Nenhuma entrada registrada.
              </motion.div>
            ) : (
              entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(e, info) => handleDragEnd(e, info, entry.id)}
                  className="relative pl-8"
                >
                  {/* Node on the line */}
                  <div className={`absolute top-1 rounded-full ${entry.isInsight ? 'w-[6px] h-[6px] bg-synapse left-[-2px]' : 'w-[8px] h-[8px] bg-pulse left-[-3px]'} shadow-[0_0_10px_rgba(123,156,255,0.6)]`} />
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-interface text-[11px] text-whisper">{entry.time}</span>
                      <span className={`font-interface text-[10px] px-2 py-0.5 rounded border ${entry.isInsight ? 'text-synapse border-synapse/20 bg-synapse/10' : entry.type === 'SISTEMA' ? 'text-whisper border-whisper/20 bg-whisper/10' : 'text-pulse border-pulse/20 bg-pulse/10'}`}>
                        {entry.type}
                      </span>
                    </div>
                    
                    <div className={`p-4 rounded-[16px] bg-membrane/40 border border-white/5 ${entry.type === 'SISTEMA' ? 'opacity-60' : ''}`}>
                      <p className="font-body text-[16px] text-signal leading-relaxed line-clamp-2">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
