import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bot, Mic, MicOff, Volume2, X, Sparkles, Loader2, Send, CornerDownLeft } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import { Language, WorkoutGenerationParams } from '../../types.ts';
import { getChatbotResponse } from '../../services/aiService.ts';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface AICoachProps {
  isVisible: boolean;
  onClose: () => void;
}

// Quick conversational prompts translated across the 8 supported languages
const QUICK_PROMPTS: Record<Language, string[]> = {
  [Language.FR]: [
    "Séance Full Body 20 min",
    "Pompes et Abdominaux",
    "Cardio Haute Intensité",
    "Je suis prêt, lance la séance !"
  ],
  [Language.ES]: [
    "Cuerpo completo 20 min",
    "Flexiones y Abdominales",
    "Cardio alta intensidad",
    "¡Estoy listo, comienza!"
  ],
  [Language.AR]: [
    "تمرين لكامل الجسم 20 دقيقة",
    "تمارين الضغط والبطن",
    "كارديو عالي الكثافة",
    "أنا جاهز، ابدأ التمرين!"
  ],
  [Language.PT]: [
    "Treino Corpo Inteiro 20 min",
    "Flexões e Abdominais",
    "Cardio Alta Intensidade",
    "Estou pronto, vamos começar!"
  ],
  [Language.JA]: [
    "20分 全身ワークアウト",
    "腕立て伏せと腹筋",
    "高強度HIITカーディオ",
    "準備完了、スタート！"
  ],
  [Language.ZH]: [
    "20分钟 全身训练",
    "俯卧撑与腹肌训练",
    "高强度燃脂有氧",
    "我准备好了，开始！"
  ],
  [Language.RU]: [
    "20 минут на всё тело",
    "Отжимания и пресс",
    "Высокоинтенсивное кардио",
    "Я готов, начинаем!"
  ],
  [Language.EN]: [
    "20 min Full Body Session",
    "Push-ups & Abs Workout",
    "High Intensity Cardio",
    "I'm ready, let's start!"
  ]
};

const COACH_TITLE_PROMPTS: Record<Language, string> = {
  [Language.FR]: "Parlez ou écrivez pour lancer votre séance sur mesure",
  [Language.ES]: "Habla o escribe para iniciar tu entrenamiento a medida",
  [Language.AR]: "تحدث أو اكتب لبدء تمرينك المخصص",
  [Language.PT]: "Fale ou digite para iniciar seu treino personalizado",
  [Language.JA]: "話すか入力して専用ワークアウトを開始",
  [Language.ZH]: "说话或输入文字以开始定制训练",
  [Language.RU]: "Говорите или пишите, чтобы начать тренировку",
  [Language.EN]: "Speak or type to generate your custom workout"
};

const parseVoiceWorkoutParams = (text: string): WorkoutGenerationParams => {
  const lower = text.toLowerCase();
  let intensity: 'low' | 'medium' | 'high' = 'medium';
  if (lower.includes('intense') || lower.includes('dur') || lower.includes('hard') || lower.includes('max') || lower.includes('high') || lower.includes('force') || lower.includes('heavy') || lower.includes('тяжел') || lower.includes('高') || lower.includes('ハード') || lower.includes('شديد') || lower.includes('صعب')) {
    intensity = 'high';
  } else if (lower.includes('doux') || lower.includes('léger') || lower.includes('light') || lower.includes('easy') || lower.includes('facile') || lower.includes('debutant') || lower.includes('beginner') || lower.includes('легк') || lower.includes('低') || lower.includes('イージー') || lower.includes('سهل') || lower.includes('خفيف')) {
    intensity = 'low';
  }

  let workoutType = 'fitness';
  if (lower.includes('calisth') || lower.includes('calisten') || lower.includes('poids du corps') || lower.includes('bodyweight') || lower.includes('калистен') || lower.includes('自重') || lower.includes('كاليستنكس')) {
    workoutType = 'calisthenics';
  } else if (lower.includes('pompe') || lower.includes('pushup') || lower.includes('push up') || lower.includes('abdo') || lower.includes('abs') || lower.includes('core')) {
    workoutType = 'fitness';
  } else if (lower.includes('cardio') || lower.includes('hiit') || lower.includes('endurance') || lower.includes('brûle') || lower.includes('burn') || lower.includes('кардио') || lower.includes('有氧') || lower.includes('カーディオ') || lower.includes('كارديو')) {
    workoutType = 'fitness';
  } else if (lower.includes('force') || lower.includes('power') || lower.includes('heavy') || lower.includes('powerlifting') || lower.includes('силов') || lower.includes('力量') || lower.includes('パワー') || lower.includes('قوة')) {
    workoutType = 'powerlifting';
  } else if (lower.includes('masse') || lower.includes('muscle') || lower.includes('hypertrophy') || lower.includes('mass') || lower.includes('мышц') || lower.includes('增肌') || lower.includes('筋肉') || lower.includes('تضخيم')) {
    workoutType = 'mass_gaining';
  }

  return {
    intensity,
    workoutType,
    customPrompt: text
  };
};

const AICoach: React.FC<AICoachProps> = ({ isVisible, onClose }) => {
  const { language, startWorkoutFromVoice, translate } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean | null>(null);

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
  }, [messages, currentTranscript, isThinking]);

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
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  // Launch workout transition
  const executeWorkoutLaunch = useCallback((promptText: string) => {
    cleanupAudio();
    const params = parseVoiceWorkoutParams(promptText || accumulatedContextRef.current || 'fitness');
    startWorkoutFromVoice(params);
  }, [cleanupAudio, startWorkoutFromVoice]);

  // Spoken feedback via SpeechSynthesis
  const speakVoice = useCallback((text: string, onFinish?: () => void) => {
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
          if (onFinish) {
            onFinish();
          } else if (isVisibleRef.current) {
            setTimeout(startRecognition, 400);
          }
        };
        utterance.onerror = () => {
          setIsAiSpeaking(false);
          isAiSpeakingRef.current = false;
          if (onFinish) {
            onFinish();
          } else if (isVisibleRef.current) {
            setTimeout(startRecognition, 400);
          }
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
        if (onFinish) onFinish();
      }
    } else {
      if (onFinish) onFinish();
    }
  }, [speechLang, stopRecognition]);

  // Process user message (speech or text)
  const handleUserMessage = useCallback(async (userText: string) => {
    if (!userText || !userText.trim()) return;
    const cleanText = userText.trim();
    setCurrentTranscript('');
    setTextInput('');
    accumulatedContextRef.current += ` ${cleanText}`;

    stopRecognition();
    setMessages(prev => [...prev, { role: 'user', text: cleanText }]);

    const lower = cleanText.toLowerCase();

    // Check readiness triggers
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
      const confirmText = translate('workout.loading.calculating') || "C'est parti ! Je génère votre séance avec le coach 3D.";
      setMessages(prev => [...prev, { role: 'assistant', text: confirmText }]);
      speakVoice(confirmText, () => {
        executeWorkoutLaunch(accumulatedContextRef.current);
      });
      return;
    }

    // Call server-side Gemini
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
        speakVoice(displayText, () => {
          executeWorkoutLaunch(accumulatedContextRef.current);
        });
      } else {
        speakVoice(displayText);
      }
    } catch (err) {
      console.warn("AI Coach response error:", err);
      const fallbackMsg = "Bien reçu ! Quel type d'exercices souhaitez-vous cibler aujourd'hui ?";
      setMessages(prev => [...prev, { role: 'assistant', text: fallbackMsg }]);
      speakVoice(fallbackMsg);
    } finally {
      setIsThinking(false);
      isThinkingRef.current = false;
    }
  }, [messages, language, translate, speakVoice, stopRecognition, executeWorkoutLaunch]);

  // Start continuous microphone recognition
  const startRecognition = useCallback(async () => {
    if (!isVisibleRef.current) return;
    if (isAiSpeakingRef.current || isThinkingRef.current) return;

    // 1. Explicitly request microphone stream if not yet granted so browser prompts once
    if (micPermissionGranted === null) {
      try {
        if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(t => t.stop());
          setMicPermissionGranted(true);
        }
      } catch (micErr) {
        console.warn("Microphone permission prompt:", micErr);
        setMicPermissionGranted(false);
      }
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser');
      setIsListening(false);
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
        if (isAiSpeakingRef.current || isThinkingRef.current) return;

        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }

        const spoken = fullTranscript.trim();
        if (spoken) {
          setCurrentTranscript(spoken);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            handleUserMessage(spoken);
          }, 1100);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isListeningRef.current = false;
          setIsListening(false);
          setMicPermissionGranted(false);
        }
      };

      recognition.onend = () => {
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
      console.warn('Speech recognition start failed:', e);
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [speechLang, handleUserMessage]);

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

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleUserMessage(textInput.trim());
  };

  // Reset state on modal open
  useEffect(() => {
    if (!isVisible) {
      cleanupAudio();
      return;
    }
    
    setMessages([]);
    setCurrentTranscript('');
    setTextInput('');
    accumulatedContextRef.current = '';

    // Auto-listen
    startRecognition();

    return () => {
      cleanupAudio();
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const quickOptions = QUICK_PROMPTS[language] || QUICK_PROMPTS[Language.EN];
  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  return (
    <div 
      className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-full bg-black/95 backdrop-blur-2xl z-[9999] flex flex-col items-center justify-between font-['Poppins'] overflow-hidden select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* TOP BAR */}
      <div className="w-full max-w-lg flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(138,43,226,0.5)]">
            <Bot className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-widest leading-none flex items-center gap-1.5">
              <span>{translate('chatbot.title')}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">IA LIVE</span>
            </h2>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1.5">
              <span className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-cyan-400 animate-ping' : isListening ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`}></span>
              {isAiSpeaking ? 'Coach en train de parler...' : isListening ? 'Microphone actif (Parlez)' : 'En attente...'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute Voice Toggle */}
          <button 
            type="button"
            onClick={() => setIsMuted(prev => !prev)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${
              isMuted ? 'bg-red-950/80 border-red-500/50 text-red-400' : 'bg-white/10 border-white/15 text-gray-300 hover:text-white'
            }`}
            title={isMuted ? 'Voix coupée' : 'Voix active'}
          >
            {isMuted ? <MicOff size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Close */}
          <button 
            type="button"
            onClick={() => { cleanupAudio(); onClose(); }}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* CENTRAL CONVERSATION & VISUALIZER */}
      <div className="w-full max-w-lg flex-1 flex flex-col items-center justify-between px-5 py-3 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* VOICE VISUALIZER ORB */}
        <div className="relative flex items-center justify-center my-2 shrink-0">
          {isListening && (
            <>
              <div className="absolute w-44 h-44 rounded-full bg-purple-600/20 animate-ping [animation-duration:2.5s] pointer-events-none"></div>
              <div className="absolute w-36 h-36 rounded-full bg-emerald-500/25 animate-pulse pointer-events-none"></div>
            </>
          )}
          {isAiSpeaking && (
            <>
              <div className="absolute w-48 h-48 rounded-full bg-cyan-500/20 animate-ping [animation-duration:1.8s] pointer-events-none"></div>
              <div className="absolute w-40 h-40 rounded-full bg-purple-500/30 animate-pulse pointer-events-none"></div>
            </>
          )}

          <button
            type="button"
            onClick={toggleListening}
            className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 border-2 ${
              isAiSpeaking
                ? 'bg-gradient-to-tr from-purple-700 via-indigo-600 to-cyan-400 border-cyan-300 shadow-[0_0_50px_rgba(6,182,212,0.6)]'
                : isListening
                ? 'bg-gradient-to-tr from-purple-600 to-emerald-600 border-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
                : 'bg-zinc-900 border-purple-500/40 hover:border-purple-400 shadow-[0_0_30px_rgba(138,43,226,0.3)]'
            }`}
          >
            {isAiSpeaking ? (
              <div className="flex items-end gap-1 h-7">
                <div className="w-1.5 h-3 bg-white rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-delay:0.25s]"></div>
                <div className="w-1.5 h-5 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
                <div className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-delay:0.15s]"></div>
                <div className="w-1.5 h-3 bg-white rounded-full animate-bounce [animation-delay:0.35s]"></div>
              </div>
            ) : isListening ? (
              <>
                <Mic size={32} className="text-white animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-200 mt-1">À L'ÉCOUTE</span>
              </>
            ) : (
              <>
                <Mic size={32} className="text-purple-400 hover:text-white transition-colors" />
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-1">TOUCHER</span>
              </>
            )}
          </button>
        </div>

        {/* STATUS TITLE */}
        <div className="text-center space-y-0.5 shrink-0">
          <p className="text-xs sm:text-sm font-semibold text-white tracking-wide">
            {isAiSpeaking 
              ? 'Le coach vous répond...' 
              : isListening 
              ? 'Dites ce que vous voulez travailler...' 
              : COACH_TITLE_PROMPTS[language] || COACH_TITLE_PROMPTS[Language.EN]}
          </p>
        </div>

        {/* LIVE TRANSCRIPTS & CHAT HISTORY */}
        <div className="w-full space-y-2.5 flex-1 min-h-[90px] flex flex-col justify-end">
          {/* User speech or text message */}
          {(currentTranscript || lastUserMessage) && (
            <div className="flex justify-end w-full animate-fadeIn">
              <div className="max-w-[90%] rounded-2xl rounded-br-none px-4 py-2.5 bg-purple-900/60 border border-purple-500/40 text-purple-100 text-xs sm:text-sm leading-relaxed shadow-lg flex items-center justify-between gap-3">
                <div>
                  <span className="text-[8px] uppercase font-black text-purple-300 block">VOUS</span>
                  <p className="break-words">« {currentTranscript || lastUserMessage?.text} »</p>
                </div>
                {currentTranscript && (
                  <button
                    type="button"
                    onClick={() => handleUserMessage(currentTranscript)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-wider shrink-0"
                  >
                    Valider
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Coach thinking loader */}
          {isThinking && (
            <div className="flex justify-start w-full animate-fadeIn">
              <div className="rounded-2xl rounded-bl-none px-4 py-2.5 bg-zinc-900 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-purple-400" />
                <span className="animate-pulse">Le coach analyse avec Gemini 2.5...</span>
              </div>
            </div>
          )}

          {/* Coach spoken answer */}
          {lastAssistantMessage && !isThinking && (
            <div className="flex justify-start w-full animate-fadeIn">
              <div className="max-w-[92%] rounded-2xl rounded-bl-none px-4 py-3 bg-zinc-900/90 border border-purple-500/40 text-zinc-100 text-xs sm:text-sm leading-relaxed shadow-lg space-y-1">
                <div className="flex items-center gap-1.5">
                  <Bot size={13} className="text-purple-400" />
                  <span className="text-[9px] uppercase font-black text-purple-400">COACH IA FIT-4RCE X</span>
                </div>
                <p className="break-words whitespace-pre-wrap">{lastAssistantMessage.text}</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* QUICK SUGGESTION PILLS */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 shrink-0">
          {quickOptions.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleUserMessage(opt)}
              className="px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-purple-500/50 text-[10px] font-bold text-gray-300 hover:text-white whitespace-nowrap transition-all shrink-0 active:scale-95"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* BOTTOM INPUT BAR: BOTH VOICE AND TEXT WORK SEAMLESSLY */}
      <div className="w-full max-w-lg p-3 bg-neutral-950 border-t border-white/10 shrink-0">
        <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Écrivez ou dites vos souhaits d'exercices..."
            className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-all"
          />

          <button
            type="submit"
            disabled={!textInput.trim() || isThinking}
            className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center transition-all shrink-0 shadow-lg shadow-purple-900/30"
            title="Envoyer au coach"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AICoach;
