import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceRecognitionOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  language?: string;
}

interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
}

// Extend Window interface for Speech Recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: () => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const { onTranscript, onError, continuous = false, language = 'en-US' } = options;
  
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    transcript: '',
    error: null,
  });
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const startListening = useCallback(() => {
    if (!state.isSupported) {
      const errorMsg = 'Speech recognition not supported in this browser';
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
      return;
    }
    
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;
      
      recognition.onstart = () => {
        setState(prev => ({ ...prev, isListening: true, error: null, transcript: '' }));
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setState(prev => ({ ...prev, transcript: currentTranscript }));
        onTranscript?.(currentTranscript, !!finalTranscript);
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMsg = `Speech recognition error: ${event.error}`;
        setState(prev => ({ ...prev, error: errorMsg, isListening: false }));
        onError?.(errorMsg);
      };
      
      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
      };
      
      recognition.start();
    } catch (err) {
      const errorMsg = 'Failed to start speech recognition';
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
    }
  }, [state.isSupported, continuous, language, onTranscript, onError]);
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setState(prev => ({ ...prev, isListening: false }));
    }
  }, []);
  
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
  };
}

// Text-to-speech hook for AI responses
export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const speak = useCallback((text: string, options?: { rate?: number; pitch?: number; voice?: string }) => {
    if (!isSupported || !text) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;
    
    // Try to find a natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex')
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);
  
  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);
  
  const toggle = useCallback((text: string) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text);
    }
  }, [isSpeaking, speak, stop]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);
  
  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
    toggle,
  };
}
