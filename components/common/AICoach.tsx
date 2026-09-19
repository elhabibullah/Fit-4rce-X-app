import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Mic, MicOff, X, Volume2, Bot, Loader2 } from 'lucide-react';
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

const COACH_TITLE_PROMPTS: Record<Language, string> = {
  [Language.FR]: "Parlez au micro pour démarrer votre séance",
  [Language.ES]: "Habla por el micrófono para iniciar tu entrenamiento",
  [Language.AR]: "تحدث عبر الميكروفون لبدء تمرينك",
  [Language.PT]: "Fale no microfone para iniciar seu treino",
  [Language.JA]: "マイクに向かって話してワークアウトを開始",
  [Language.ZH]: "对着麦克风说话以开始您的训练",
  [Language.RU]: "Говорите в микрофон, чтобы начать тренировку",
  [Language.EN]: "Speak into the mic to start your workout"
};

const COACH_EXAMPLE_PROMPTS: Record<Language, string> = {
  [Language.FR]: "Ex: « Je veux une séance de calisthénie », « Entraînement intense », « Je suis prêt »",
  [Language.ES]: 'Ej: "Quiero una sesión de calistenia", "Entrenamiento intenso", "Estoy listo"',
  [Language.AR]: 'مثال: "أريد تمرين كاليستنكس"، "تمرين مكثف"، "أنا جاهز"',
  [Language.PT]: 'Ex: "Quero um treino de calistenia", "Treino intenso", "Estou pronto"',
  [Language.JA]: '例:「自重トレーニングがしたい」「ハードな運動」「準備完了」',
  [Language.ZH]: '例：“我想练自重动作”，“高强度训练”，“我准备好了”',
  [Language.RU]: 'Пример: «Хочу тренировку по калистенике», «Интенсивный тренинг», «Я готов»',
  [Language.EN]: 'Ex: "I want a calisthenics workout", "High intensity", "I\'m ready"'
};

const AICoach: React.FC<AICoachProps> = ({ isVisible, onClose }) => {
  const { language, startWorkoutFromVoice, translate } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
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
      let launched = false;
      const doLaunch = () => {
        if (!launched) {
          launched = true;
          executeWorkoutLaunch(accumulatedContextRef.current);
        }
      };
      speakVoice(confirmText, doLaunch);
      setTimeout(doLaunch, 1200);
      return;
    }

    // Normal multi-turn conversation with AI coach
    setIsThinking(true);
    isThinkingRef.current = true;
    try {
      const historyList = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
      const aiReply = await getChatbotResponse(cleanText, language, historyList);
      
      const shouldLaunch = aiReply.includes('[GENERATE_WORKOUT]') ||
        /je (te|vous) g[eé]n[eè]re|g[eé]n[eé]ration de (tes|vos) exercices|je lance (ta|votre) s[eé]ance|g[eé]n[eè]re ta s[eé]ance|generating your|preparing your custom|prépare vos exercices/i.test(aiReply);

      const displayText = aiReply.replace(/\[GENERATE_WORKOUT\]/g, '').trim();

      setMessages(prev => [...prev, { role: 'assistant', text: displayText }]);

      if (shouldLaunch) {
        let launched = false;
        const doLaunch = () => {
          if (!launched) {
            launched = true;
            executeWorkoutLaunch(accumulatedContextRef.current);
          }
        };
        speakVoice(displayText, doLaunch);
        setTimeout(doLaunch, 1600);
      } else {
        speakVoice(displayText);
      }
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
    accumulatedContextRef.current = '';

    // Start microphone listening immediately, waiting for user to speak
    startRecognition();

    return () => {
      cleanupAudio();
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  return (
    <div 
      className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-full bg-black/95 backdrop-blur-2xl z-[9999] flex flex-col items-center justify-between font-['Poppins'] overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* TOP BAR */}
      <div className="w-full max-w-lg flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(138,43,226,0.5)]">
            <Bot className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-widest leading-none">
              {translate('chatbot.title')} • VOCAL
            </h2>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1.5">
              <span className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-indigo-400 animate-ping' : isListening ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`}></span>
              {isAiSpeaking ? translate('coach.status.speaking') : isListening ? translate('coach.status.listening') : translate('coach.status.waiting')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mute Audio Voice */}
          <button 
            onClick={() => setIsMuted(prev => !prev)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
              isMuted ? 'bg-red-950/80 border-red-500/50 text-red-400' : 'bg-white/10 border-white/15 text-gray-300 hover:text-white'
            }`}
            aria-label="Toggle Mute"
            title={isMuted ? translate('coach.sound.muted') : translate('coach.sound.active')}
          >
            {isMuted ? <MicOff size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Close Coach */}
          <button 
            onClick={() => { cleanupAudio(); onClose(); }}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* CENTRAL VOICE STAGE */}
      <div className="w-full max-w-lg flex-1 flex flex-col items-center justify-center px-6 py-4 space-y-6 overflow-y-auto custom-scrollbar">
        
        {/* VOICE VISUALIZER ORB */}
        <div className="relative flex items-center justify-center my-2">
          {/* Animated concentric pulse rings */}
          {isListening && (
            <>
              <div className="absolute w-48 h-48 rounded-full bg-purple-600/20 animate-ping [animation-duration:2.5s] pointer-events-none"></div>
              <div className="absolute w-40 h-40 rounded-full bg-indigo-500/25 animate-pulse pointer-events-none"></div>
            </>
          )}
          {isAiSpeaking && (
            <>
              <div className="absolute w-52 h-52 rounded-full bg-cyan-500/20 animate-ping [animation-duration:1.8s] pointer-events-none"></div>
              <div className="absolute w-44 h-44 rounded-full bg-purple-500/30 animate-pulse pointer-events-none"></div>
            </>
          )}

          <button
            type="button"
            onClick={toggleListening}
            className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl active:scale-95 border-2 ${
              isAiSpeaking
                ? 'bg-gradient-to-tr from-purple-700 via-indigo-600 to-cyan-400 border-cyan-300 shadow-[0_0_50px_rgba(6,182,212,0.6)]'
                : isListening
                ? 'bg-gradient-to-tr from-purple-600 to-emerald-600 border-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
                : 'bg-zinc-900/90 border-purple-500/40 hover:border-purple-400 shadow-[0_0_30px_rgba(138,43,226,0.3)]'
            }`}
            aria-label={isListening ? translate('coach.btn.stop_listening') : translate('coach.btn.speak_coach')}
          >
            {isAiSpeaking ? (
              <div className="flex items-end gap-1.5 h-8">
                <div className="w-1.5 h-4 bg-white rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-1.5 h-8 bg-white rounded-full animate-bounce [animation-delay:0.25s]"></div>
                <div className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
                <div className="w-1.5 h-7 bg-white rounded-full animate-bounce [animation-delay:0.15s]"></div>
                <div className="w-1.5 h-3 bg-white rounded-full animate-bounce [animation-delay:0.35s]"></div>
              </div>
            ) : isListening ? (
              <>
                <Mic size={36} className="text-white animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-200 mt-1">{translate('coach.mic.listening')}</span>
              </>
            ) : (
              <>
                <Mic size={36} className="text-purple-400 hover:text-white transition-colors" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{translate('coach.mic.label')}</span>
              </>
            )}
          </button>
        </div>

        {/* STATUS TITLE */}
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-white tracking-wide">
            {isAiSpeaking 
              ? translate('coach.status.speaking') 
              : isListening 
              ? translate('coach.status.im_listening') 
              : COACH_TITLE_PROMPTS[language] || COACH_TITLE_PROMPTS[Language.EN]}
          </p>
          <p className="text-[11px] text-zinc-400">
            {isListening ? translate('coach.hint.listening') : translate('coach.hint.idle')}
          </p>
        </div>

        {/* LIVE TRANSCRIPTS & REPLIES */}
        <div className="w-full space-y-3">
          {/* User live spoken phrase */}
          {(currentTranscript || lastUserMessage) && (
            <div className="flex justify-end">
              <div className="max-w-[90%] rounded-2xl rounded-br-none px-4 py-3 bg-purple-900/60 border border-purple-500/40 text-purple-100 text-xs sm:text-sm leading-relaxed shadow-lg">
                <span className="text-[9px] uppercase font-bold text-purple-300 block mb-1">{translate('coach.user.you')}</span>
                « {currentTranscript || lastUserMessage?.text} »
              </div>
            </div>
          )}

          {/* Coach thinking loader */}
          {isThinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-none px-4 py-3 bg-zinc-900 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-purple-400" />
                <span className="animate-pulse">{translate('coach.status.analyzing')}</span>
              </div>
            </div>
          )}

          {/* Coach spoken answer */}
          {lastAssistantMessage && !isThinking && (
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-2xl rounded-bl-none px-4 py-3.5 bg-zinc-900/90 border border-purple-500/40 text-zinc-100 text-xs sm:text-sm leading-relaxed shadow-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-purple-400" />
                  <span className="text-[9px] uppercase font-bold text-purple-400">{translate('coach.avatar.name')}</span>
                </div>
                <p>{lastAssistantMessage.text}</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM FOOTER */}
      <div className="w-full max-w-lg py-3 px-6 text-center border-t border-white/10 text-[10px] text-zinc-500 uppercase tracking-widest flex-shrink-0">
        {translate('coach.footer.tagline')}
      </div>
    </div>
  );
};

export default AICoach;
