'use client';

import { motion } from 'motion/react';
import { Activity, Brain, Circle, CircleDashed, Menu, Plus, Sparkles, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export function BottomTabBar({ onFabClick }: { onFabClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/' || pathname === '/onboarding' || pathname === '/login') return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[60px] pb-[env(safe-area-inset-bottom,34px)] bg-deep/90 border-t border-threshold/50 backdrop-blur-md z-40 flex items-center justify-between px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex flex-1 items-center justify-around pr-4">
        <button onClick={() => router.push('/pulso')} className={`p-2 transition-colors ${pathname === '/pulso' ? 'text-pulse' : 'text-whisper'}`}>
          <Activity size={24} strokeWidth={1.5} />
        </button>
        <button onClick={() => router.push('/nucleo')} className={`p-2 transition-colors ${pathname === '/nucleo' ? 'text-pulse' : 'text-whisper'}`}>
          <Brain size={24} strokeWidth={1.5} />
        </button>
      </div>
      
      <div className="relative -top-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/emergente')}
          className="w-[64px] h-[64px] rounded-full bg-pulse text-void flex items-center justify-center shadow-[0_8px_32px_rgba(123,156,255,0.3)]"
        >
          <Sparkles size={32} strokeWidth={1.5} />
        </motion.button>
      </div>

      <div className="flex flex-1 items-center justify-around pl-4">
        <button onClick={() => router.push('/espelho')} className={`p-2 transition-colors ${pathname === '/espelho' ? 'text-pulse' : 'text-whisper'}`}>
          <div className="relative w-6 h-6 flex items-center justify-center">
            <div className="absolute w-5 h-5 rounded-full border-[1.5px] border-current" />
            <div className="absolute w-2 h-2 rounded-full bg-current top-1 right-1" />
          </div>
        </button>

        <button onClick={() => router.push('/perfil')} className={`p-2 transition-colors ${pathname === '/perfil' ? 'text-pulse' : 'text-whisper'}`}>
          <User size={24} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
