'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

export function FABSheet({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (text: string, type: string) => void }) {
  const [text, setText] = useState('');
  const [type, setType] = useState('MOMENTO');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isRecording, isTranscribing, startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleClose = () => {
    setText('');
    setType('MOMENTO');
    onClose();
  };

  const handleSave = () => {
    if (text.trim()) {
      onSave(text, type);
      handleClose();
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      const transcription = await stopRecording();
      if (transcription) {
        setText((prev) => prev ? `${prev} ${transcription}` : transcription);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-void/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 h-[70vh] bg-deep rounded-t-[24px] z-50 flex flex-col overflow-hidden"
          >
            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
            
            <div className="p-6 flex flex-col h-full relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-4 text-interface text-[12px] tracking-wider">
                  {['MOMENTO', 'REFLEXÃO', 'DECISÃO'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`transition-colors ${type === t ? 'text-pulse' : 'text-whisper'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={handleClose} className="text-whisper">✕</button>
              </div>
              
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={isRecording ? "Ouvindo..." : isTranscribing ? "Transcrevendo..." : "O que está acontecendo agora?"}
                disabled={isRecording || isTranscribing}
                className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-body text-[18px] text-signal placeholder:text-whisper/50"
              />
              
              <div className="flex justify-between items-center mt-4">
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
                  onClick={handleSave}
                  disabled={!text.trim() || isRecording || isTranscribing}
                  className="bg-pulse text-void px-6 py-3 rounded-full font-interface text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
