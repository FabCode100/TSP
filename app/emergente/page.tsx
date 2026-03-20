'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, User, Bot, Loader2, Info, Share2, Link, Users, Mic, Volume2, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getTwinProfile, sendTwinMessage } from '@/actions/db';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

export default function Emergente() {
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'twin'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isRecording, isTranscribing, isSpeaking, startRecording, stopRecording, speak, stopSpeaking } = useAudioRecorder();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  useEffect(() => {
    getTwinProfile().then(setProfile);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);
    setShowIntro(false);

    try {
      let currentResponse = '';
      setMessages(prev => [...prev, { role: 'twin', content: '' }]);
      
      for await (const chunk of sendTwinMessage(userMsg)) {
        currentResponse += chunk;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = currentResponse;
          return newMsgs;
        });
      }

      // 4. Trigger Avatar Generation after speech is ready
      if (currentResponse && profile?.photo_url) {
        generateAvatar(currentResponse, profile.photo_url);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'twin', content: 'Desculpe, minha conexão com seu núcleo falhou momentaneamente.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleMic = async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text) {
        setInput(text);
      }
    } else {
      await startRecording();
    }
  };

  const generateAvatar = async (text: string, photoUrl: string) => {
    setIsGeneratingAvatar(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/twin/avatar/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, photoUrl })
      });
      const data = await res.json();
      if (data.success) {
        pollAvatarStatus(data.jobId);
      }
    } catch (e) {
      console.error('Failed to trigger avatar:', e);
      setIsGeneratingAvatar(false);
    }
  };

  const pollAvatarStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/twin/avatar/status/${jobId}`);
        const result = await res.json();
        if (result.success && result.data.status === 'completed') {
          setAvatarUrl(result.data.video_url);
          setIsGeneratingAvatar(false);
          clearInterval(interval);
        } else if (result.success && result.data.status === 'failed') {
          setIsGeneratingAvatar(false);
          clearInterval(interval);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 3000);

    // Stop polling after 2 minutes anyway
    setTimeout(() => clearInterval(interval), 120000);
  };

  return (
    <div className="min-h-full w-full bg-void flex flex-col relative">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-pulse/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emergence/10 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-10 bg-void/80 backdrop-blur-md px-4 md:px-6 pt-12 pb-4 border-b border-threshold flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl md:text-[28px] text-signal leading-none truncate">Gêmeo Emergente</h1>
          <div className="font-interface text-[10px] md:text-[11px] text-whisper mt-1 uppercase truncate">
            {profile?.status || 'Sintonizando...'}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0 shadow-sm">
          <button onClick={() => router.push('/conectar')} className="text-whisper hover:text-pulse transition-colors p-1.5 md:p-2">
            <Link className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.5} />
          </button>
          <button onClick={() => router.push('/compartilhar')} className="text-whisper hover:text-pulse transition-colors p-1.5 md:p-2">
            <Share2 className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.5} />
          </button>
          <button onClick={() => router.push('/conexoes')} className="text-whisper hover:text-pulse transition-colors p-1.5 md:p-2 relative">
            <Users className="w-[18px] h-[18px] md:w-5 md:h-5" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-8" ref={scrollRef}>
        <AnimatePresence>
          {showIntro && profile && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-12"
            >
              <div className="p-6 rounded-[24px] bg-membrane/40 border border-threshold relative overflow-hidden mb-6">
                <div className="flex items-center gap-2 mb-4 text-pulse">
                  <Info size={16} />
                  <span className="font-interface text-[11px] uppercase tracking-wider">Perfil Sintético</span>
                </div>
                <p className="font-body text-[18px] text-signal italic leading-relaxed mb-4">
                  "{profile.narrative}"
                </p>
                <div className="font-interface text-[12px] text-whisper text-right italic">
                  — {profile.prompt_intro}
                </div>
              </div>
              
              <div className="text-center font-interface text-[11px] text-whisper uppercase tracking-widest opacity-40">
                Inicie o diálogo para emergir
              </div>
            </motion.div>
          )}

          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`mb-6 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                  msg.role === 'user' ? 'bg-threshold text-whisper' : 'bg-membrane border border-pulse/30 text-pulse'
                }`}>
                  {msg.role === 'user' ? (
                    <User size={16} />
                  ) : (
                    avatarUrl && idx === messages.length - 1 ? (
                      <video 
                        src={avatarUrl} 
                        autoPlay 
                        loop 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile?.photo_url ? (
                        <img src={profile.photo_url} className="w-full h-full object-cover" alt="Twin" />
                      ) : (
                        <Bot size={16} />
                      )
                    )
                  )}
                </div>
                <div className={`p-4 rounded-[20px] font-body text-[16px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-threshold/30 text-signal/90 rounded-tr-none' 
                    : 'bg-membrane/60 border border-threshold text-signal rounded-tl-none'
                }`}>
                  <div className="flex flex-col gap-2">
                    {msg.content}
                    {msg.role === 'twin' && msg.content && (
                      <button 
                        onClick={() => speak(msg.content)}
                        className="self-end text-pulse/40 hover:text-pulse transition-colors"
                      >
                        <Volume2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isTyping && messages[messages.length-1].content === '' && (
            <div className="flex justify-start mb-6">
              <div className="flex gap-3 items-center text-whisper font-interface text-[12px] italic">
                <Loader2 size={14} className="animate-spin" />
                Emergindo resposta...
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-void/95 backdrop-blur-sm border-t border-threshold pb-10">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "Ouvindo seu núcleo..." : "Comungar com seu reflexo..."}
              className={`w-full bg-membrane/30 border ${isRecording ? 'border-pulse shadow-[0_0_15px_rgba(123,156,255,0.2)]' : 'border-threshold'} rounded-full px-6 py-4 pr-14 text-signal placeholder:text-whisper/40 focus:outline-none focus:border-pulse/50 transition-all font-body`}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || isRecording}
              className="absolute right-2 top-2 w-10 h-10 rounded-full bg-pulse text-void flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all"
            >
              <Send size={18} />
            </button>
          </div>
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isRecording ? 'bg-emergence text-void animate-pulse' : 'bg-membrane border border-threshold text-whisper hover:border-pulse/50'
            }`}
          >
            {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
