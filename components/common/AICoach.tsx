import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bot, Mic, MicOff, Volume2, X, Loader2 } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import { Language, WorkoutGenerationParams } from '../../types.ts';
import { getVoiceCoachResponse } from '../../services/aiService.ts';

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
  [Language.FR]: "Parlez ou touchez l'orbe pour dialoguer avec votre coach",
  [Language.ES]: "Habla o toca el orbe para dialogar con tu entrenadora",
  [Language.AR]: "تحدث أو المس الدائرة لبدء الحوار مع مدربتك",
  [Language.PT]: "Fale ou toque na esfera para conversar com sua treinadora",
  [Language.JA]: "話すかオーブをタップしてコーチと対話",
  [Language.ZH]: "说话或点击光球以与教练对话",
  [Language.RU]: "Говорите или нажмите на сферу для диалога с тренером",
  [Language.EN]: "Speak or tap the orb to talk with your coach"
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
    thinking: "Le coach analyse avec Gemini...",
    coachTitle: "COACH IA FIT FORCE",
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
    thinking: "Coach is analyzing with Gemini...",
    coachTitle: "FIT FORCE AI COACH",
    muteTitle: "Muted",
    unmuteTitle: "Voice active"
  },
  [Language.ES]: {
    speakingStatus: "Entrenadora hablando...",
    listeningStatus: "Micrófono activo (Habla ahora)",
    idleStatus: "En espera...",
    listeningBtn: "ESCUCHANDO",
    touchBtn: "TOCAR",
    speakingPrompt: "La entrenadora te responde...",
    listeningPrompt: "Dime qué quieres entrenar hoy...",
    you: "TÚ",
    thinking: "La entrenadora analiza con Gemini...",
    coachTitle: "ENTRENADORA IA FIT FORCE",
    muteTitle: "Silenciado",
    unmuteTitle: "Voz activa"
  },
  [Language.AR]: {
    speakingStatus: "المدربة تتحدث الآن...",
    listeningStatus: "الميكروفون نشط (تحدث الآن)",
    idleStatus: "في وضع الاستعداد...",
    listeningBtn: "يستمع الآن",
    touchBtn: "اضغط للتحدث",
    speakingPrompt: "المدربة تجيبك الآن...",
    listeningPrompt: "أخبرني ما الذي تريد تدريبه اليوم...",
    you: "أنت",
    thinking: "المدربة تحلل مع Gemini...",
    coachTitle: "مدربة FIT FORCE الذكية",
    muteTitle: "صامت",
    unmuteTitle: "الصوت نشط"
  },
  [Language.PT]: {
    speakingStatus: "Treinadora falando...",
    listeningStatus: "Microfone ativo (Fale agora)",
    idleStatus: "Aguardando...",
    listeningBtn: "OUVINDO",
    touchBtn: "TOQUE",
    speakingPrompt: "A treinadora está respondendo...",
    listeningPrompt: "Diga o que você quer treinar hoje...",
    you: "VOCÊ",
    thinking: "A treinadora analisa com Gemini...",
    coachTitle: "TREINADORA IA FIT FORCE",
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
    thinking: "Geminiでワークアウトを分析中...",
    coachTitle: "FIT FORCE AIコーチ",
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
    thinking: "教练正在使用Gemini分析训练...",
    coachTitle: "FIT FORCE AI教练",
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
    thinking: "Тренер анализирует с Gemini...",
    coachTitle: "ИИ ТРЕНЕР FIT FORCE",
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

  // Synchronous refs to prevent stale closures
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
  const startListeningRef = useRef<() => void>(() => {});
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<any>(null);
  const accumulatedContextRef = useRef<string>('');
  const geminiAudioRef = useRef<HTMLAudioElement | null>(null);

  const uiTexts = useMemo(() => {
    return COACH_UI_STRINGS[language] || COACH_UI_STRINGS[Language.EN];
  }, [language]);

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

  // Safely stop audio and microphone hardware
  const cleanupAudioHardware = useCallback(() => {
    isListeningRef.current = false;
    isAiSpeakingRef.current = false;
    isThinkingRef.current = false;
    setIsListening(false);
    setIsAiSpeaking(false);
    setIsThinking(false);

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (geminiAudioRef.current) {
      try {
        geminiAudioRef.current.pause();
        geminiAudioRef.current.src = '';
      } catch (e) {}
      geminiAudioRef.current = null;
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

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
    }
  }, []);

  // Stop microphone listening safely
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
  }, []);

  // Launch workout transition
  const executeWorkoutLaunch = useCallback((promptText: string) => {
    cleanupAudioHardware();
    const params = parseVoiceWorkoutParams(promptText || accumulatedContextRef.current || 'fitness');
    startWorkoutFromVoice(params);
  }, [cleanupAudioHardware, startWorkoutFromVoice]);

  // Play genuine, ultra-realistic Google Gemini WAV audio (Female voice: Kore)
  const playGeminiAudio = useCallback((base64Audio: string | null, onFinish?: () => void) => {
    if (isMutedRef.current || !base64Audio) {
      if (onFinish) onFinish();
      return;
    }

    stopListening();

    try {
      if (geminiAudioRef.current) {
        try {
          geminiAudioRef.current.pause();
          geminiAudioRef.current.src = '';
        } catch (e) {}
      }

      const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
      geminiAudioRef.current = audio;

      audio.onplay = () => {
        isAiSpeakingRef.current = true;
        setIsAiSpeaking(true);
      };

      audio.onended = () => {
        isAiSpeakingRef.current = false;
        setIsAiSpeaking(false);
        geminiAudioRef.current = null;
        if (onFinish) {
          onFinish();
        } else if (isVisibleRef.current) {
          // Immediately engage listening so conversation flows naturally
          startListeningRef.current();
        }
      };

      audio.onerror = () => {
        isAiSpeakingRef.current = false;
        setIsAiSpeaking(false);
        geminiAudioRef.current = null;
        if (onFinish) onFinish();
      };

      audio.play().catch(playErr => {
        console.warn('Audio play notice:', playErr);
        isAiSpeakingRef.current = false;
        setIsAiSpeaking(false);
        geminiAudioRef.current = null;
        if (onFinish) onFinish();
      });
    } catch (e) {
      isAiSpeakingRef.current = false;
      setIsAiSpeaking(false);
      if (onFinish) onFinish();
    }
  }, [stopListening]);

  // Dual-engine microphone: MediaRecorder fallback for Android WebView (WebIntoApp)
  const startMediaRecorderListening = useCallback(async () => {
    if (!isVisibleRef.current || isAiSpeakingRef.current || isThinkingRef.current) return;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsListening(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const recorder = new MediaRecorder(stream, { mimeType: mimeType as any });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          audioChunksRef.current = [];
          if (blob.size > 800) {
            submitAudioBlob(blob, recorder.mimeType || 'audio/webm');
          }
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start(250);
      isListeningRef.current = true;
      setIsListening(true);
    } catch (micErr) {
      console.warn('MediaRecorder permission or hardware notice:', micErr);
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, []);

  // Submit audio blob directly to Gemini for speech recognition & response
  const submitAudioBlob = async (blob: Blob, mimeType: string) => {
    isListeningRef.current = false;
    setIsListening(false);
    setIsThinking(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resultStr = reader.result as string;
        const base64data = resultStr ? resultStr.split(',')[1] : null;
        if (!base64data) {
          setIsThinking(false);
          return;
        }

        const historyList = messagesRef.current.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          text: m.text
        }));

        const res = await getVoiceCoachResponse({
          audioBase64: base64data,
          mimeType
        }, language, historyList);

        setIsThinking(false);
        setMessages(prev => [...prev, { role: 'assistant', text: res.text }]);
        accumulatedContextRef.current += ' ' + res.text;

        const shouldLaunch = res.text.includes('[GENERATE_WORKOUT]') ||
          /lance (ta|votre) s[eé]ance|g[eé]n[eè]re ta s[eé]ance/i.test(res.text);

        if (res.audio) {
          playGeminiAudio(res.audio, () => {
            if (shouldLaunch) executeWorkoutLaunch(accumulatedContextRef.current);
            else if (isVisibleRef.current) startListeningRef.current();
          });
        } else {
          if (shouldLaunch) executeWorkoutLaunch(accumulatedContextRef.current);
          else if (isVisibleRef.current) startListeningRef.current();
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Audio submit error:', err);
      setIsThinking(false);
      startListeningRef.current();
    }
  };

  // Submit text message to Gemini
  const submitTextMessage = useCallback(async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setCurrentTranscript('');
    currentTranscriptRef.current = '';
    stopListening();

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
      const res = await getVoiceCoachResponse({ msg: confirmText }, language);
      if (res.audio) {
        playGeminiAudio(res.audio, () => {
          executeWorkoutLaunch(accumulatedContextRef.current);
        });
      } else {
        executeWorkoutLaunch(accumulatedContextRef.current);
      }
      return;
    }

    setIsThinking(true);
    try {
      const historyList = messagesRef.current.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
      const res = await getVoiceCoachResponse({ msg: cleanText }, language, historyList);
      
      const shouldLaunch = res.text.includes('[GENERATE_WORKOUT]') ||
        /lance (ta|votre) s[eé]ance|g[eé]n[eè]re ta s[eé]ance|generating your|preparing your custom/i.test(res.text);

      const displayText = res.text.replace(/\[GENERATE_WORKOUT\]/g, '').trim();
      setMessages(prev => [...prev, { role: 'assistant', text: displayText }]);

      if (res.audio) {
        playGeminiAudio(res.audio, () => {
          if (shouldLaunch) {
            executeWorkoutLaunch(accumulatedContextRef.current);
          } else if (isVisibleRef.current) {
            startListeningRef.current();
          }
        });
      } else {
        if (shouldLaunch) {
          executeWorkoutLaunch(accumulatedContextRef.current);
        } else if (isVisibleRef.current) {
          startListeningRef.current();
        }
      }
    } catch (err) {
      console.warn("AI Coach response error:", err);
      const fallbackMsg = language === Language.FR 
        ? "Bien reçu ! Quel type d'exercices souhaitez-vous cibler aujourd'hui ?"
        : "Got it! Which muscle group or exercise style would you like to target today?";
      setMessages(prev => [...prev, { role: 'assistant', text: fallbackMsg }]);
      startListeningRef.current();
    } finally {
      setIsThinking(false);
    }
  }, [language, translate, playGeminiAudio, stopListening, executeWorkoutLaunch]);

  handleUserMessageRef.current = submitTextMessage;

  // Dual-Engine Listening Startup: Web Speech API on Chrome PC/Mobile with automatic MediaRecorder fallback for Android WebView
  const startListening = useCallback(() => {
    if (!isVisibleRef.current) return;
    if (isAiSpeakingRef.current || isThinkingRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.abort();
          } catch (e) {}
          recognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = speechLang;

        const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        recognition.continuous = !isMobile;
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
            if (item.isFinal) finalText += item[0].transcript + ' ';
            else interimText += item[0].transcript + ' ';
          }

          const spoken = (finalText || interimText).trim();
          if (spoken) {
            setCurrentTranscript(spoken);
            currentTranscriptRef.current = spoken;

            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            const delay = finalText.trim() ? 600 : 900;
            silenceTimerRef.current = setTimeout(() => {
              const toSend = currentTranscriptRef.current.trim();
              if (toSend) {
                submitTextMessage(toSend);
              }
            }, delay);
          }
        };

        recognition.onerror = (event: any) => {
          const errType = event?.error;
          if (errType === 'no-speech') return;
          console.warn('SpeechRecognition notice:', errType);
          // On mobile Android WebView, if speech service is not available, switch to MediaRecorder
          if (errType === 'not-allowed' || errType === 'service-not-allowed') {
            startMediaRecorderListening();
          }
        };

        recognition.onend = () => {
          if (currentTranscriptRef.current && currentTranscriptRef.current.trim()) {
            const pending = currentTranscriptRef.current.trim();
            currentTranscriptRef.current = '';
            submitTextMessage(pending);
            return;
          }

          if (isVisibleRef.current && isListeningRef.current && !isAiSpeakingRef.current && !isThinkingRef.current) {
            setTimeout(() => {
              if (isVisibleRef.current && isListeningRef.current && !isAiSpeakingRef.current && !isThinkingRef.current) {
                try {
                  recognition.start();
                } catch (e) {
                  startListening();
                }
              }
            }, 120);
          } else {
            setIsListening(false);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        isListeningRef.current = true;
        setIsListening(true);
        return;
      } catch (speechErr) {
        console.warn('SpeechRecognition start failed, using MediaRecorder:', speechErr);
      }
    }

    // Direct MediaRecorder fallback for WebIntoApp APK & browsers without Web Speech API
    startMediaRecorderListening();
  }, [speechLang, submitTextMessage, startMediaRecorderListening]);

  startListeningRef.current = startListening;

  // Toggle listening via central orb tap
  const toggleListening = () => {
    // If AI is currently speaking, user tap interrupts the coach and immediately switches to listening
    if (isAiSpeaking) {
      if (geminiAudioRef.current) {
        try { geminiAudioRef.current.pause(); } catch (e) {}
        geminiAudioRef.current = null;
      }
      setIsAiSpeaking(false);
      startListening();
      return;
    }

    if (isListening) {
      stopListening();
      if (currentTranscriptRef.current.trim()) {
        const text = currentTranscriptRef.current.trim();
        currentTranscriptRef.current = '';
        submitTextMessage(text);
      }
    } else {
      startListening();
    }
  };

  // 1-CLICK DIRECT STARTUP: Request Gemini greeting with real female voice and immediately begin listening
  useEffect(() => {
    if (!isVisible) {
      cleanupAudioHardware();
      return;
    }

    setCurrentTranscript('');
    currentTranscriptRef.current = '';
    accumulatedContextRef.current = '';

    // Directly load the genuine Gemini greeting (voice Kore)
    getVoiceCoachResponse({ msg: '__GREETING__' }, language).then(res => {
      if (!isVisibleRef.current) return;
      setMessages([{ role: 'assistant', text: res.text }]);

      if (res.audio && !isMutedRef.current) {
        playGeminiAudio(res.audio, () => {
          if (isVisibleRef.current && !isAiSpeakingRef.current) {
            startListening();
          }
        });
      } else {
        startListening();
      }
    }).catch(() => {
      if (isVisibleRef.current) {
        startListening();
      }
    });

    return () => {
      cleanupAudioHardware();
    };
  }, [isVisible, language, playGeminiAudio, startListening, cleanupAudioHardware]);

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
              onClick={() => handleUserMessageRef.current(opt)}
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
