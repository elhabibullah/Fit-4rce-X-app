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

const AICoach: React.FC<AICoachProps> = ({ isVisible, onClose }) => {
  const { profile, language, selectedCoachPersona, startWorkoutFromVoice, setIsGeneratingWorkout, translate } = useApp();
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState<{ user: string; ai: string }>({ user: '', ai: '' });
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [statusCode, setStatusCode] = useState<CoachStatusCode>('initializing');
  const [volume, setVolume] = useState(0);

  const sessionRef = useRef<any>(null);
  const audioResourcesRef = useRef<any>({});
  const isMutedRef = useRef(isMuted);
  const recognitionRef = useRef<any>(null);

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
    setIsGeneratingWorkout(true);
    onClose();
    startWorkoutFromVoice(args || { workoutType: 'fitness', intensity: 'medium' });
  }, [setIsGeneratingWorkout, onClose, startWorkoutFromVoice]);

  useEffect(() => {
    if (!isVisible) return;

    let isMounted = true;
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();

    const startSession = async () => {
        try {
            setStatusCode('initializing');
            // Request audio with standard browser settings
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            });
            if (!isMounted) { stream.getTracks().forEach(t => t.stop()); return; }

            // Create AudioContext without forcing 16000Hz (Android fix)
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

            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            audioResourcesRef.current = { stream, inputAudioContext, outputAudioContext, scriptProcessor, source, outputGainNode };

            // Setup WebSocket connection
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/api/live-coach`;
            const ws = new WebSocket(wsUrl);
            sessionRef.current = ws;

            ws.onopen = async () => {
                if (!isMounted) return;
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
                    
                    // Volume calculation
                    let sum = 0;
                    for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                    const rms = Math.sqrt(sum / inputData.length);
                    setVolume(Math.min(100, Math.round(rms * 600)));

                    const pcmBlob = downsampleAndEncode(inputData, nativeSampleRate, 16000);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ audio: pcmBlob.data }));
                    }
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext.destination);
            };

            ws.onmessage = async (event) => {
                if (!isMounted) return;
                const message = JSON.parse(event.data);

                if (message.type === 'status') {
                    if (message.status === 'Connection error') setStatusCode('conn_error');
                    else if (message.status === 'Link closed') setStatusCode('link_closed');
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

                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
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
                
                if (message.serverContent?.interrupted) {
                    sources.forEach(s => s.stop());
                    sources.clear();
                    setIsAiSpeaking(false);
                    nextStartTime = outputAudioContext.currentTime;
                    setStatusCode('listening');
                }

                if (message.serverContent?.inputTranscription) {
                    setTranscription(prev => ({...prev, user: prev.user + (message.serverContent?.inputTranscription?.text || '')}));
                }

                if (message.serverContent?.outputTranscription) {
                    setTranscription(prev => ({...prev, ai: prev.ai + (message.serverContent?.outputTranscription?.text || '')}));
                }
                if (message.serverContent?.turnComplete) {
                    setTranscription({ user: '', ai: '' });
                    setStatusCode('listening');
                }
            };

            ws.onerror = () => setStatusCode('conn_error');
            ws.onclose = () => setStatusCode('link_closed');

            // Web Speech API fallback on mobile browsers
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
              const recognition = new SpeechRecognition();
              recognition.lang = speechLang;
              recognition.continuous = true;
              recognition.interimResults = true;

              recognition.onresult = (e: any) => {
                let interim = '';
                for (let i = e.resultIndex; i < e.results.length; ++i) {
                  interim += e.results[i][0].transcript;
                }
                if (interim) {
                  setTranscription(prev => ({ ...prev, user: interim }));
                  const lower = interim.toLowerCase();
                  if (
                    lower.includes('prêt') || lower.includes('pret') ||
                    lower.includes('ready') || lower.includes('commencer') ||
                    lower.includes('parti') || lower.includes('lance') ||
                    lower.includes('start') || lower.includes('جاهز') ||
                    lower.includes('listo') || lower.includes('pronto')
                  ) {
                    triggerWorkoutStart();
                  }
                }
              };

              recognition.onerror = () => {};
              try {
                recognition.start();
                recognitionRef.current = recognition;
              } catch (e) {}
            }

        } catch (error) { 
          console.warn("Audio mic initialization error:", error);
          setStatusCode('mic_restricted'); 
        }
    };

    startSession();

    return () => {
      isMounted = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (sessionRef.current && sessionRef.current instanceof WebSocket) {
        sessionRef.current.close();
      }
      const res = audioResourcesRef.current;
      if (res.stream) res.stream.getTracks().forEach((t: any) => t.stop());
      if (res.inputAudioContext) res.inputAudioContext.close().catch(() => {});
      if (res.outputAudioContext) res.outputAudioContext.close().catch(() => {});
    };
  }, [isVisible, systemPrompt, voiceName, speechLang, triggerWorkoutStart]);

  const handleInteraction = async () => {
    const res = audioResourcesRef.current;
    if (res.inputAudioContext?.state === 'suspended') await res.inputAudioContext.resume().catch(() => {});
    if (res.outputAudioContext?.state === 'suspended') await res.outputAudioContext.resume().catch(() => {});
  };

  if (!isVisible) return null;

  const getStatusLabel = () => {
    switch (statusCode) {
      case 'initializing': return translate('coach.status.initializing');
      case 'listening': return translate('coach.status.listening');
      case 'speaking': return translate('coach.status.speaking');
      case 'mic_restricted': return translate('coach.status.mic_restricted');
      case 'conn_error': return translate('coach.status.conn_error');
      case 'link_closed': return translate('coach.status.link_closed');
      default: return translate('coach.status.listening');
    }
  };

  const getSubtitle = () => {
    if (transcription.ai) return transcription.ai;
    if (transcription.user) return transcription.user;
    if (statusCode === 'listening') return translate('coach.status.im_listening');
    if (statusCode === 'initializing') return translate('coach.status.ready_voice');
    if (statusCode === 'mic_restricted') return translate('coach.status.mic_restricted');
    return translate('coach.status.ready_voice');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[9999] flex flex-col items-center justify-end p-4 animate-fadeIn" onClick={handleInteraction} role="dialog" aria-modal="true">
      <div className="bg-gray-950 border border-purple-500/40 rounded-[2.5rem] p-6 sm:p-8 w-full max-w-lg shadow-[0_0_80px_rgba(138,43,226,0.3)] relative mb-24" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white p-2" aria-label="Close">
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-5 sm:gap-6">
             <div className="relative flex-shrink-0">
                {/* Visual Volume Pulse */}
                <div 
                  className="absolute inset-0 rounded-full border-2 border-purple-500/60 transition-all duration-75"
                  style={{ transform: `scale(${1 + (volume / 100) * 0.6})`, opacity: volume > 3 ? 0.9 : 0 }}
                />
                
                <div 
                  onClick={handleInteraction}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 border-purple-500/40 transition-all relative z-10 cursor-pointer ${
                    isAiSpeaking ? 'bg-purple-600 scale-105 shadow-[0_0_30px_rgba(138,43,226,0.6)]' : 'bg-gray-900'
                  }`}
                >
                    {isAiSpeaking ? (
                      <div className="flex gap-1 h-6 items-end">
                        <div className="w-1 h-3 bg-white animate-bounce"></div>
                        <div className="w-1 h-5 bg-white animate-bounce [animation-delay:0.1s]"></div>
                        <div className="w-1 h-2 bg-white animate-bounce [animation-delay:0.2s]"></div>
                      </div>
                    ) : (
                      <Mic className={`${volume > 8 ? 'text-purple-400 scale-110' : 'text-gray-400'} transition-all`} size={30} />
                    )}
                </div>
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-purple-400 font-black uppercase tracking-[0.25em] mb-1">
                  {getStatusLabel()}
                </p>
                <p className="text-sm sm:text-base text-white font-medium line-clamp-2 italic">
                  {getSubtitle()}
                </p>
             </div>
          </div>

          <div className="absolute -top-12 right-4">
             <button 
                onClick={() => setIsMuted(prev => !prev)} 
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg ${!isMuted ? 'bg-purple-600 text-white' : 'bg-red-600 text-white'}`}
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
