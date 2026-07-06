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
    const sample = Math.max(-1, Math.min(1, data[i]));
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
  const [volume, setVolume] = useState(0);

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
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!isMounted) { stream.getTracks().forEach(t => t.stop()); return; }

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const outputGainNode = outputAudioContext.createGain();
            outputGainNode.connect(outputAudioContext.destination);

            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            audioResourcesRef.current = { stream, inputAudioContext, outputAudioContext, scriptProcessor, source, outputGainNode };

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/api/live-coach`;
            const ws = new WebSocket(wsUrl);
            sessionRef.current = ws;

            ws.onopen = async () => {
                if (!isMounted) return;
                if (inputAudioContext.state === 'suspended') await inputAudioContext.resume();
                setStatus('Listening...');

                // Send the setup packet to configure the Gemini session securely on the server
                ws.send(JSON.stringify({
                    type: 'setup',
                    systemPrompt,
                    voiceName
                }));

                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    if (isMutedRef.current) return;
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    
                    // Calculate volume for visual feedback
                    let sum = 0;
                    for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                    const rms = Math.sqrt(sum / inputData.length);
                    setVolume(Math.min(100, rms * 500));

                    const pcmBlob = createBlob(inputData);
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
                    setStatus(message.status);
                    return;
                }
                
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
                    setStatus('Coach Speaking...');
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
                
                if (message.serverContent?.interrupted) {
                    sources.forEach(s => s.stop());
                    sources.clear();
                    setIsAiSpeaking(false);
                    nextStartTime = outputAudioContext.currentTime;
                }

                if (message.serverContent?.inputTranscription) {
                    setTranscription(prev => ({...prev, user: prev.user + (message.serverContent?.inputTranscription?.text || '')}));
                }

                if (message.serverContent?.outputTranscription) {
                    setTranscription(prev => ({...prev, ai: prev.ai + (message.serverContent?.outputTranscription?.text || '')}));
                }
                if (message.serverContent?.turnComplete) {
                    setTranscription({ user: '', ai: '' });
                    setStatus('Listening...');
                }
            };

            ws.onerror = () => setStatus('Connection error');
            ws.onclose = () => setStatus('Link closed');
        } catch (error) { setStatus('Mic restricted'); }
    };
    startSession();
    return () => {
      isMounted = false;
      if (sessionRef.current) {
        if (sessionRef.current instanceof WebSocket) {
          sessionRef.current.close();
        } else {
          sessionRef.current.close();
        }
      }
      const res = audioResourcesRef.current;
      if (res.stream) res.stream.getTracks().forEach((t: any) => t.stop());
      if (res.inputAudioContext) res.inputAudioContext.close().catch(() => {});
      if (res.outputAudioContext) res.outputAudioContext.close().catch(() => {});
    };
  }, [isVisible, systemPrompt, voiceName]);

  const handleInteraction = async () => {
    const res = audioResourcesRef.current;
    if (res.inputAudioContext?.state === 'suspended') await res.inputAudioContext.resume();
    if (res.outputAudioContext?.state === 'suspended') await res.outputAudioContext.resume();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9999] flex flex-col items-center justify-end p-4 animate-fadeIn" onClick={handleInteraction}>
      <div className="bg-gray-950 border border-purple-500/40 rounded-[3rem] p-8 w-full max-w-lg shadow-[0_0_80px_rgba(138,43,226,0.3)] relative mb-24" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24} /></button>
          
          <div className="flex items-center gap-6">
             <div className="relative">
                {/* Volume Ring */}
                <div 
                  className="absolute inset-0 rounded-full border-2 border-purple-500/50 transition-all duration-75"
                  style={{ transform: `scale(${1 + (volume / 100) * 0.5})`, opacity: volume > 5 ? 0.8 : 0 }}
                />
                
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-purple-500/30 transition-all relative z-10 ${isAiSpeaking ? 'bg-purple-600 scale-110 shadow-[0_0_30px_rgba(138,43,226,0.5)]' : 'bg-gray-900'}`}>
                    {isAiSpeaking ? (
                      <div className="flex gap-1 h-6 items-end">
                        <div className="w-1 h-3 bg-white animate-bounce"></div>
                        <div className="w-1 h-5 bg-white animate-bounce [animation-delay:0.1s]"></div>
                        <div className="w-1 h-2 bg-white animate-bounce [animation-delay:0.2s]"></div>
                      </div>
                    ) : <Mic className={`${volume > 10 ? 'text-purple-400' : 'text-gray-600'} transition-colors`} size={32} />}
                </div>
             </div>
             <div>
                <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.3em] mb-1">{status}</p>
                <p className="text-sm text-white font-medium line-clamp-2 italic">{transcription.ai || transcription.user || (status === 'Listening...' ? "I'm listening..." : "Ready for voice instruction...")}</p>
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