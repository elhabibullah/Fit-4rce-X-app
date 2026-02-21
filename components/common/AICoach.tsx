import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { X, Mic, MicOff, Heart, Flame } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import { AIProvider, WorkoutGenerationParams } from '../../types.ts';

interface AICoachProps {
  isVisible: boolean;
  onClose: () => void;
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

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    let sample = data[i] * 5.0;
    sample = Math.max(-1, Math.min(1, sample));
    int16[i] = sample < 0 ? sample * 32768 : sample * 32767;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const startWorkoutGenerationDeclaration: FunctionDeclaration = {
    name: 'startWorkoutGeneration',
    description: 'Call this ONLY when the user specifies intensity and equipment.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            workoutType: { type: Type.STRING },
            equipment: { type: Type.ARRAY, items: { type: Type.STRING } },
            intensity: { type: Type.STRING },
        },
        required: ['intensity']
    }
};

const AICoach: React.FC<AICoachProps> = ({ isVisible, onClose }) => {
  const { profile, language, selectedCoachPersona, startWorkoutFromVoice, deviceMetrics, isDeviceConnected, setIsGeneratingWorkout } = useApp();
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState<{ user: string; ai: string }>({ user: '', ai: '' });
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [status, setStatus] = useState('Initializing...');

  const sessionRef = useRef<any>(null);
  const audioResourcesRef = useRef<any>({});
  const isMutedRef = useRef(isMuted);

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

  const systemPrompt = useMemo(() => {
    return `You are Fit-4rce-X Coach. Professional, supportive, and technical. Goal: ${profile?.goal?.join(', ') || 'fitness'}. Lang: ${language}.`;
  }, [profile, language]);

  useEffect(() => {
    if (!isVisible) return;

    let isMounted = true;
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();

    const startSession = async () => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!isMounted) { stream.getTracks().forEach(t => t.stop()); return; }

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const outputGainNode = outputAudioContext.createGain();
            outputGainNode.connect(outputAudioContext.destination);

            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            audioResourcesRef.current = { stream, inputAudioContext, outputAudioContext, scriptProcessor, source, outputGainNode };

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        if (!isMounted) return;
                        setStatus('Connected');
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            if (isMutedRef.current) return;
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(s => {
                              if (s && s.sendRealtimeInput) s.sendRealtimeInput({ media: pcmBlob });
                            }).catch(() => {});
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (!isMounted) return;
                        
                        if (message.toolCall && message.toolCall.functionCalls) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'startWorkoutGeneration') {
                                    setIsGeneratingWorkout(true);
                                    onClose();
                                    startWorkoutFromVoice(fc.args as any);
                                    return;
                                }
                            }
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            if (outputAudioContext.state === 'suspended') await outputAudioContext.resume();
                            setIsAiSpeaking(true);
                            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                            const sourceNode = outputAudioContext.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(outputGainNode);
                            sourceNode.addEventListener('ended', () => {
                                sources.delete(sourceNode);
                                if (sources.size === 0) setIsAiSpeaking(false);
                            });
                            sourceNode.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            sources.add(sourceNode);
                        }
                        
                        if (message.serverContent?.outputTranscription) {
                            setTranscription(prev => ({...prev, ai: prev.ai + (message.serverContent?.outputTranscription?.text || '')}));
                        }
                        if (message.serverContent?.turnComplete) {
                            setTranscription({ user: '', ai: '' });
                        }
                    },
                    onerror: () => setStatus('Connection error'),
                    onclose: () => setStatus('Link closed'),
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } },
                    systemInstruction: systemPrompt,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: [{ functionDeclarations: [startWorkoutGenerationDeclaration] }],
                },
            });
            sessionPromise.then(s => { if (isMounted) sessionRef.current = s; else s.close(); });
        } catch (error) { setStatus('Mic restricted'); }
    };
    startSession();
    return () => {
      isMounted = false;
      if (sessionRef.current) sessionRef.current.close();
      const res = audioResourcesRef.current;
      if (res.stream) res.stream.getTracks().forEach((t: any) => t.stop());
      if (res.inputAudioContext) res.inputAudioContext.close().catch(() => {});
      if (res.outputAudioContext) res.outputAudioContext.close().catch(() => {});
    };
  }, [isVisible, systemPrompt, voiceName]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9999] flex flex-col items-center justify-end p-4 animate-fadeIn">
      <div className="bg-gray-950 border border-purple-500/40 rounded-[3rem] p-8 w-full max-w-lg shadow-[0_0_80px_rgba(138,43,226,0.3)] relative mb-24">
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24} /></button>
          
          <div className="flex items-center gap-6">
             <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-purple-500/30 transition-all ${isAiSpeaking ? 'bg-purple-600 scale-110 shadow-[0_0_30px_rgba(138,43,226,0.5)]' : 'bg-gray-900'}`}>
                {isAiSpeaking ? (
                  <div className="flex gap-1 h-6 items-end">
                    <div className="w-1 h-3 bg-white animate-bounce"></div>
                    <div className="w-1 h-5 bg-white animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-1 h-2 bg-white animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                ) : <Mic className="text-gray-600" size={32} />}
             </div>
             <div>
                <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.3em] mb-1">{status}</p>
                <p className="text-sm text-white font-medium line-clamp-2 italic">{transcription.ai || "Ready for voice instruction..."}</p>
             </div>
          </div>

          <div className="absolute -top-14 right-4">
             <button onClick={() => setIsMuted(prev => !prev)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${!isMuted ? 'bg-purple-600' : 'bg-red-600'}`}>
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>
      </div>
    </div>
  );
};

export default AICoach;