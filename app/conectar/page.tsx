'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Fingerprint, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { validateShareToken } from '@/actions/db';

const CODE_LENGTH = 6;

export default function Conectar() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentArchives, setRecentArchives] = useState<any[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    // Load recent archives from localStorage
    try {
      const saved = localStorage.getItem('tsp_recent_twins');
      if (saved) setRecentArchives(JSON.parse(saved));
    } catch (e) {}
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^[a-fA-F0-9]*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.toUpperCase().slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, CODE_LENGTH);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function handleConnect() {
    const token = code.join('');
    if (token.length !== CODE_LENGTH) {
      setError('Provide the complete hexadecimal signature.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await validateShareToken(token);
      if (result) {
        // Save to recent archives
        const archive = {
          token,
          name: `Twin_${token}`,
          status: 'ACTIVE LINK',
          accessedAt: new Date().toISOString(),
        };
        const updated = [archive, ...recentArchives.filter(a => a.token !== token)].slice(0, 10);
        localStorage.setItem('tsp_recent_twins', JSON.stringify(updated));
        router.push(`/explorar?token=${token}`);
      } else {
        setError('Invalid Signature Detected. Please verify credentials.');
      }
    } catch (e) {
      setError('Connection failed. Please try again.');
    }
    setLoading(false);
  }

  function formatAccessTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="h-[100dvh] bg-[#050508] text-[#E8E4D9] flex flex-col overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-[#7B9CFF]/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-[#A78BFA]/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="shrink-0 sticky top-0 z-50 bg-[#050508] flex justify-between items-center px-6 py-4 border-b border-[#444652]/10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/emergente')} className="text-[#7B9CFF] hover:opacity-80 transition-opacity">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <h1 className="font-['Cormorant_Garamond'] text-2xl font-light italic">Connect Twin</h1>
        </div>
        <span className="font-['DM_Mono'] text-[10px] uppercase tracking-tight text-[#E8E4D9]/60">v.2.0.4</span>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-12 w-full mx-auto">
        {/* Header Section */}
        <section className="mb-12 text-center">
          <h2 className="font-['Cormorant_Garamond'] text-3xl md:text-5xl mb-4 leading-tight">Enter Access Protocol</h2>
          <p className="text-[#E8E4D9]/60 font-serif text-base md:text-lg italic">
            Provide the unique hexadecimal signature to synchronize with your emergent twin.
          </p>
        </section>

        {/* Code Input */}
        <section className="mb-16 space-y-6">
          <div className="grid grid-cols-6 gap-2 w-[95%] max-w-[340px] mx-auto" onPaste={handlePaste}>
            {code.map((char, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={char}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-full aspect-square bg-[#1b1b1f] border border-[#444652]/20 rounded-xl text-center text-xl md:text-3xl text-[#7B9CFF] font-['DM_Mono'] outline-none focus:border-[#7B9CFF]/50 transition-all p-0"
              />
            ))}
          </div>

          {/* Error State */}
          <div className={`h-6 text-center transition-opacity ${error ? 'opacity-100' : 'opacity-0'}`}>
            <p className="font-['DM_Mono'] text-xs uppercase tracking-widest text-[#ffb4ab]">{error}</p>
          </div>

          {/* Connect Button */}
          <div className="flex flex-col items-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleConnect}
              disabled={loading}
              className="relative px-12 py-4 bg-[#7B9CFF] text-[#002a78] font-['DM_Mono'] text-sm uppercase tracking-widest rounded-full overflow-hidden disabled:opacity-50 transition-all"
            >
              {loading ? 'Connecting...' : 'Conectar'}
            </motion.button>
          </div>
        </section>

        {/* Discover Public Archives */}
        <section className="mb-16">
          <div className="flex justify-between items-end mb-6">
            <h3 className="font-['Cormorant_Garamond'] text-3xl italic">Discover</h3>
            <span className="font-['DM_Mono'] text-[10px] text-[#7B9CFF] uppercase tracking-widest">Public Archives</span>
          </div>
          <button 
            onClick={() => router.push('/publicos')}
            className="w-full flex items-center p-5 bg-gradient-to-r from-[#7B9CFF]/10 to-transparent border border-[#7B9CFF]/20 rounded-2xl hover:bg-[#7B9CFF]/20 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-[#7B9CFF] flex items-center justify-center mr-5 shadow-[0_0_15px_rgba(123,156,255,0.3)]">
              <Sparkles size={20} className="text-[#050508]" />
            </div>
            <div className="flex-grow text-left">
              <h4 className="font-['Cormorant_Garamond'] text-xl leading-tight">Master Node Archives</h4>
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[#E8E4D9]/40 mt-1">Explore Musk, Jobs & more</p>
            </div>
            <ChevronRight size={20} className="text-[#7B9CFF]" />
          </button>
        </section>

        {/* Recent Archives */}
        {recentArchives.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-8">
              <h3 className="font-['Cormorant_Garamond'] text-3xl italic">Recent Archives</h3>
              <span className="font-['DM_Mono'] text-[10px] text-[#E8E4D9]/40 uppercase tracking-tight">
                Total: {String(recentArchives.length).padStart(2, '0')} Entities
              </span>
            </div>

            <div className="space-y-4">
              {recentArchives.map((archive, i) => (
                <motion.div
                  key={archive.token}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/explorar?token=${archive.token}`)}
                  className="group flex items-center p-5 bg-[#1b1b1f] hover:bg-[#2a292e] rounded-xl transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-[rgba(123,156,255,0.05)] backdrop-blur-[20px] flex items-center justify-center mr-5 border border-[#7B9CFF]/10">
                    <Fingerprint size={20} className="text-[#A78BFA]" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-['Cormorant_Garamond'] text-xl leading-tight truncate">{archive.name}</h4>
                    <div className="flex items-center gap-3">
                      <span className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[#7B9CFF]">Active Link</span>
                      <span className="w-1 h-1 rounded-full bg-[#E8E4D9]/20" />
                      <span className="font-['DM_Mono'] text-[10px] uppercase text-[#E8E4D9]/40">
                        Accessed: {formatAccessTime(archive.accessedAt)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[#E8E4D9]/20 group-hover:text-[#7B9CFF] transition-colors" />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
