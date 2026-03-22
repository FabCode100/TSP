import { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '@/lib/aiClient';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        synthRef.current = window.speechSynthesis;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/aac', 'audio/mp4', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
      console.log('[Audio] Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        const audioFile = new File([audioBlob], 'audio.aac', { type: audioBlob.type });
        
        try {
          console.log('[Audio] Transcribing file size:', audioFile.size);
          const text = await transcribeAudio(audioFile);
          console.log('[Audio] Transcription result:', text);
          resolve(text);
        } catch (error) {
          console.error('Error transcribing:', error);
          resolve(null);
        } finally {
          setIsTranscribing(false);
          // Stop all tracks to release the microphone
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
          mediaRecorderRef.current = null;
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    
    // Stop any ongoing speech AND remote audio
    window.speechSynthesis.cancel();
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const playRemoteAudio = useCallback((url: string) => {
    // 1. Parar áudio anterior se houver
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }

    const audio = new Audio(url);
    activeAudioRef.current = audio;

    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => {
      setIsSpeaking(false);
      activeAudioRef.current = null;
    };
    audio.onerror = () => {
      setIsSpeaking(false);
      activeAudioRef.current = null;
    };
    audio.play().catch(e => console.error('Error playing remote audio:', e));
    return audio;
  }, []);

  return {
    isRecording,
    isTranscribing,
    isSpeaking,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
    playRemoteAudio
  };
}
