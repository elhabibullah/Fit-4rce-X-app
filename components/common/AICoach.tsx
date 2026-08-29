import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Mic, MicOff } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import { AIProvider, WorkoutGenerationParams, Language } from '../../types.ts';

interface AICoachProps {
  isVisible: boolean;
  onClose: () => void;
}

interface AudioBlobPayload {
  data: string;
  mimeType: string;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): AudioBlobPayload {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    int16[i] = sample < 0 ? sample * 32768 : sample * 32767;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function downsampleAndEncode(buffer: Float32Array, inputSampleRate: number, targetSampleRate: number = 16000): AudioBlobPayload {
  if (inputSampleRate === targetSampleRate) {
    return createBlob(buffer);
  }
  const ratio = inputSampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return createBlob(result);
}

type CoachStatusCode = 'initializing' | 'listening' | 'speaking' | 'mic_restricted' | 'conn_error' | 'link_closed';

// Helper to extract workout parameters from spoken text across languages
function parseVoiceWorkoutParams(text: string): WorkoutGenerationParams {
  const lower = text.toLowerCase();
  let workoutType: string = 'fitness';
  let intensity: string = 'medium';
  const targetArea: string[] = [];

  // Discipline detection
  if (lower.includes('calisthén') || lower.includes('calisthen') || lower.includes('poids du corps') || lower.includes('كاليستثنيكس') || lower.includes('calistenia') || lower.includes('自重') || lower.includes('калистеник')) {
    workoutType = 'calisthenics';
  } else if (lower.includes('powerlifting') || lower.includes('force') || lower.includes('muscu') || lower.includes('haltère') || lower.includes('fonte') || lower.includes('قوة') || lower.includes('fuerza') || lower.includes('força') || lower.includes('силов') || lower.includes('力量')) {
    workoutType = 'powerlifting';
  } else if (lower.includes('pilates') || lower.includes('بيلاتس') || lower.includes('ピラティス') || lower.includes('普拉提') || lower.includes('пилатес')) {
    workoutType = 'pilates';
  } else if (lower.includes('yoga') || lower.includes('souplesse') || lower.includes('étirement') || lower.includes('stretching') || lower.includes('يوغا') || lower.includes('يوجا') || lower.includes('ヨガ') || lower.includes('瑜伽') || lower.includes('йог')) {
    workoutType = 'yoga';
  }

  // Intensity detection
  if (lower.includes('intense') || lower.includes('dur') || lower.includes('max') || lower.includes('high') || lower.includes('explosif') || lower.includes('عالي') || lower.includes('alta') || lower.includes('forte') || lower.includes('тяжел') || lower.includes('高强度')) {
    intensity = 'high';
  } else if (lower.includes('léger') || lower.includes('light') || lower.includes('doux') || lower.includes('facile') || lower.includes('خفيف') || lower.includes('suave') || lower.includes('мягк') || lower.includes('低强度')) {
    intensity = 'low';
  }

  // Target areas
  if (lower.includes('abdo') || lower.includes('ventre') || lower.includes('abs') || lower.includes('core') || lower.includes('بطن') || lower.includes('abdomen') || lower.includes('пресс')) {
    targetArea.push('abs');
  }
  if (lower.includes('jambe') || lower.includes('cuisse') || lower.includes('squat') || lower.includes('leg') || lower.includes('ساق') || lower.includes('pierna') || lower.includes('perna') || lower.includes('ноги')) {
    targetArea.push('legs');
  }
  if (lower.includes('bras') || lower.includes('biceps') || lower.includes('triceps') || lower.includes('arm') || lower.includes('ذراع') || lower.includes('brazo') || lower.includes('braço') || lower.includes('руки')) {
    targetArea.push('arms');
  }
  if (lower.includes('pector') || lower.includes('pec') || lower.includes('chest') || lower.includes('صدر') || lower.includes('pecho') || lower.includes('peito') || lower.includes('грудь')) {
    targetArea.push('chest');
  }

  if (targetArea.length === 0) {
    targetArea.push('full body');
  }

  return {
    workoutType: workoutType as any,
    intensity: intensity as any,
    targetArea,
    customPrompt: text
  };
}

const AICoach: React.FC<AICoachProps> = ({ isVisible, onClose }) => {
  const { profile, language, selectedCoachPersona, startWorkoutFromVoice, setIsGeneratingWorkout, translate } = useApp();
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState<{ user: string; ai: string }>({ user: '', ai: '' });
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [statusCode, setStatusCode] = useState<CoachStatusCode>('initializing');
  const [volume, setVolume] = useState(0);
  const [isMicGranted, setIsMicGranted] = useState(false);
  const [lastDetectedIntent, setLastDetectedIntent] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const audioResourcesRef = useRef<any>({});
  const isMutedRef = useRef(isMuted);
  const recognitionRef = useRef<any>(null);
  const isSessionStartingRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef(isVisible);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    if (audioResourcesRef.current.outputGainNode) {
      audioResourcesRef.current.outputGainNode.gain.value = isMuted ? 0 : 1.0;
    }
  }, [isMuted]);

  const voiceName = useMemo(() => {
    const voiceMap: Record<AIProvider, string> = { gemini: 'Zephyr', anthropic: 'Kore', openai: 'Puck', perplexity: 'Fenrir' };
    return voiceMap[selectedCoachPersona] || 'Zephyr';
  }, [selectedCoachPersona]);

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

  const systemPrompt = useMemo(() => {
    return `You are Fit-4rce-X AI Coach. You are a world-class physical trainer. Goal: ${profile?.goal?.join(', ') || 'fitness'}. You MUST always communicate in the user's language: ${language}.
When the user speaks with you and says they are ready to start workout, or confirms readiness (e.g. "I am ready", "je suis prêt", "c'est parti", "start workout", "prépare la séance", "lance"), answer briefly with encouragement and call the startWorkoutGeneration tool immediately so their workout video session is generated and presented.`;
  }, [profile, language]);

  const triggerWorkoutStart = useCallback((args?: WorkoutGenerationParams) => {
    const finalParams = args || { workoutType: 'fitness', intensity: 'medium' };
    setIsGeneratingWorkout(true);
    onClose();
    startWorkoutFromVoice(finalParams);
  }, [setIsGeneratingWorkout, onClose, startWorkoutFromVoice]);

  // Text-to-speech fallback
  const speakCoachFeedback = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && !isMutedRef.current) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechLang;
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.onstart = () => {
          setIsAiSpeaking(true);
          setStatusCode('speaking');
        };
        utterance.onend = () => {
          setIsAiSpeaking(false);
          setStatusCode('listening');
        };
        utterance.onerror = () => {
          setIsAiSpeaking(false);
          setStatusCode('listening');
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('SpeechSynthesis error:', e);
      }
    }
  }, [speechLang]);

  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (sessionRef.current && sessionRef.current instanceof WebSocket) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    const res = audioResourcesRef.current;
    if (res.stream) {
      try { res.stream.getTracks().forEach((t: any) => t.stop()); } catch (e) {}
    }
    if (res.inputAudioContext) {
      try { res.inputAudioContext.close().catch(() => {}); } catch (e) {}
    }
    if (res.outputAudioContext) {
      try { res.outputAudioContext.close().catch(() => {}); } catch (e) {}
    }
    audioResourcesRef.current = {};
    isSessionStartingRef.current = false;
  }, []);

  const initWebSpeechAPI = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        return;
      } catch (e) {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsMicGranted(true);
        setStatusCode('listening');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptChunk;
          } else {
            interimTranscript += transcriptChunk;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (currentText) {
          setTranscription(prev => ({ ...prev, user: currentText }));
          const lower = currentText.toLowerCase();

          // Check for trigger phrases across all 8 languages
          const isLaunchTrigger = (
            lower.includes('prêt') || lower.includes('pret') ||
            lower.includes('ready') || lower.includes('commencer') ||
            lower.includes('parti') || lower.includes('lance') ||
            lower.includes('start') || lower.includes('train') || lower.includes('let\'s go') ||
            lower.includes('جاهز') || lower.includes('ابدأ') || lower.includes('يلا') ||
            lower.includes('listo') || lower.includes('vamos') || lower.includes('empezar') ||
            lower.includes('pronto') || lower.includes('começar') || lower.includes('iniciar') ||
            lower.includes('準備') || lower.includes('開始') || lower.includes('スタート') ||
            lower.includes('开始') || lower.includes('准备好了') ||
            lower.includes('готов') || lower.includes('старт') || lower.includes('поехали')
          );

          if (isLaunchTrigger) {
            const detectedParams = parseVoiceWorkoutParams(currentText);
            setLastDetectedIntent(`${detectedParams.workoutType} - ${detectedParams.intensity}`);
            speakCoachFeedback(language === Language.FR ? "C'est parti ! Préparation de votre séance." : "Let's do this! Preparing your session now.");
            setTimeout(() => {
              triggerWorkoutStart(detectedParams);
            }, 600);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsMicGranted(false);
          setStatusCode('mic_restricted');
        }
      };

      recognition.onend = () => {
        // Auto-restart Web Speech API if modal is still open and not muted
        if (isVisibleRef.current && !isMutedRef.current) {
          setTimeout(() => {
            if (isVisibleRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                // Ignore start if already running
              }
            }
          }, 200);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Failed to start SpeechRecognition:', err);
    }
  }, [speechLang, language, speakCoachFeedback, triggerWorkoutStart]);

  const startSession = useCallback(async () => {
    if (isSessionStartingRef.current) return;
    isSessionStartingRef.current = true;

    try {
      setStatusCode('initializing');

      // 1. Initialize Web Speech API for direct speech-to-text on mobile browsers
      initWebSpeechAPI();

      // 2. Request microphone stream for Web Audio API visualizer & Live streaming
      let stream: MediaStream | null = null;
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          });
          setIsMicGranted(true);
        }
      } catch (micErr) {
        console.warn('getUserMedia audio stream request failed:', micErr);
        if (!recognitionRef.current) {
          setStatusCode('mic_restricted');
        }
      }

      if (stream) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const inputAudioContext = new AudioCtx();
        const outputAudioContext = new AudioCtx();
        const outputGainNode = outputAudioContext.createGain();
        outputGainNode.connect(outputAudioContext.destination);

        if (inputAudioContext.state === 'suspended') {
          await inputAudioContext.resume().catch(() => {});
        }
        if (outputAudioContext.state === 'suspended') {
          await outputAudioContext.resume().catch(() => {});
        }

        // Real-time AnalyserNode for volume and sound wave visualization
        const source = inputAudioContext.createMediaStreamSource(stream);
        const analyser = inputAudioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVolumeMeter = () => {
          if (!isVisibleRef.current) return;
          if (!isMutedRef.current) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setVolume(Math.min(100, Math.round((avg / 128) * 100)));
          } else {
            setVolume(0);
          }
          animFrameRef.current = requestAnimationFrame(updateVolumeMeter);
        };
        animFrameRef.current = requestAnimationFrame(updateVolumeMeter);

        // ScriptProcessor for PCM websocket streaming
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);

        audioResourcesRef.current = { stream, inputAudioContext, outputAudioContext, scriptProcessor, source, analyser, outputGainNode };

        // 3. Connect to Live WebSocket proxy
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/live-coach`;
        const ws = new WebSocket(wsUrl);
        sessionRef.current = ws;

        let nextStartTime = 0;
        const sources = new Set<AudioBufferSourceNode>();

        ws.onopen = async () => {
          if (inputAudioContext.state === 'suspended') await inputAudioContext.resume().catch(() => {});
          setStatusCode('listening');

          // Send setup packet
          ws.send(JSON.stringify({
            type: 'setup',
            systemPrompt,
            voiceName
          }));

          const nativeSampleRate = inputAudioContext.sampleRate || 44100;

          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            if (isMutedRef.current) return;
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = downsampleAndEncode(inputData, nativeSampleRate, 16000);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ audio: pcmBlob.data }));
            }
          };
        };

        ws.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'status') {
              if (message.status === 'Connection error') setStatusCode('conn_error');
              else if (message.status === 'Link closed') setStatusCode('link_closed');
              else if (message.status === 'Listening...') setStatusCode('listening');
              return;
            }

            const functionCalls = message.toolCall?.functionCalls || message.serverContent?.modelTurn?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);
            if (functionCalls && functionCalls.length > 0) {
              for (const fc of functionCalls) {
                if (fc.name === 'startWorkoutGeneration') {
                  triggerWorkoutStart(fc.args as any);
                  return;
                }
              }
            }

            const base64Audio = message.audio || message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              if (outputAudioContext.state === 'suspended') await outputAudioContext.resume().catch(() => {});
              setIsAiSpeaking(true);
              setStatusCode('speaking');
              nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const sourceNode = outputAudioContext.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(outputGainNode);
              sourceNode.addEventListener('ended', () => {
                sources.delete(sourceNode);
                if (sources.size === 0) {
                  setIsAiSpeaking(false);
                  setStatusCode('listening');
                }
              });
              sourceNode.start(nextStartTime);
              nextStartTime += audioBuffer.duration;
              sources.add(sourceNode);
            }

            if (message.interrupted || message.serverContent?.interrupted) {
              sources.forEach(s => s.stop());
              sources.clear();
              setIsAiSpeaking(false);
              nextStartTime = outputAudioContext.currentTime;
              setStatusCode('listening');
            }

            if (message.serverContent?.inputTranscription?.text) {
              setTranscription(prev => ({ ...prev, user: prev.user + message.serverContent.inputTranscription.text }));
            }

            if (message.serverContent?.outputTranscription?.text) {
              setTranscription(prev => ({ ...prev, ai: prev.ai + message.serverContent.outputTranscription.text }));
            }
            if (message.serverContent?.turnComplete) {
              setStatusCode('listening');
            }
          } catch (msgErr) {
            console.warn('WS message error:', msgErr);
          }
        };

        ws.onerror = () => {
          console.warn('Live WebSocket encountered an error, falling back to Web Speech engine');
        };
        ws.onclose = () => {
          console.log('Live WebSocket closed');
        };
      }
    } catch (error) {
      console.warn("Audio mic initialization error:", error);
      setIsMicGranted(false);
      setStatusCode('mic_restricted');
    } finally {
      isSessionStartingRef.current = false;
    }
  }, [initWebSpeechAPI, systemPrompt, voiceName, triggerWorkoutStart]);

  useEffect(() => {
    if (!isVisible) return;
    startSession();
    return () => {
      cleanupAudio();
    };
  }, [isVisible, startSession, cleanupAudio]);

  const handleInteraction = async () => {
    const res = audioResourcesRef.current;
    if (res.inputAudioContext?.state === 'suspended') await res.inputAudioContext.resume().catch(() => {});
    if (res.outputAudioContext?.state === 'suspended') await res.outputAudioContext.resume().catch(() => {});

    // Try starting or restarting speech recognition on touch
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    } else {
      initWebSpeechAPI();
    }

    if (statusCode === 'mic_restricted' || !isMicGranted) {
      await startSession();
    }
  };

  if (!isVisible) return null;

  const getStatusLabel = () => {
    switch (statusCode) {
      case 'initializing': return translate('coach.status.initializing');
      case 'listening': return translate('coach.status.listening');
      case 'speaking': return translate('coach.status.speaking');
      case 'mic_restricted': return translate('coach.status.mic_restricted');
      case 'conn_error': return "Mode Vocal Web Speech";
      case 'link_closed': return translate('coach.status.link_closed');
      default: return translate('coach.status.listening');
    }
  };

  const getSubtitle = () => {
    if (transcription.ai) return transcription.ai;
    if (transcription.user) return `« ${transcription.user} »`;
    if (statusCode === 'listening') return translate('coach.status.im_listening');
    if (statusCode === 'initializing') return translate('coach.status.ready_voice');
    if (statusCode === 'mic_restricted') return "Microphone en attente d'autorisation. Touchez l'écran ou le bouton ci-dessous pour parler.";
    return translate('coach.status.ready_voice');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[9999] flex flex-col items-center justify-end p-4 animate-fadeIn" 
      onClick={handleInteraction} 
      role="dialog" 
      aria-modal="true"
    >
      <div 
        className="bg-zinc-950 border border-purple-500/40 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-lg shadow-[0_0_90px_rgba(138,43,226,0.35)] relative mb-24 flex flex-col gap-4" 
        onClick={e => e.stopPropagation()}
      >
          {/* Close button */}
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white p-2 transition-colors" aria-label="Close">
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-5 sm:gap-6">
             <div className="relative flex-shrink-0">
                {/* Visual Volume Pulse & Sound Rings */}
                <div 
                  className="absolute inset-0 rounded-full border-2 border-purple-500/60 transition-all duration-75 pointer-events-none"
                  style={{ transform: `scale(${1 + (volume / 100) * 0.75})`, opacity: volume > 2 ? 0.9 : 0.1 }}
                />
                <div 
                  className="absolute -inset-2 rounded-full border border-indigo-400/40 transition-all duration-100 pointer-events-none"
                  style={{ transform: `scale(${1 + (volume / 100) * 1.1})`, opacity: volume > 10 ? 0.6 : 0 }}
                />
                
                <button 
                  onClick={handleInteraction}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 border-purple-500/50 transition-all relative z-10 cursor-pointer shadow-lg active:scale-95 ${
                    isAiSpeaking 
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 scale-105 shadow-[0_0_35px_rgba(138,43,226,0.7)]' 
                      : volume > 5
                      ? 'bg-gradient-to-tr from-purple-800 to-purple-600 border-purple-300'
                      : 'bg-zinc-900 hover:bg-purple-950/60'
                  }`}
                  aria-label="Microphone Voice Activation"
                >
                    {isAiSpeaking ? (
                      <div className="flex gap-1.5 h-6 items-end">
                        <div className="w-1.5 h-3 bg-white rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-delay:0.15s]"></div>
                        <div className="w-1.5 h-2 bg-white rounded-full animate-bounce [animation-delay:0.3s]"></div>
                      </div>
                    ) : (
                      <Mic className={`${volume > 6 ? 'text-white scale-110' : 'text-purple-400'} transition-all`} size={30} />
                    )}
                </button>
             </div>
             
             <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] sm:text-xs text-purple-400 font-black uppercase tracking-[0.25em]">
                    {getStatusLabel()}
                  </p>
                </div>
                <p className="text-sm sm:text-base text-white font-medium line-clamp-3 italic leading-snug">
                  {getSubtitle()}
                </p>
                {lastDetectedIntent && (
                  <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider mt-1">
                    ✓ Détecté: {lastDetectedIntent}
                  </p>
                )}
             </div>
          </div>

          {/* Action buttons with clear mobile permission trigger */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-purple-900/30">
            {(!isMicGranted || statusCode === 'mic_restricted') && (
              <button 
                onClick={handleInteraction}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Mic size={16} />
                <span>Autoriser le Microphone</span>
              </button>
            )}
            
            <button 
              onClick={() => triggerWorkoutStart(parseVoiceWorkoutParams(transcription.user || 'fitness full body'))}
              className="flex-1 py-3 px-4 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 hover:text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <Mic size={14} className="text-purple-400" />
              <span>⚡ Je suis prêt ! Lancer</span>
            </button>
          </div>

          {/* Top mute button */}
          <div className="absolute -top-12 right-4">
             <button 
                onClick={() => setIsMuted(prev => !prev)} 
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg ${!isMuted ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-red-600 text-white hover:bg-red-500'}`}
                aria-label={isMuted ? "Unmute" : "Mute"}
             >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>
      </div>
    </div>
  );
};

export default AICoach;
