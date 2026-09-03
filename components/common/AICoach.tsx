import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Mic, MicOff, X, Volume2, Bot, Loader2, Send } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import { Language, WorkoutGenerationParams } from '../../types.ts';
import { getChatbotResponse } from '../../services/aiService.ts';

interface AICoachProps {
  isVisible: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

// Helper to extract workout parameters from voice speech
function parseVoiceWorkoutParams(text: string): WorkoutGenerationParams {
  const lower = (text || '').toLowerCase();
  
  let workoutType: any = 'fitness';
  if (lower.includes('calisth') || lower.includes('calisten') || lower.includes('peso corporal') || lower.includes('poids du corps') || lower.includes('bodyweight') || lower.includes('体操') || lower.includes('калистеник')) {
    workoutType = 'calisthenics';
  } else if (lower.includes('power') || lower.includes('force') || lower.includes('fuerza') || lower.includes('força') || lower.includes('haltère') || lower.includes('mancuerna') || lower.includes('dumbbell') || lower.includes('гантел') || lower.includes('力量') || lower.includes('قوة') || lower.includes('أثقال') || lower.includes('muscu')) {
    workoutType = 'powerlifting';
  } else if (lower.includes('pilate') || lower.includes('пилатес') || lower.includes('普拉提') || lower.includes('بيلاتس')) {
    workoutType = 'pilates';
  } else if (lower.includes('yoga') || lower.includes('йог') || lower.includes('瑜伽') || lower.includes('يوغا') || lower.includes('يوجا')) {
    workoutType = 'yoga';
  } else if (lower.includes('cross') || lower.includes('кросс') || lower.includes('交叉')) {
    workoutType = 'crossfit';
  }

  let intensity: any = 'medium';
  if (lower.includes('intense') || lower.includes('hard') || lower.includes('alta') || lower.includes('fort') || lower.includes('avancé') || lower.includes('high') || lower.includes('высок') || lower.includes('高') || lower.includes('عالي') || lower.includes('شديد') || lower.includes('avanzado') || lower.includes('lourd') || lower.includes('dur')) {
    intensity = 'high';
  } else if (lower.includes('soft') || lower.includes('doux') || lower.includes('suave') || lower.includes('baja') || lower.includes('low') || lower.includes('débutant') || lower.includes('principiante') || lower.includes('beginner') || lower.includes('легк') || lower.includes('低') || lower.includes('خفيف') || lower.includes('مبتدئ') || lower.includes('calme') || lower.includes('léger')) {
    intensity = 'low';
  }

  return {
    workoutType,
    intensity,
    customPrompt: text
  };
}

const AICoach: React.FC<AICoachProps> = ({ isVisible, onClose }) => {
  const { language, startWorkoutFromVoice, translate } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const isMutedRef = useRef(isMuted);
  const isListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const isAiSpeakingRef = useRef(false);
  const isThinkingRef = useRef(false);
  const silenceTimerRef = useRef<any>(null);
  const isVisibleRef = useRef(isVisible);
  const accumulatedContextRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript]);

  const speechLang = useMemo(() => {
    switch (language) {
      case Language.FR: return 'fr-FR';
      case Language.AR: return 'ar-SA';
      case Language.ES: return 'es-ES';
      case Language.JA: return 'ja-JP';
      case Language.PT: return 'pt-BR';
      case Language.ZH: return 'zh-CN';
      case Language.RU: return 'ru-RU';
      default: return 'en-US';
    }
  }, [language]);

  // Clean up audio & speech engines
  const cleanupAudio = useCallback(() => {
    isListeningRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setIsAiSpeaking(false);
    setIsThinking(false);
  }, []);

  // Stop microphone listening safely
  const stopRecognition = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  // Launch the workout transition to Holographic Coach studio
  const executeWorkoutLaunch = useCallback((promptText: string) => {
    cleanupAudio();
    const params = parseVoiceWorkoutParams(promptText || accumulatedContextRef.current || 'fitness');
    startWorkoutFromVoice(params);
  }, [cleanupAudio, startWorkoutFromVoice]);

  // Start continuous microphone recognition
  const startRecognition = useCallback(() => {
    if (!isVisibleRef.current) return;
    // Don't listen while AI is speaking or thinking
    if (isAiSpeakingRef.current || isThinkingRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available');
      return;
    }

    if (recognitionRef.current) {
      try { 
        recognitionRef.current.onend = null;
        recognitionRef.current.abort(); 
      } catch (e) {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        // IGNORE any input if AI is currently speaking or thinking
        if (isAiSpeakingRef.current || isThinkingRef.current) {
          return;
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += chunk;
          } else {
            interimTranscript += chunk;
          }
        }

        const spoken = (finalTranscript || interimTranscript).trim();
        if (spoken) {
          setCurrentTranscript(spoken);
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          // Process sentence after 1.2s of silence
          silenceTimerRef.current = setTimeout(() => {
            handleUserMessage(spoken);
          }, 1200);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Only auto-restart if still active, visible, and AI is NOT talking/thinking
        if (isVisibleRef.current && isListeningRef.current && !isAiSpeakingRef.current && !isThinkingRef.current) {
          try {
            recognition.start();
          } catch (e) {
            isListeningRef.current = false;
            setIsListening(false);
          }
        } else {
          isListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      isListeningRef.current = true;
      setIsListening(true);
    } catch (e) {
      console.warn('Recognition start exception:', e);
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [speechLang]);

  // Spoken feedback via SpeechSynthesis
  const speakVoice = useCallback((text: string, onFinish?: () => void) => {
    // Mute microphone while coach is speaking to avoid hearing itself
    stopRecognition();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window && !isMutedRef.current) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechLang;
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.onstart = () => {
          setIsAiSpeaking(true);
          isAiSpeakingRef.current = true;
        };
        utterance.onend = () => {
          setIsAiSpeaking(false);
          isAiSpeakingRef.current = false;
          // Reactivate mic for the user's turn
          setTimeout(() => {
            if (isVisibleRef.current) {
              startRecognition();
            }
          }, 300);
          if (onFinish) onFinish();
        };
        utterance.onerror = () => {
          setIsAiSpeaking(false);
          isAiSpeakingRef.current = false;
          setTimeout(() => {
            if (isVisibleRef.current) {
              startRecognition();
            }
          }, 300);
          if (onFinish) onFinish();
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('SpeechSynthesis error:', e);
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
        if (isVisibleRef.current) {
          startRecognition();
        }
        if (onFinish) onFinish();
      }
    } else {
      if (isVisibleRef.current) {
        startRecognition();
      }
      if (onFinish) onFinish();
    }
  }, [speechLang, stopRecognition, startRecognition]);

  // Process user's speech or typed input
  const handleUserMessage = useCallback(async (userText: string) => {
    if (!userText || !userText.trim()) return;
    const cleanText = userText.trim();
    setCurrentTranscript('');
    setInputText('');
    accumulatedContextRef.current += ` ${cleanText}`;

    // Temporarily pause listening while processing
    stopRecognition();

    // Add user message to conversation
    setMessages(prev => [...prev, { role: 'user', text: cleanText }]);

    const lower = cleanText.toLowerCase();

    // Check if user confirmed readiness to begin
    const isReadyTrigger = (
      lower.includes('prêt') || lower.includes('pret') ||
      lower.includes('ready') || lower.includes('commencer') ||
      lower.includes('parti') || lower.includes('lance') ||
      lower.includes('start') || lower.includes("let's go") ||
      lower.includes('جاهز') || lower.includes('ابدأ') || lower.includes('يلا') ||
      lower.includes('listo') || lower.includes('vamos') || lower.includes('empezar') ||
      lower.includes('pronto') || lower.includes('começar') || lower.includes('iniciar') ||
      lower.includes('準備') || lower.includes('開始') || lower.includes('スタート') ||
      lower.includes('开始') || lower.includes('准备好了') ||
      lower.includes('готов') || lower.includes('старт') || lower.includes('поехали')
    );

    if (isReadyTrigger) {
      const confirmText = translate('workout.loading.calculating');
      setMessages(prev => [...prev, { role: 'assistant', text: confirmText }]);
      speakVoice(confirmText, () => {
        executeWorkoutLaunch(accumulatedContextRef.current);
      });
      return;
    }

    // Normal multi-turn conversation with AI coach
    setIsThinking(true);
    isThinkingRef.current = true;
    try {
      const historyList = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
      const aiReply = await getChatbotResponse(cleanText, language, historyList);
      
      setMessages(prev => [...prev, { role: 'assistant', text: aiReply }]);
      speakVoice(aiReply);
    } catch (err) {
      console.warn("AI Coach voice error:", err);
      if (isVisibleRef.current) {
        startRecognition();
      }
    } finally {
      setIsThinking(false);
      isThinkingRef.current = false;
    }
  }, [messages, language, translate, speakVoice, stopRecognition, startRecognition, executeWorkoutLaunch]);

  // Toggle user microphone click
  const toggleListening = () => {
    if (isListening) {
      stopRecognition();
      if (currentTranscript.trim()) {
        handleUserMessage(currentTranscript.trim());
      }
    } else {
      startRecognition();
    }
  };

  // Reset state on modal open: coach stays silent, starts listening for user
  useEffect(() => {
    if (!isVisible) {
      cleanupAudio();
      return;
    }
    
    // Clear conversation on new session
    setMessages([]);
    setCurrentTranscript('');
    setInputText('');
    accumulatedContextRef.current = '';

    // Start microphone listening immediately, waiting for user to speak
    startRecognition();

    return () => {
      cleanupAudio();
    };
  }, [isVisible]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleUserMessage(inputText.trim());
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[9999] flex flex-col items-center justify-between p-4 sm:p-6 font-['Poppins']"
      role="dialog"
      aria-modal="true"
    >
      {/* TOP BAR */}
      <div className="w-full max-w-md flex items-center justify-between pt-2 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(138,43,226,0.4)]">
            <Bot className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-widest leading-none">
              {translate('chatbot.title')}
            </h2>
            <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isAiSpeaking ? 'bg-indigo-400 animate-pulse' : isListening ? 'bg-green-400 animate-pulse' : 'bg-zinc-500'}`}></span>
              {isAiSpeaking ? translate('coach.status.speaking') : isListening ? translate('coach.status.listening') : "EN ATTENTE"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute Audio Voice */}
          <button 
            onClick={() => setIsMuted(prev => !prev)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
              isMuted ? 'bg-red-950/80 border-red-500/50 text-red-400' : 'bg-white/10 border-white/10 text-gray-300 hover:text-white'
            }`}
            aria-label="Toggle Mute"
          >
            {isMuted ? <MicOff size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Close Coach */}
          <button 
            onClick={() => { cleanupAudio(); onClose(); }}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* CONVERSATION HISTORY SCROLL */}
      <div className="w-full max-w-md flex-1 overflow-y-auto px-2 py-4 space-y-3 flex flex-col justify-end">
        {messages.length === 0 && !currentTranscript && (
          <div className="text-center py-6">
            <p className="text-sm font-bold text-purple-300 tracking-wide">
              {language === Language.FR 
                ? "Parlez au micro pour démarrer votre séance" 
                : language === Language.ES 
                ? "Habla por el micrófono para iniciar tu entrenamiento"
                : language === Language.AR
                ? "تحدث عبر الميكروفون لبدء تمرينك"
                : "Speak into the mic to start your workout"}
            </p>
            <p className="text-[11px] text-zinc-400 mt-2">
              {language === Language.FR 
                ? "Ex: « Je veux une séance de calisthénie », « Entraînement intense », « Je suis prêt »" 
                : language === Language.ES
                ? 'Ej: "Quiero una sesión de calistenia", "Entrenamiento intenso", "Estoy listo"'
                : language === Language.AR
                ? 'مثال: "أريد تمرين كاليستنكس"، "تمرين مكثف"، "أنا جاهز"'
                : 'Ex: "I want a calisthenics workout", "High intensity", "I\'m ready"'}
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-purple-600 text-white rounded-br-none' 
                  : 'bg-zinc-900 border border-purple-500/30 text-purple-100 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {currentTranscript && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm bg-purple-950/80 border border-purple-500/40 text-purple-200 italic rounded-br-none">
              « {currentTranscript} »
            </div>
          </div>
        )}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl px-4 py-3 flex items-center gap-2 text-xs text-purple-300">
              <Loader2 size={14} className="animate-spin text-purple-400" />
              <span className="animate-pulse">En réflexion...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* CENTER GLOWING VOICE ORB */}
      <div className="w-full max-w-md flex flex-col items-center justify-center py-4">
        <div className="relative flex items-center justify-center">
          {isListening && (
            <div className="absolute w-36 h-36 rounded-full border border-purple-500/30 animate-ping pointer-events-none opacity-20" />
          )}

          {/* Core Interactive Microphone Orb */}
          <button
            onClick={toggleListening}
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center relative z-10 transition-all duration-300 shadow-2xl active:scale-95 ${
              isAiSpeaking
                ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 shadow-[0_0_50px_rgba(138,43,226,0.8)] scale-105 animate-pulse'
                : isListening
                ? 'bg-gradient-to-tr from-purple-700 to-indigo-600 border-2 border-purple-300 shadow-[0_0_40px_rgba(138,43,226,0.6)] scale-105'
                : 'bg-zinc-900 border-2 border-purple-500/40 hover:border-purple-400 shadow-[0_0_25px_rgba(138,43,226,0.3)] hover:scale-105'
            }`}
            aria-label={isListening ? "Stop listening" : "Start speaking"}
          >
            {isAiSpeaking ? (
              <div className="flex items-end gap-1.5 h-7">
                <div className="w-1.5 h-3 bg-white rounded-full animate-bounce"></div>
                <div className="w-1.5 h-7 bg-white rounded-full animate-bounce [animation-delay:0.15s]"></div>
                <div className="w-1.5 h-4 bg-white rounded-full animate-bounce [animation-delay:0.3s]"></div>
              </div>
            ) : (
              <Mic 
                size={36} 
                className={`${isListening ? 'text-white scale-110' : 'text-purple-400'} transition-transform`} 
              />
            )}
          </button>
        </div>

        {/* Status instruction */}
        <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-4 text-center">
          {isAiSpeaking 
            ? translate('coach.status.speaking') 
            : isListening 
            ? translate('coach.status.im_listening') 
            : translate('coach.status.ready_voice')}
        </p>
      </div>

      {/* QUICK TEXT INPUT FALLBACK */}
      <form onSubmit={handleManualSubmit} className="w-full max-w-md flex items-center gap-2 pb-2">
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={language === Language.FR ? "Ou écrivez votre demande ici..." : "Or type your request here..."}
          className="flex-1 bg-zinc-900 border border-purple-500/30 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-9 h-9 rounded-full bg-purple-600 disabled:opacity-40 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
          aria-label="Send"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};

export default AICoach;
