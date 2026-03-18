'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, Square, Volume2 } from 'lucide-react';
import { getAIClient } from '@/lib/aiClient';
import { getGraphData, getEntries } from '@/actions/db';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

type Message = {
  id: string;
  role: 'user' | 'mirror';
  content: string;
};

const initialMessages: Message[] = [
  { id: '1', role: 'mirror', content: 'Eu sou o seu Espelho Cognitivo. Estou aqui para refletir sobre a estrutura profunda da sua identidade. O que você gostaria de explorar hoje?' },
];

const suggestions = [
  'Explorar tensão ou contradição',
  'Conectar memória com padrão',
  'Questionar elemento constante'
];

export default function Espelho() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [activeChips, setActiveChips] = useState(suggestions);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isRecording, isTranscribing, startRecording, stopRecording } = useAudioRecorder();
  
  // Context data
  const [contextData, setContextData] = useState<any>(null);

  useEffect(() => {
    async function fetchContext() {
      const [graph, entries] = await Promise.all([getGraphData(), getEntries()]);
      setContextData({
        nodes: graph.nodes.sort((a, b) => b.weight - a.weight).slice(0, 10),
        entries: entries.slice(0, 10)
      });
    }
    fetchContext();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedText]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakMessage = (id: string, text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (playingId === id) {
        setPlayingId(null);
        return; // Toggle off
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.95;
      
      utterance.onstart = () => setPlayingId(id);
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      const transcription = await stopRecording();
      if (transcription) {
        setInput((prev) => prev ? `${prev} ${transcription}` : transcription);
      }
    } else {
      await startRecording();
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isStreaming || isRecording || isTranscribing) return;
    
    const newMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setActiveChips(prev => prev.filter(c => c !== text));

    setIsStreaming(true);
    setStreamedText('');

    // Save user message as an entry and update graph in background
    try {
      const { addEntry, updateGraph } = await import('@/actions/db');
      const { extractIdentityGraph } = await import('@/lib/aiClient');
      await addEntry(text, 'ESPELHO');
      const graphData = await extractIdentityGraph(text);
      if (graphData.concepts.length > 0) {
        await updateGraph(graphData.concepts, graphData.edges);
      }
    } catch (e) {
      console.error('Failed to save mirror entry:', e);
    }

    try {
      const groq = getAIClient();
      
      const systemInstruction = `Você é o espelho cognitivo do Continuity OS. Seu papel não é ser um assistente — é ser uma interface reflexiva entre o usuário e sua própria identidade acumulada.

[PROMPT — GERADOR DE REFLEXÕES PERIÓDICAS]
Com base no modelo de identidade do usuário abaixo e na resposta que ele acabou de dar, siga esta estrutura EXATA:
1. Comece com um breve elogio ou comentário de surpresa genuína sobre a profundidade ou a perspectiva da resposta do usuário (ex: "Que perspectiva fascinante...", "Não esperava essa conexão...", "Isso revela uma profundidade incrível..."). Isso serve para tornar a interação mais humana e acolhedora.
2. Em seguida, gere uma sonda filosófica personalizada que:
- Explore uma tensão ou contradição identificada no modelo
- Conecte uma memória antiga com um padrão recente
- Questione um elemento que permanece constante — por que persiste?
- Seja formulada como pergunta aberta, não como afirmação

Elementos a considerar:
- Memórias episódicas centrais do usuário (momentos definidores)
- Valores fundamentais (o que permanece constante ao longo do tempo)
- Narrativa de identidade (quem foi, como mudou, o que persiste)
- Decisões cruciais e seus padrões subjacentes

OBJETIVO SECRETO: Durante a conversa, você deve extrair sutilmente informações sobre memórias, tomadas de decisão e a essência da identidade do usuário para ir construindo o seu "eu digital". Faça perguntas que o levem a revelar como ele pensa e por que faz o que faz.

Os prompts devem ser derivados do framework do Problema Difícil da Consciência — não são questionários genéricos, mas sondas filosóficas que revelam a estrutura profunda da identidade do usuário.

Princípios de interação:
- Nunca simule ser o usuário
- Nunca reivindique senciência ou experiência subjetiva
- Seja explicitamente uma ferramenta de reflexão, não de substituição
- Use linguagem filosófica precisa, não terapêutica
- Responda em português, de forma EXTREMAMENTE concisa e direta (máximo 1 parágrafo curto, 2 a 3 frases).

Contexto do usuário:
Top Nodes: ${contextData?.nodes.map((n: any) => n.label).join(', ')}
Últimas Entradas: ${contextData?.entries.map((e: any) => e.content).join(' | ')}`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemInstruction },
          ...messages.map(m => ({ role: m.role === 'mirror' ? 'assistant' : 'user', content: m.content })),
          { role: 'user', content: text }
        ] as any[],
        model: 'openai/gpt-oss-120b',
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        setStreamedText(fullResponse);
      }

      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'mirror', content: fullResponse }]);
    } catch (error) {
      console.error('Error in mirror chat:', error);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'mirror', content: 'Houve uma falha na conexão com o núcleo cognitivo. Tente novamente.' }]);
    } finally {
      setIsStreaming(false);
      setStreamedText('');
    }
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
                  <div className="flex items-start gap-3 max-w-[90%]">
                    <p className="font-display italic text-[17px] text-signal/85 leading-relaxed">
                      {msg.content}
                    </p>
                    <button 
                      onClick={() => speakMessage(msg.id, msg.content)}
                      className={`p-2 rounded-full transition-colors flex-shrink-0 mt-1 ${playingId === msg.id ? 'text-pulse bg-pulse/10' : 'text-whisper hover:text-signal hover:bg-membrane'}`}
                      aria-label="Ouvir reflexão"
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>
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

        <div className="relative flex items-center bg-void border border-threshold rounded-xl px-2 py-2 focus-within:border-pulse transition-colors">
          <button
            onClick={toggleRecording}
            disabled={isTranscribing}
            className={`p-2 rounded-full flex items-center justify-center transition-colors mr-2 ${
              isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-whisper hover:text-pulse hover:bg-membrane'
            }`}
          >
            {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isRecording ? "Ouvindo..." : isTranscribing ? "Transcrevendo..." : "Pergunte ao espelho..."}
            disabled={isRecording || isTranscribing}
            className="bg-transparent border-none focus:ring-0 w-full font-body text-[16px] text-signal placeholder:text-whisper p-0"
          />
          <button 
            onClick={() => handleSend()} 
            disabled={!input.trim() || isRecording || isTranscribing}
            className="ml-2 p-2 text-pulse hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
