import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bot, Mic, MicOff, Volume2, X, Loader2 } from 'lucide-react';
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
  [Language.FR]: "Parlez ou touchez le micro pour lancer votre séance sur mesure",
  [Language.ES]: "Habla o toca el micrófono para iniciar tu entrenamiento a medida",
  [Language.AR]: "تحدث أو اضغط على الميكروفون لبدء تمرينك المخصص",
  [Language.PT]: "Fale ou toque no microfone para iniciar seu treino personalizado",
  [Language.JA]: "話すかマイクをタップして専用ワークアウトを開始",
  [Language.ZH]: "说话或点击麦克风以开始定制训练",
  [Language.RU]: "Говорите или нажмите на микрофон, чтобы начать тренировку",
  [Language.EN]: "Speak or tap the microphone to generate your custom workout"
};

const COACH_UI_STRINGS: Record<Language, {
  speakingStatus: string;
  listeningStatus: string;
  idleStatus: string;
  listeningBtn: string;
  touchBtn: string;
  speakingPrompt: string;
  listeningPrompt: string;
  you: string;
  thinking: string;
  coachTitle: string;
  muteTitle: string;
  unmuteTitle: string;
}> = {
  [Language.FR]: {
    speakingStatus: "Coach en train de parler...",
    listeningStatus: "Microphone actif (Parlez)",
    idleStatus: "En attente...",
    listeningBtn: "À L'ÉCOUTE",
    touchBtn: "TOUCHER",
    speakingPrompt: "Le coach vous répond...",
    listeningPrompt: "Dites ce que vous voulez travailler...",
    you: "VOUS",
    thinking: "Le coach analyse avec Gemini 2.5...",
    coachTitle: "COACH IA FIT-4RCE X",
    muteTitle: "Voix coupée",
    unmuteTitle: "Voix active"
  },
  [Language.EN]: {
    speakingStatus: "Coach speaking...",
    listeningStatus: "Microphone active (Speak now)",
    idleStatus: "Standby...",
    listeningBtn: "LISTENING",
    touchBtn: "TAP TO SPEAK",
    speakingPrompt: "Coach is replying...",
    listeningPrompt: "Tell me what you'd like to train...",
    you: "YOU",
    thinking: "Coach is analyzing with Gemini 2.5...",
    coachTitle: "FIT-4RCE X AI COACH",
    muteTitle: "Muted",
    unmuteTitle: "Voice active"
  },
  [Language.ES]: {
    speakingStatus: "Entrenador hablando...",
    listeningStatus: "Micrófono activo (Habla ahora)",
    idleStatus: "En espera...",
    listeningBtn: "ESCUCHANDO",
    touchBtn: "TOCAR",
    speakingPrompt: "El entrenador te responde...",
    listeningPrompt: "Dime qué quieres entrenar hoy...",
    you: "TÚ",
    thinking: "El entrenador analiza con Gemini 2.5...",
    coachTitle: "ENTRENADOR IA FIT-4RCE X",
    muteTitle: "Silenciado",
    unmuteTitle: "Voz activa"
  },
  [Language.AR]: {
    speakingStatus: "المدرب يتحدث الآن...",
    listeningStatus: "الميكروفون نشط (تحدث الآن)",
    idleStatus: "في وضع الاستعداد...",
    listeningBtn: "يستمع الآن",
    touchBtn: "اضغط للتحدث",
    speakingPrompt: "المدرب يجيبك الآن...",
    listeningPrompt: "أخبرني ما الذي تريد تدريبه اليوم...",
    you: "أنت",
    thinking: "المدرب يحلل مع Gemini 2.5...",
    coachTitle: "مدرب FIT-4RCE X الذكي",
    muteTitle: "صامت",
    unmuteTitle: "الصوت نشط"
  },
  [Language.PT]: {
    speakingStatus: "Treinador falando...",
    listeningStatus: "Microfone ativo (Fale agora)",
    idleStatus: "Aguardando...",
    listeningBtn: "OUVINDO",
    touchBtn: "TOQUE",
    speakingPrompt: "O treinador está respondendo...",
    listeningPrompt: "Diga o que você quer treinar hoje...",
    you: "VOCÊ",
    thinking: "O treinador analisa com Gemini 2.5...",
    coachTitle: "TREINADOR IA FIT-4RCE X",
    muteTitle: "Voz silenciada",
    unmuteTitle: "Voz ativa"
  },
  [Language.JA]: {
    speakingStatus: "コーチが話しています...",
    listeningStatus: "マイク有効（話してください）",
    idleStatus: "待機中...",
    listeningBtn: "聞き取り中",
    touchBtn: "タップして話す",
    speakingPrompt: "コーチが回答しています...",
    listeningPrompt: "鍛えたい部位や目標を教えてください...",
    you: "あなた",
    thinking: "Gemini 2.5でワークアウトを分析中...",
    coachTitle: "FIT-4RCE X AIコーチ",
    muteTitle: "ミュート中",
    unmuteTitle: "音声有効"
  },
  [Language.ZH]: {
    speakingStatus: "教练正在讲话...",
    listeningStatus: "麦克风已激活（请讲话）",
    idleStatus: "等待中...",
    listeningBtn: "正在倾听",
    touchBtn: "点击说话",
    speakingPrompt: "教练正在回应您...",
    listeningPrompt: "请告诉我您今天想训练什么...",
    you: "您",
    thinking: "教练正在使用Gemini 2.5分析训练...",
    coachTitle: "FIT-4RCE X AI教练",
    muteTitle: "已静音",
    unmuteTitle: "语音已开启"
  },
  [Language.RU]: {
    speakingStatus: "Тренер говорит...",
    listeningStatus: "Микрофон активен (Говорите)",
    idleStatus: "Ожидание...",
    listeningBtn: "СЛУШАЮ",
    touchBtn: "НАЖМИТЕ",
    speakingPrompt: "Тренер отвечает вам...",
    listeningPrompt: "Скажите, какую группу мышц хотите тренировать...",
    you: "ВЫ",
    thinking: "Тренер анализирует с Gemini 2.5...",
    coachTitle: "ИИ ТРЕНЕР FIT-4RCE X",
    muteTitle: "Звук отключен",
    unmuteTitle: "Звук включен"
  }
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
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Synchronous refs to prevent stale closures and avoid useEffect re-render cascades
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;

  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const isAiSpeakingRef = useRef(isAiSpeaking);
  isAiSpeakingRef.current = isAiSpeaking;

  const isThinkingRef = useRef(isThinking);
  isThinkingRef.current = isThinking;

  const currentTranscriptRef = useRef(currentTranscript);
  currentTranscriptRef.current = currentTranscript;

  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  const handleUserMessageRef = useRef<(text: string) => void>(() => {});
  const startRecognitionRef = useRef<() => void>(() => {});
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const accumulatedContextRef = useRef<string>('');

  const uiTexts = useMemo(() => {
    return COACH_UI_STRINGS[language] || COACH_UI_STRINGS[Language.EN];
  }, [language]);

  // Map app language to standard SpeechRecognition BCP-47 locale
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

  // Clean up audio & speech engines without setting state (safe for unmount / effect cleanup)
  const cleanupAudioHardware = useCallback(() => {
    isListeningRef.current = false;
    isAiSpeakingRef.current = false;
    isThinkingRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
  }, []);

  // Stop microphone listening safely and update UI state
  const stopRecognition = useCallback(() => {
    cleanupAudioHardware();
    setIsListening(false);
  }, [cleanupAudioHardware]);

  // Launch workout transition
  const executeWorkoutLaunch = useCallback((promptText: string) => {
    cleanupAudioHardware();
    setIsListening(false);
    setIsAiSpeaking(false);
    setIsThinking(false);
    const params = parseVoiceWorkoutParams(promptText || accumulatedContextRef.current || 'fitness');
    startWorkoutFromVoice(params);
  }, [cleanupAudioHardware, startWorkoutFromVoice]);

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
        };
        utterance.onend = () => {
          setIsAiSpeaking(false);
          if (onFinish) {
            onFinish();
          } else if (isVisibleRef.current) {
            setTimeout(() => {
              if (isVisibleRef.current && !isAiSpeakingRef.current && !isThinkingRef.current) {
                startRecognitionRef.current();
              }
            }, 300);
          }
        };
        utterance.onerror = () => {
          setIsAiSpeaking(false);
          if (onFinish) {
            onFinish();
          }
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        setIsAiSpeaking(false);
        if (onFinish) onFinish();
      }
    } else {
      if (onFinish) onFinish();
    }
  }, [speechLang, stopRecognition]);

  // User message submit handler
  const handleUserMessage = useCallback(async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setCurrentTranscript('');
    currentTranscriptRef.current = '';
    stopRecognition();

    setMessages(prev => [...prev, { role: 'user', text: cleanText }]);
    accumulatedContextRef.current = (accumulatedContextRef.current ? accumulatedContextRef.current + ' ' : '') + cleanText;

    const lower = cleanText.toLowerCase();
    const isReadyTrigger = (
      lower.includes('prêt') || lower.includes('pret') || lower.includes('lance') ||
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

    // Call server-side Gemini / rich conversational intelligence
    setIsThinking(true);
    try {
      const historyList = messagesRef.current.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
      const aiReply = await getChatbotResponse(cleanText, language, historyList);
      
      const shouldLaunch = aiReply.includes('[GENERATE_WORKOUT]') ||
        /je (te|vous) g[eé]n[eè]re|g[eé]n[eè]ration de (tes|vos) exercices|je lance (ta|votre) s[eé]ance|g[eé]n[eè]re ta s[eé]ance|generating your|preparing your custom|prépare vos exercices/i.test(aiReply);

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
      const fallbackMsg = language === Language.FR 
        ? "Bien reçu ! Quel type d'exercices souhaitez-vous cibler aujourd'hui ?"
        : "Got it! Which muscle group or exercise style would you like to target today?";
      setMessages(prev => [...prev, { role: 'assistant', text: fallbackMsg }]);
      speakVoice(fallbackMsg);
    } finally {
      setIsThinking(false);
    }
  }, [language, translate, speakVoice, stopRecognition, executeWorkoutLaunch]);

  // Keep handleUserMessage ref in sync synchronously
  handleUserMessageRef.current = handleUserMessage;

  // Start continuous microphone recognition with Web Speech API
  const startRecognition = useCallback(() => {
    if (!isVisibleRef.current) return;
    if (isAiSpeakingRef.current || isThinkingRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser');
      setIsListening(false);
      return;
    }

    if (recognitionRef.current) {
      try { 
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort(); 
      } catch (e) {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      // On Android Chrome continuous=false prevents hangs and enables responsive speech
      const isMobileDevice = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      recognition.continuous = !isMobileDevice;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        if (isAiSpeakingRef.current || isThinkingRef.current) return;

        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalText += item[0].transcript + ' ';
          } else {
            interimText += item[0].transcript + ' ';
          }
        }

        const spoken = (finalText || interimText).trim();
        if (spoken) {
          setCurrentTranscript(spoken);
          currentTranscriptRef.current = spoken;
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            const toSend = currentTranscriptRef.current.trim();
            if (toSend) {
              handleUserMessageRef.current(toSend);
            }
          }, 950);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition status:', event?.error);
        isListeningRef.current = false;
        setIsListening(false);
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
        // If there was text waiting to be processed when silence ended, send it immediately
        if (currentTranscriptRef.current && currentTranscriptRef.current.trim()) {
          const pending = currentTranscriptRef.current.trim();
          currentTranscriptRef.current = '';
          handleUserMessageRef.current(pending);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      isListeningRef.current = true;
      setIsListening(true);
    } catch (e) {
      console.warn('Speech recognition start error:', e);
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [speechLang]);

  startRecognitionRef.current = startRecognition;

  // Click on the turquoise orb: direct user gesture triggers mic permission + toggles or validates immediately
  const toggleListening = async () => {
    if (isListening) {
      stopRecognition();
      if (currentTranscriptRef.current.trim()) {
        const text = currentTranscriptRef.current.trim();
        currentTranscriptRef.current = '';
        handleUserMessage(text);
      }
    } else {
      // Direct user click: prompt browser for microphone permission
      try {
        if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(t => t.stop());
        }
      } catch (e) {
        console.warn("User mic activation prompt:", e);
      }
      startRecognition();
    }
  };

  // Reset state on modal open - strictly triggers only once when isVisible becomes true
  useEffect(() => {
    if (!isVisible) {
      cleanupAudioHardware();
      return;
    }
    
    setMessages([]);
    setCurrentTranscript('');
    currentTranscriptRef.current = '';
    accumulatedContextRef.current = '';

    return () => {
      cleanupAudioHardware();
    };
  }, [isVisible, cleanupAudioHardware]);

  if (!isVisible) return null;

  const quickOptions = QUICK_PROMPTS[language] || QUICK_PROMPTS[Language.EN];
  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');

  return (
    <div 
      className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-full bg-black/95 backdrop-blur-2xl z-[9999] flex flex-col items-center justify-between font-['Poppins'] overflow-hidden select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* TOP BAR */}
      <div className="w-full max-w-lg flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Bot className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-widest leading-none flex items-center gap-1.5">
              <span>{translate('chatbot.title')}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">IA LIVE</span>
            </h2>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1.5">
              <span className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-cyan-300 animate-ping' : isListening ? 'bg-teal-400 animate-pulse' : 'bg-cyan-800'}`}></span>
              {isAiSpeaking ? uiTexts.speakingStatus : isListening ? uiTexts.listeningStatus : uiTexts.idleStatus}
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
            title={isMuted ? uiTexts.muteTitle : uiTexts.unmuteTitle}
          >
            {isMuted ? <MicOff size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Close */}
          <button 
            type="button"
            onClick={() => { cleanupAudioHardware(); onClose(); }}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* CENTRAL CONVERSATION & VISUALIZER - EXACTLY IN THE MIDDLE OF THE SCREEN */}
      <div className="w-full max-w-lg flex-1 flex flex-col items-center justify-center px-5 py-4 space-y-6 overflow-hidden">
        
        {/* VOICE VISUALIZER ORB - LE MERVEILLEUX CERCLE BLEU TURQUOISE AU MILIEU */}
        <div className="relative flex items-center justify-center shrink-0">
          {isListening && (
            <>
              <div className="absolute w-48 h-48 rounded-full bg-cyan-500/25 animate-ping [animation-duration:2.2s] pointer-events-none"></div>
              <div className="absolute w-40 h-40 rounded-full bg-teal-400/30 animate-pulse pointer-events-none"></div>
            </>
          )}
          {isAiSpeaking && (
            <>
              <div className="absolute w-52 h-52 rounded-full bg-cyan-400/30 animate-ping [animation-duration:1.8s] pointer-events-none"></div>
              <div className="absolute w-44 h-44 rounded-full bg-teal-300/35 animate-pulse pointer-events-none"></div>
            </>
          )}

          <button
            type="button"
            onClick={toggleListening}
            className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 active:scale-95 border-2 ${
              isAiSpeaking
                ? 'bg-gradient-to-tr from-cyan-500 via-teal-400 to-cyan-300 border-white shadow-[0_0_60px_rgba(6,182,212,0.95)]'
                : isListening
                ? 'bg-gradient-to-tr from-cyan-600 via-cyan-400 to-teal-300 border-cyan-200 shadow-[0_0_50px_rgba(6,182,212,0.85)]'
                : 'bg-gradient-to-tr from-cyan-950 via-cyan-900 to-teal-950 border-cyan-500/60 hover:border-cyan-400 text-cyan-300 shadow-[0_0_35px_rgba(6,182,212,0.5)]'
            }`}
          >
            {isAiSpeaking ? (
              <div className="flex items-end gap-1.5 h-8">
                <div className="w-1.5 h-3 bg-white rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-1.5 h-7 bg-white rounded-full animate-bounce [animation-delay:0.25s]"></div>
                <div className="w-1.5 h-5 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
                <div className="w-1.5 h-7 bg-white rounded-full animate-bounce [animation-delay:0.15s]"></div>
                <div className="w-1.5 h-3 bg-white rounded-full animate-bounce [animation-delay:0.35s]"></div>
              </div>
            ) : isListening ? (
              <>
                <Mic size={36} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white drop-shadow-[0_0_6px_rgba(6,182,212,0.8)] mt-1.5">
                  {uiTexts.listeningBtn}
                </span>
              </>
            ) : (
              <>
                <Mic size={36} className="text-cyan-300 hover:text-white transition-colors drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300 mt-1.5">
                  {uiTexts.touchBtn}
                </span>
              </>
            )}
          </button>
        </div>

        {/* STATUS TITLE UNDER ORB */}
        <div className="text-center space-y-1 shrink-0 max-w-xs px-2">
          <p className="text-xs sm:text-sm font-semibold text-white tracking-wide">
            {isAiSpeaking 
              ? uiTexts.speakingPrompt
              : isListening 
              ? uiTexts.listeningPrompt
              : COACH_TITLE_PROMPTS[language] || COACH_TITLE_PROMPTS[Language.EN]}
          </p>
        </div>

        {/* LIVE SPOKEN TRANSCRIPTION & AI FEEDBACK IN CENTER */}
        <div className="w-full max-w-md min-h-[50px] flex flex-col items-center justify-center text-center px-4">
          {currentTranscript && (
            <div className="animate-fadeIn px-4 py-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 text-xs sm:text-sm shadow-lg">
              <span className="text-[8px] font-black uppercase text-cyan-400 block mb-0.5">{uiTexts.you}</span>
              <p className="font-medium italic">« {currentTranscript} »</p>
            </div>
          )}

          {isThinking && (
            <div className="animate-fadeIn flex items-center gap-2 text-cyan-400 text-xs py-2">
              <Loader2 size={16} className="animate-spin text-cyan-400" />
              <span className="animate-pulse">{uiTexts.thinking}</span>
            </div>
          )}

          {lastAssistantMessage && !isThinking && !currentTranscript && (
            <div className="animate-fadeIn px-4 py-3 rounded-2xl bg-zinc-900/90 border border-cyan-500/40 text-zinc-100 text-xs sm:text-sm leading-relaxed max-w-sm shadow-lg">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Bot size={13} className="text-cyan-400" />
                <span className="text-[9px] uppercase font-black text-cyan-400">{uiTexts.coachTitle}</span>
              </div>
              <p className="break-words">{lastAssistantMessage.text}</p>
            </div>
          )}
        </div>

        {/* QUICK SUGGESTION PILLS AT BOTTOM */}
        <div className="w-full flex items-center justify-center gap-2 flex-wrap pt-2 shrink-0">
          {quickOptions.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleUserMessage(opt)}
              className="px-3.5 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-500/50 text-[10px] sm:text-xs font-bold text-gray-300 hover:text-white transition-all active:scale-95 shadow-md"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* FOOTER PADDING */}
      <div className="w-full h-4 shrink-0" />
    </div>
  );
};

export default AICoach;
