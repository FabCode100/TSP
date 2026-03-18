'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { saveOnboarding } from '@/actions/db';
import { Mic, Square } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

const questions = [
  "O que te trouxe até aqui?",
  "Qual é a sua maior tensão atual?",
  "O que você tenta esconder de si mesmo?",
  "Onde você encontra clareza?",
  "O que você espera que o Espelho reflita?"
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [answers, setAnswers] = useState(Array(5).fill(''));
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { isRecording, isTranscribing, startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => setShowCTA(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleNext = async () => {
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
            
            <div className="font-interface text-[12px] text-whisper mb-12">
              0{step} / 05
            </div>
            
            <h2 className="font-display text-[32px] text-signal mb-8 leading-tight">
              {questions[step - 1]}
            </h2>
            
            <textarea
              autoFocus
              value={answers[step - 1]}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[step - 1] = e.target.value;
                setAnswers(newAnswers);
              }}
              placeholder={isRecording ? "Ouvindo..." : isTranscribing ? "Transcrevendo..." : "Escreva sua resposta..."}
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
              <button
                onClick={handleNext}
                disabled={!answers[step - 1].trim() || isSaving || isRecording || isTranscribing}
                className="font-interface text-[14px] text-pulse disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Salvando...' : step === 5 ? 'Concluir' : 'Próxima'} →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
