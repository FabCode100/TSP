'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'mirror';
  content: string;
};

const initialMessages: Message[] = [
  { id: '1', role: 'user', content: 'Por que me sinto fragmentado hoje?' },
  { id: '2', role: 'mirror', content: 'A fragmentação é o prelúdio da síntese. Suas entradas recentes mostram uma tensão entre o desejo de isolamento e a necessidade de conexão.' },
];

const suggestions = [
  'O que o Núcleo diz?',
  'Explorar tensão',
  'Último insight'
];

export default function Espelho() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [activeChips, setActiveChips] = useState(suggestions);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedText]);

  const simulateStreaming = async (text: string) => {
    setIsStreaming(true);
    setStreamedText('');
    for (let i = 0; i <= text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      setStreamedText(text.slice(0, i));
    }
    setIsStreaming(false);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'mirror', content: text }]);
    setStreamedText('');
  };

  const handleSend = (text: string = input) => {
    if (!text.trim() || isStreaming) return;
    
    const newMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    
    // Remove chip if used
    setActiveChips(prev => prev.filter(c => c !== text));

    // Simulate response
    setTimeout(() => {
      simulateStreaming('A reflexão é um espelho que não apenas mostra o que é, mas o que pode vir a ser. Continue explorando essa linha de pensamento.');
    }, 500);
  };

  return (
    <div className="h-full w-full bg-void flex flex-col relative">
      <header className="sticky top-0 z-10 bg-void/80 backdrop-blur-md px-6 pt-12 pb-4 border-b border-threshold">
        <h1 className="font-display italic text-[22px] text-signal">Espelho Cognitivo</h1>
        <div className="font-interface text-[11px] text-whisper mt-1 uppercase">
          Modelo com 142 entradas
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
        <div className="flex flex-col gap-6">
          {messages.map((msg, idx) => (
            <div key={msg.id} className="flex flex-col">
              {idx > 0 && <div className="h-[1px] w-full bg-threshold my-6" />}
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <p className="font-body text-[16px] text-signal text-right max-w-[80%]">
                    {msg.content}
                  </p>
                ) : (
                  <p className="font-display italic text-[17px] text-signal/85 leading-relaxed max-w-[90%]">
                    {msg.content}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {isStreaming && (
            <div className="flex flex-col">
              <div className="h-[1px] w-full bg-threshold my-6" />
              <div className="flex justify-start">
                <p className="font-display italic text-[17px] text-signal/85 leading-relaxed max-w-[90%]">
                  {streamedText}<span className="animate-pulse">_</span>
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-membrane/90 backdrop-blur-xl border-t border-threshold px-4 py-4 pb-[calc(16px+env(safe-area-inset-bottom,34px))]">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-2">
          <AnimatePresence>
            {activeChips.map(chip => (
              <motion.button
                key={chip}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap rounded-full border border-threshold bg-void/50 px-4 py-2 text-[12px] font-interface text-whisper hover:text-pulse hover:border-pulse transition-all"
              >
                {chip}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        <div className="relative flex items-center bg-void border border-threshold rounded-xl px-4 py-3 focus-within:border-pulse transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte ao espelho..."
            className="bg-transparent border-none focus:ring-0 w-full font-body text-[16px] text-signal placeholder:text-whisper"
          />
          <button onClick={() => handleSend()} className="ml-2 text-pulse hover:scale-110 transition-transform">
            <Send size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
