'use client';

import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, ChevronRight, Brain, Zap, Cpu, History } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PUBLIC_FIGURES = [
  {
    id: 'elon',
    name: 'Elon Musk',
    role: 'Technological Visionary',
    icon: <Zap size={24} className="text-[#7B9CFF]" />,
    imageUrl: "https://i.imgur.com/eO9Buny.jpeg",
    bio: "Focus on multi-planetary life and AI safety.",
    color: "#7B9CFF"
  },
  {
    id: 'jobs',
    name: 'Steve Jobs',
    role: 'Visionary Designer',
    icon: <Cpu size={24} className="text-[#A78BFA]" />,
    imageUrl: "https://i.imgur.com/iwjrSkA.jpeg",
    bio: "Design is not just what it looks like and feels like. Design is how it works.",
    color: "#A78BFA"
  },
  {
    id: 'lovelace',
    name: 'Ada Lovelace',
    role: 'The First Archivist',
    icon: <History size={24} className="text-[#7B9CFF]" />,
    imageUrl: "https://i.imgur.com/nO36Icx.jpeg",
    bio: "The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves.",
    color: "#7B9CFF"
  },
  {
    id: 'marcus',
    name: 'Marco Aurélio',
    role: 'Stoic Emperor',
    icon: <Brain size={24} className="text-[#E8E4D9]" />,
    imageUrl: "https://i.imgur.com/mA2V9jJ.jpeg",
    bio: "Waste no more time arguing about what a good man should be. Be one.",
    color: "#E8E4D9"
  }
];

export default function Publicos() {
  const router = useRouter();

  return (
    <div className="h-[100dvh] bg-[#050508] text-[#E8E4D9] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-50 bg-[#050508] border-b border-[#444652]/10">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-[#7B9CFF] hover:opacity-80 transition-opacity">
              <ArrowLeft size={24} strokeWidth={1.5} />
            </button>
            <h1 className="font-['Cormorant_Garamond'] font-light text-2xl italic">Public Archives</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#7B9CFF]/10 rounded-full border border-[#7B9CFF]/20">
            <Sparkles size={12} className="text-[#7B9CFF]" />
            <span className="font-['DM_Mono'] text-[9px] uppercase tracking-widest text-[#7B9CFF]">Master Nodes</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-12 space-y-12 max-w-2xl mx-auto w-full">
        <section className="space-y-4 text-center">
          <h2 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-light leading-tight">Sync with Great Minds</h2>
          <p className="text-[#E8E4D9]/40 font-serif text-lg italic max-w-md mx-auto">
            Explore the synthetic reflections of individuals who dented the universe.
          </p>
        </section>

        <div className="grid gap-6">
          {PUBLIC_FIGURES.map((figure, i) => (
            <motion.div
              key={figure.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push(`/explorar?public=${figure.id}`)}
              className="group relative bg-[#1b1b1f] rounded-2xl p-6 cursor-pointer overflow-hidden border border-[#444652]/5 hover:border-[#7B9CFF]/30 transition-all shadow-lg"
            >
              {/* Background Glow */}
              <div 
                className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: figure.color }}
              />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#050508] border border-[#444652]/20 flex items-center justify-center overflow-hidden relative group-hover:scale-110 transition-transform shadow-inner">
                    {figure.imageUrl ? (
                      <img 
                        src={figure.imageUrl} 
                        alt={figure.name} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#0d0d12]">
                        {figure.icon}
                      </div>
                    )}
                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/40 to-transparent" />
                  </div>
                  <div>
                    <h3 className="font-['Cormorant_Garamond'] text-2xl font-light">{figure.name}</h3>
                    <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[#7B9CFF]">
                      {figure.role}
                    </p>
                  </div>
                </div>
                <ChevronRight size={24} className="text-[#E8E4D9]/10 group-hover:text-[#7B9CFF] transition-colors" />
              </div>

              <div className="mt-6 pt-6 border-t border-[#444652]/5">
                <p className="font-serif italic text-[#E8E4D9]/60 leading-relaxed text-sm">
                  "{figure.bio}"
                </p>
              </div>

              <div className="mt-4 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#7B9CFF]" />
                  <span className="font-['DM_Mono'] text-[8px] uppercase tracking-tighter text-[#E8E4D9]/30">High Fidelity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#A78BFA]" />
                  <span className="font-['DM_Mono'] text-[8px] uppercase tracking-tighter text-[#E8E4D9]/30">Public Domain</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>


        <section className="pt-8 text-center border-t border-[#444652]/10">
          <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.3em] text-[#E8E4D9]/20">
            More archives being decrypted...
          </p>
        </section>
      </main>
    </div>
  );
}
