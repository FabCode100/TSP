'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { saveOnboarding } from '@/actions/db';
import { Mic, Square, Volume2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

const questionsData = [
  {
    title: "Origem",
    text: "Quando você começou a ser você mesmo? O que aconteceu?",
    suggestions: [
      "Uma perda significativa que mudou minha perspectiva",
      "Uma mudança radical de ambiente ou rotina",
      "Uma escolha de romper com expectativas alheias",
      "Ainda sinto que estou buscando esse momento"
    ]
  },
  {
    title: "Permanência",
    text: "O que nunca mudou em você? Por que isso resiste?",
    suggestions: [
      "Minha curiosidade e necessidade de entender o mundo",
      "Minha empatia e forma intensa de sentir",
      "Meu senso de justiça e valores inegociáveis",
      "Uma inquietação constante no fundo da mente"
    ]
  },
  {
    title: "Decisão",
    text: "Qual escolha mais difícil revelou quem você realmente é?",
    suggestions: [
      "Deixar algo seguro por algo completamente incerto",
      "Dizer 'não' para alguém importante para me proteger",
      "Escolher a mim mesmo em vez das expectativas dos outros",
      "Assumir a responsabilidade por um erro doloroso"
    ]
  },
  {
    title: "Transformação",
    text: "Como você mudou nos últimos cinco anos? O que ainda permanece?",
    suggestions: [
      "Aprendi a impor limites, mas ainda me importo profundamente",
      "Mudei meus objetivos de vida, mas a paixão é a mesma",
      "Sou mais cético, mas mantenho a mesma esperança no fundo",
      "Sou mais calmo, mas a essência questionadora continua"
    ]
  },
  {
    title: "Essência",
    text: "Sem suas memórias, o que ainda restaria de você?",
    suggestions: [
      "Minha forma instintiva de reagir ao mundo",
      "Minha capacidade de amar e me conectar com os outros",
      "Meus medos e intuições mais profundas",
      "Acredito que eu seria uma tela em branco, alguém novo"
    ]
  }
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [answers, setAnswers] = useState(Array(5).fill(''));
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();
  const { isRecording, isTranscribing, startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => setShowCTA(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.95; // Slightly slower for better reflection
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = async () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }

    if (step < 5) {
      setStep(step + 1);
    } else {
      setIsSaving(true);
      await saveOnboarding(answers);
      router.push('/pulso');
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      const transcription = await stopRecording();
      if (transcription) {
        const newAnswers = [...answers];
        newAnswers[step - 1] = newAnswers[step - 1] 
          ? `${newAnswers[step - 1]} ${transcription}` 
          : transcription;
        setAnswers(newAnswers);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <div className="h-full w-full bg-void flex flex-col relative">
      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            <h1 className="font-display text-[38px] leading-tight text-signal">
              Antes de começar,<br />precisamos saber<br />quem você é.
            </h1>
            
            <AnimatePresence>
              {showCTA && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleNext}
                  className="absolute bottom-12 right-8 font-interface text-[14px] text-pulse flex items-center gap-2"
                >
                  Continuar <span className="text-[18px]">→</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key={`q-${step}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col p-8 pt-16"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-membrane">
              <motion.div
                className="h-full bg-pulse"
                initial={{ width: `${((step - 1) / 5) * 100}%` }}
                animate={{ width: `${(step / 5) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <div className="font-interface text-[12px] text-whisper mb-8 flex justify-between items-center">
              <span>0{step} / 05</span>
              <span className="uppercase tracking-widest text-pulse/80">{questionsData[step - 1].title}</span>
            </div>
            
            <div className="flex items-start gap-4 mb-6">
              <h2 className="font-display text-[28px] text-signal leading-tight flex-1">
                {questionsData[step - 1].text}
              </h2>
              <button 
                onClick={() => speakQuestion(questionsData[step - 1].text)}
                className={`p-2 rounded-full transition-colors mt-1 flex-shrink-0 ${isPlaying ? 'text-pulse bg-pulse/10' : 'text-whisper hover:text-signal hover:bg-membrane'}`}
                aria-label="Ouvir pergunta"
              >
                <Volume2 size={24} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {questionsData[step - 1].suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const newAnswers = [...answers];
                    newAnswers[step - 1] = suggestion;
                    setAnswers(newAnswers);
                  }}
                  className={`px-4 py-2 rounded-full border text-[13px] font-interface transition-colors text-left ${
                    answers[step - 1] === suggestion 
                      ? 'bg-pulse text-void border-pulse' 
                      : 'bg-void/50 text-whisper border-threshold hover:border-pulse hover:text-pulse'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            <textarea
              autoFocus
              value={answers[step - 1]}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[step - 1] = e.target.value;
                setAnswers(newAnswers);
              }}
              placeholder={isRecording ? "Ouvindo..." : isTranscribing ? "Transcrevendo..." : "Ou escreva sua própria resposta..."}
              disabled={isRecording || isTranscribing}
              className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-body text-[18px] text-signal placeholder:text-whisper/50 p-0"
            />
            
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={toggleRecording}
                disabled={isTranscribing}
                className={`p-3 rounded-full flex items-center justify-center transition-colors ${
                  isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-membrane text-whisper hover:text-pulse'
                }`}
              >
                {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
              </button>
              
              <div className="flex items-center gap-6">
                <button
                  onClick={handleNext}
                  disabled={isSaving || isRecording || isTranscribing}
                  className="font-interface text-[14px] text-whisper hover:text-signal transition-colors"
                >
                  Pular
                </button>
                <button
                  onClick={handleNext}
                  disabled={!answers[step - 1].trim() || isSaving || isRecording || isTranscribing}
                  className="font-interface text-[14px] text-pulse disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Salvando...' : step === 5 ? 'Concluir' : 'Próxima'} →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
