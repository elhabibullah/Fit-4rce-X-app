import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { X, Mic, MicOff, Heart, Flame } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import { AIProvider, WorkoutGenerationParams } from '../../types.ts';

interface AICoachProps {
  isVisible: boolean;
  onClose: () => void;
}

// --- Audio Helper Functions ---
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
    // Volume boost for Microphone (5x gain)
    let sample = data[i] * 5.0;
    // Clamp values to avoid clipping distortion
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
    description: 'Call this function ONLY when the user has specified their desired INTENSITY and EQUIPMENT availability. Do NOT call this if either is missing.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            workoutType: { type: Type.STRING, enum: ['calisthenics', 'fitness', 'powerlifting', 'pilates', 'yoga_stretching'], description: 'The type of workout.' },
            equipment: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['bodyweight', 'free_weights', 'full_gym'] }, description: 'The equipment available. Can be multiple. MANDATORY.' },
            targetArea: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['upper_body', 'lower_body', 'core_planks', 'full_body'] }, description: 'The body area to target. Can be multiple.' },
            intensity: { type: Type.STRING, enum: ['low', 'medium', 'high'], description: 'The intensity of the workout. MANDATORY.' },
            customPrompt: { type: Type.STRING, description: 'Any other specific user requests mentioned in their prompt.' }
        },
        required: ['intensity', 'equipment']
    }
};

const AICoach: React.FC<AICoachProps> = ({ isVisible, onClose }) => {
  const { profile, workoutHistory, language, coachContext, dailyMacros, selectedCoachPersona, startWorkoutFromVoice, deviceMetrics, isDeviceConnected } = useApp();
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState<{ user: string; ai: string }>({ user: '', ai: '' });
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [status, setStatus] = useState('Initializing...');

  const sessionRef = useRef<LiveSession | null>(null);
  const audioResourcesRef = useRef<any>({});
  const isMutedRef = useRef(isMuted);
  
  // Ref to track navigation state to prevent duplicate triggers
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
    if (audioResourcesRef.current.outputGainNode) {
        // Reduced volume to 1.0 (Standard)
        audioResourcesRef.current.outputGainNode.gain.value = isMuted ? 0 : 1.0;
    }
  }, [isMuted]);

  const voiceName = useMemo(() => {
    const voiceMap: Record<AIProvider, string> = {
        gemini: 'Zephyr',    // Noemie (Female)
        anthropic: 'Kore',   // Noor (Female)
        openai: 'Puck',      // Abdelwahid (Male)
        perplexity: 'Fenrir',// Saudi (Male)
    };
    return voiceMap[selectedCoachPersona] || 'Zephyr';
  }, [selectedCoachPersona]);

  const systemPrompt = useMemo(() => {
    const languageMap: { [key: string]: string } = {
        en: 'English', fr: 'French', ar: 'Arabic', es: 'Spanish',
        ja: 'Japanese', pt: 'Portuguese', zh: 'Chinese', ru: 'Russian',
    };
    const languageName = languageMap[language || 'en'];

    let prompt = `You are Fit-4rce-X, an android humanoid AI coach. You are speaking directly to the user. Your voice should be clear, encouraging, and slightly futuristic, but not robotic. Your personality is that of a supportive and knowledgeable training partner. The user's name is ${profile?.full_name || 'user'}. You must reply *only* in ${languageName}. Do not use any other language under any circumstances.`;
    
    // --- LIVE METRICS INJECTION ---
    if (isDeviceConnected) {
        prompt += `\n\n[LIVE TELEMETRY]:
        - Heart Rate: ${deviceMetrics.heartRate} BPM
        - Calories Burned: ${Math.floor(deviceMetrics.caloriesBurned)} kcal
        - Activity State: ${deviceMetrics.isActive ? 'Active' : 'Resting'}`;
    }

    // --- CRITICAL OVERRIDE PROTOCOL ---
    prompt += `\n\n*** CRITICAL PROTOCOL - READ CAREFULLY ***`;
    prompt += `\n1. **FITNESS LEVEL**: The user's profile level is **${profile?.fitness_level || 'Intermediate'}**. Use this value automatically. **NEVER ASK THE USER FOR THEIR LEVEL.**`;
    prompt += `\n2. **MISSING INFO CHECK**: If the user says "I want to train" but is missing **INTENSITY** or **EQUIPMENT**, you MUST ask for them.`;
    prompt += `\n   - Example: "What intensity and what equipment do you have available?"`;
    prompt += `\n   - **DO NOT** call the tool until you have BOTH Intensity AND Equipment.`;
    prompt += `\n3. **CONFIRMATION & EXECUTION**: Once you have all info:`;
    prompt += `\n   - **Step A**: Speak exactly: "Let me prepare your exercises" (in ${languageName}).`;
    prompt += `\n   - **Step B**: Call the \`startWorkoutGeneration\` tool immediately AFTER generating the speech.`;
    
    return prompt;

  }, [profile, workoutHistory, language, coachContext, dailyMacros, selectedCoachPersona, deviceMetrics, isDeviceConnected]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    let isMounted = true;
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();

    const cleanup = () => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        audioResourcesRef.current.stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        if (audioResourcesRef.current.scriptProcessor) {
            audioResourcesRef.current.scriptProcessor.disconnect();
        }
        if (audioResourcesRef.current.source) {
            audioResourcesRef.current.source.disconnect();
        }
        audioResourcesRef.current.inputAudioContext?.close().catch(() => {});
        audioResourcesRef.current.outputAudioContext?.close().catch(() => {});
        audioResourcesRef.current = {};
    };

    const startSession = async () => {
        if (!isMounted) return;
        setStatus('Connecting...');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!isMounted) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const outputGainNode = outputAudioContext.createGain();
            outputGainNode.connect(outputAudioContext.destination);

            // Reduced volume to 1.0 (Standard)
            outputGainNode.gain.value = isMutedRef.current ? 0 : 1.0;

            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            audioResourcesRef.current = { stream, inputAudioContext, outputAudioContext, scriptProcessor, source, outputGainNode };

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        if (!isMounted) return;
                        setStatus('Connected');
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            if (isMutedRef.current || !sessionRef.current) return;
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (!isMounted) return;

                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'startWorkoutGeneration' && !isNavigatingRef.current) {
                                    isNavigatingRef.current = true;
                                    const params = fc.args as WorkoutGenerationParams;
                                    
                                    // Ensure safe parameters
                                    const safeParams = {
                                        ...params,
                                        intensity: params.intensity || 'medium',
                                        equipment: params.equipment && params.equipment.length > 0 ? params.equipment : ['bodyweight'],
                                        workoutType: params.workoutType || 'fitness'
                                    };

                                    setStatus('Generating Exercises...');

                                    // Trigger navigation after delay to allow speech to complete
                                    // Using setTimeout without isMounted check to guarantee execution once committed
                                    window.setTimeout(() => {
                                        onClose(); // Close coach overlay
                                        // Small buffer to let the overlay close animation start
                                        window.setTimeout(() => {
                                            startWorkoutFromVoice(safeParams);
                                        }, 100);
                                    }, 3000);

                                    sessionPromise.then((session) => {
                                        session.sendToolResponse({
                                            functionResponses: {
                                                id : fc.id,
                                                name: fc.name,
                                                response: { result: "OK, initiating sequence." },
                                            }
                                        })
                                    });
                                }
                            }
                        }

                        if (message.serverContent?.inputTranscription) {
                            setIsUserSpeaking(true);
                            setTranscription(prev => ({ ...prev, user: prev.user + message.serverContent.inputTranscription.text }));
                        }
                        if (message.serverContent?.outputTranscription) {
                            setIsAiSpeaking(true);
                            setTranscription(prev => ({...prev, ai: prev.ai + message.serverContent.outputTranscription.text}));
                        }
                        if (message.serverContent?.turnComplete) {
                            setIsUserSpeaking(false);
                            setIsAiSpeaking(false);
                            setTranscription({ user: '', ai: '' });
                        }
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            if (outputAudioContext.state === 'suspended') {
                                await outputAudioContext.resume();
                            }
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
                    },
                    onerror: (e: ErrorEvent) => {
                        if (!isMounted) return;
                        console.error('Session error:', e);
                        setStatus('Error');
                    },
                    onclose: (e: CloseEvent) => {
                        if (!isMounted) return;
                        setStatus('Disconnected');
                    },
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
            
            sessionPromise.then(session => {
                if (isMounted) {
                    sessionRef.current = session;
                } else {
                    session.close();
                }
            }).catch(err => {
                if (isMounted) {
                    console.error("Failed to connect:", err);
                    setStatus('Connection Failed');
                }
            });

        } catch (error) {
            if (isMounted) {
                console.error('Failed to start AI Coach session:', error);
                setStatus('Mic permission denied');
            }
        }
    };
    
    startSession();

    return () => {
        isMounted = false;
        cleanup();
    };
  }, [isVisible, systemPrompt, voiceName, startWorkoutFromVoice, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex flex-col items-center justify-end p-4 animate-fadeIn pointer-events-auto">
      {/* Minimized / Non-intrusive Overlay */}
      <div className="bg-black/90 border border-purple-500 rounded-3xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(138,43,226,0.3)] relative mb-24">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-20">
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
             {/* Visualizer */}
             <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                <div 
                  className={`
                    absolute inset-0 rounded-full border-2 border-purple-500/50 transition-all duration-300
                    ${isAiSpeaking ? 'animate-ping opacity-50' : 'opacity-0'}
                  `}
                />
                <div 
                  className={`
                    w-12 h-12 rounded-full bg-purple-600 transition-all duration-300 flex items-center justify-center
                    ${isAiSpeaking ? 'scale-110 shadow-[0_0_20px_#8A2BE2]' : ''}
                  `}
                >
                    {isAiSpeaking ? <div className="w-8 h-1 bg-white animate-pulse" /> : <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
             </div>

             <div className="flex-grow">
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">{status}</p>
                 {/* Scrollable Text Bubble */}
                 <div className="h-10 overflow-y-auto relative custom-scrollbar">
                     <p className="text-sm text-white/90 leading-tight w-full transition-all duration-500" style={{ opacity: isAiSpeaking ? 1 : 0.5 }}>
                        {transcription.ai || (isUserSpeaking ? "Listening..." : "I'm with you.")}
                     </p>
                 </div>
             </div>
             
             {isDeviceConnected && (
                 <div className="flex flex-col items-end text-xs text-gray-500 border-l border-gray-700 pl-3">
                     <div className="flex items-center mb-1">
                         <Heart className="w-3 h-3 text-red-500 mr-1" />
                         <span className="text-white font-mono">{deviceMetrics.heartRate}</span>
                     </div>
                     <div className="flex items-center">
                         <Flame className="w-3 h-3 text-orange-500 mr-1" />
                         <span className="text-white font-mono">{Math.floor(deviceMetrics.caloriesBurned)}</span>
                     </div>
                 </div>
             )}
          </div>
          
          {/* Mute Toggle */}
          <div className="absolute -top-12 right-0">
             <button 
              onClick={() => setIsMuted(prev => !prev)}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                ${!isMuted ? 'bg-purple-600' : 'bg-red-600'}
              `}
            >
              {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
            </button>
          </div>
      </div>
    </div>
  );
};

export default AICoach;