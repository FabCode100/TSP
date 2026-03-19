'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Send, Clock, MessageSquare, LogOut } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSharedTwinProfile, sendSharedTwinMessage, endSharedSession } from '@/actions/db';

export default function ExplorarTwin() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<{ role: 'twin' | 'visitor'; content: string; time: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionStart] = useState(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (!token) return;
    loadProfile();
  }, [token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function loadProfile() {
    if (!token) return;
    const p = await getSharedTwinProfile(token);
    if (!p) {
      setError('Token inválido ou expirado.');
      setLoading(false);
      return;
    }
    setProfile(p);
    setLoading(false);
  }

  async function handleSend() {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'visitor', content: userMsg, time: now() }]);
    setIsTyping(true);

    try {
      let currentResponse = '';
      setMessages(prev => [...prev, { role: 'twin', content: '', time: now() }]);

      if (!token) return;
      for await (const chunk of sendSharedTwinMessage(token, userMsg)) {
        currentResponse += chunk;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = currentResponse;
          return newMsgs;
        });
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'twin', content: 'Conexão com o núcleo falhou momentaneamente.', time: now() }]);
    } finally {
      setIsTyping(false);
    }
  }

  async function handleEndSession() {
    if (!token) return;
    const duration = Math.floor((Date.now() - sessionStart) / 1000);
    const msgCount = messages.filter(m => m.role === 'visitor').length;
    await endSharedSession(token, 'Visitante', duration, msgCount);
    router.push('/conectar');
  }

  function formatDuration() {
    const secs = Math.floor((Date.now() - sessionStart) / 1000);
    const mins = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainSecs).padStart(2, '0')}`;
  }

  // Update timer every second
  const [timer, setTimer] = useState('00:00');
  useEffect(() => {
    const interval = setInterval(() => setTimer(formatDuration()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Sparkles size={32} className="text-[#7B9CFF] mx-auto" />
          </motion.div>
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[#E8E4D9]/40">Synchronizing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center text-[#E8E4D9]">
        <div className="text-center space-y-4">
          <p className="font-['Cormorant_Garamond'] text-2xl">{error}</p>
          <button onClick={() => router.push('/conectar')} className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[#7B9CFF]">
            Return to Connect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#050508] text-[#e5e1e7] font-serif flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-16 w-full z-50 flex justify-between items-center px-4 bg-[#131317]">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#7B9CFF] shrink-0" />
          <span className="text-sm md:text-xl font-light tracking-[0.1em] md:tracking-[0.2em] font-['Cormorant_Garamond'] uppercase truncate">
            EMERGENT TWIN
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-['DM_Mono'] uppercase text-[9px] md:text-xs tracking-tighter text-[#E8E4D9]/60">v8.4</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-8" ref={scrollRef}>
        <div className="max-w-2xl mx-auto flex flex-col w-full overflow-x-hidden">
          {/* Profile Header */}
          <section className="mb-12 w-full">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#2a292e] border border-[#444652]/20 flex items-center justify-center text-2xl md:text-3xl font-['Cormorant_Garamond'] tracking-widest text-[#7B9CFF]">
                  {profile?.ownerName?.substring(0, 2).toUpperCase() || 'TW'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-[#7B9CFF] rounded-full border-4 border-[#050508] flex items-center justify-center">
                  <Sparkles size={10} className="text-[#050508]" />
                </div>
              </div>
              <div className="space-y-1 w-full overflow-hidden">
                <h1 className="text-2xl md:text-4xl font-['Cormorant_Garamond'] font-light tracking-wide break-words px-2">
                  Twin de {profile?.ownerName}
                </h1>
                <div className="inline-flex items-center px-3 py-1 bg-[rgba(123,156,255,0.1)] rounded-full">
                  <span className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[#7B9CFF]">
                    Nível: {profile?.permissionLevel}
                  </span>
                </div>
              </div>
              <div className="flex gap-8 md:gap-12 pt-4">
                <div className="flex flex-col">
                  <span className="font-['DM_Mono'] text-[10px] uppercase tracking-tighter text-[#e5e1e7]/40">Maturidade</span>
                  <span className="font-['DM_Mono'] text-lg md:text-xl text-[#7B9CFF]">{profile?.maturity || 0}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-['DM_Mono'] text-[10px] uppercase tracking-tighter text-[#e5e1e7]/40">Nodes</span>
                  <span className="font-['DM_Mono'] text-lg md:text-xl text-[#A78BFA]">{profile?.nodeCount?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Chat Messages */}
          <section className="flex-grow space-y-8 mb-12">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <p className="font-['DM_Mono'] text-[10px] uppercase tracking-widest text-[#e5e1e7]/30">
                  Inicie o diálogo para emergir
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'visitor' ? 'items-end' : 'items-start'} max-w-[85%] ${msg.role === 'visitor' ? 'ml-auto' : ''}`}
              >
                <span className="font-['DM_Mono'] text-[10px] uppercase tracking-widest mb-2 ml-4 mr-4" style={{
                  color: msg.role === 'twin' ? '#7B9CFF' : 'rgba(229,225,231,0.4)'
                }}>
                  {msg.role === 'twin' ? 'Twin' : 'Visitante'} [{msg.time}]
                </span>
                <div className={msg.role === 'twin'
                  ? 'bg-[#1f1f23] rounded-tr-xl rounded-br-xl rounded-bl-xl px-4 md:px-6 py-4 md:py-5'
                  : 'bg-[#1b1b1f] border border-[#444652]/10 rounded-tl-xl rounded-bl-xl rounded-br-xl px-4 md:px-6 py-4 md:py-5'
                }>
                  <p className={msg.role === 'twin'
                    ? "font-['Cormorant_Garamond'] italic text-lg md:text-xl leading-relaxed text-[#e5e1e7]/90 break-words"
                    : "font-serif text-sm md:text-base break-words"
                  }>
                    {msg.content || '...'}
                  </p>
                </div>
              </motion.div>
            ))}
          </section>

          {/* Session Tracker */}
          {messages.length > 0 && (
            <div className="sticky bottom-4 z-40 flex justify-center pointer-events-none px-4">
              <div className="bg-[rgba(123,156,255,0.08)] backdrop-blur-[24px] px-3 md:px-4 py-2 rounded-full border border-[#7B9CFF]/20 flex items-center gap-4 md:gap-6 pointer-events-auto">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-[#7B9CFF]" />
                  <span className="font-['DM_Mono'] text-[9px] md:text-[10px] uppercase text-[#e5e1e7]/80 italic">Tempo: {timer}</span>
                </div>
                <div className="w-px h-3 bg-[#444652]/30" />
                <div className="flex items-center gap-2">
                  <MessageSquare size={12} className="text-[#A78BFA]" />
                  <span className="font-['DM_Mono'] text-[9px] md:text-[10px] uppercase text-[#e5e1e7]/80 italic">
                    Msgs: {messages.filter(m => m.role === 'visitor').length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Action Footer */}
      <footer className="shrink-0 bg-[#050508]/80 backdrop-blur-xl px-4 py-6 border-t border-[#444652]/10">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
          <div className="relative w-full">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={`Fale com o Twin de ${profile?.ownerName || ''}...`}
              className="w-full bg-[#1b1b1f] border-none rounded-full px-8 py-4 focus:ring-1 focus:ring-[#7B9CFF]/40 text-[#e5e1e7] placeholder:text-[#e5e1e7]/30 font-serif transition-all outline-none text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#7B9CFF] rounded-full flex items-center justify-center text-[#050508] disabled:opacity-30 transition-all"
            >
              <Send size={16} />
            </button>
          </div>
          <button onClick={handleEndSession} className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#e5e1e7]/40 group-hover:text-[#ffb4ab] transition-colors">
              Finalizar Sessão
            </span>
            <LogOut size={14} className="text-[#e5e1e7]/20 group-hover:text-[#ffb4ab]/50 transition-colors" />
          </button>
        </div>
      </footer>
    </div>
  );
}
