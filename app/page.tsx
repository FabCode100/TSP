'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { getOrCreateUser } from '@/actions/db';

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Start auth check immediately
    const authPromise = getOrCreateUser();
    
    // Minimum splash duration: 2.5s
    const timer = setTimeout(async () => {
      const user = await authPromise;
      if (user.id === 'guest') {
        router.push('/login');
      } else if (user.onboarding) {
        router.push('/pulso');
      } else {
        router.push('/onboarding');
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="h-full w-full bg-[#050508] flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center"
          >
            {/* Logo Animation */}
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [0.8, 1.1, 1],
                  opacity: 1,
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  times: [0, 0.5, 0.8, 1],
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                <img 
                  src="/icon-192.png" 
                  alt="Logo" 
                  className="w-32 h-32 md:w-40 md:h-40 object-contain filter drop-shadow-[0_0_20px_rgba(123,156,255,0.6)]" 
                />
              </motion.div>
              
              {/* Outer Rings */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border border-[#7B9CFF]/30"
              />
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                className="absolute inset-0 rounded-full border border-[#A78BFA]/20"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
