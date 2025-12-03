
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
    description: 'ONLY call this function if the user EXPLICITLY asks to "start a workout", "generate a plan", or "begin training". DO NOT call this if the user asks a question, asks for advice, or says hello.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            workoutType: { type: Type.STRING, enum: ['calisthenics', 'fitness', 'powerlifting', 'pilates', 'yoga_stretching'], description: 'The type of workout.' },
            equipment: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['bodyweight', 'free_weights', 'full_gym'] }, description: 'The equipment available. Can be multiple.' },
            targetArea: { type: Type.ARRAY, items: { type: Type.STRING, enum: ['upper_body', 'lower_body', 'core_planks', 'full_body'] }, description: 'The body area to target. Can be multiple.' },
            intensity: { type: Type.STRING, enum: ['low', 'medium', 'high'], description: 'The intensity of the workout.' },
            customPrompt: { type: Type.STRING, description: 'Any other specific user requests mentioned in their prompt.' }
        },
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
  useEffect(() => {
    isMutedRef.current = isMuted;
    if (audioResourcesRef.current.outputGainNode) {
        // If muted, gain is 0, otherwise boosted to 3.0 for louder volume
        audioResourcesRef.current.outputGainNode.gain.value = isMuted ? 0 : 3.0;
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

    const personaMap: Record<AIProvider, string> = {
        gemini: `You are Fit-4rce-X, an android humanoid AI coach named Noemie.`,
        anthropic: `You are Fit-4rce-X, an android humanoid AI coach named Noor.`,
        openai: `You are Fit-4rce-X, an android humanoid AI coach named Abdelwahid.`,
        perplexity: `You are Fit-4rce-X, an android humanoid AI coach named Saudi.`,
    };

    let prompt = `${personaMap[selectedCoachPersona]} You are speaking directly to the user. Your voice should be clear, encouraging, and slightly futuristic, but not robotic. Your personality is that of a supportive and knowledgeable training partner. The user's name is ${profile?.full_name || 'user'}. They are ${profile?.age || 'an unknown age'} years old. Their stated fitness goals are: ${profile?.goal?.join(', ') || 'not specified'}. Their fitness level is ${profile?.fitness_level || 'not specified'}. You must reply *only* in ${languageName}. Do not use any other language under any circumstances.`;
    
    // --- LIVE METRICS INJECTION ---
    if (isDeviceConnected) {
        prompt += `\n\n[LIVE TELEMETRY]:
        - Heart Rate: ${deviceMetrics.heartRate} BPM
        - Calories Burned: ${Math.floor(deviceMetrics.caloriesBurned)} kcal
        - Activity State: ${deviceMetrics.isActive ? 'Active' : 'Resting'}
        
        Use this data. If HR is > 160, advise pacing. If HR is < 100 during work, advise pushing harder.`;
    }

    // --- F4X NUTRITION INJECTION ---
    prompt += `\n\n[F4X NUTRITION SYSTEM]:
    You are integrated with the user's F4X NUTRITION supply chain.
    - If the user mentions low energy, recommend "F4X NEURO-IGNITE" (Pre-workout).
    - If the user asks about recovery or protein, recommend "F4X ISO-WHEY".
    - If the user asks about joint pain or general health, recommend "F4X OMEGA-ARMOR".
    Refer to these as "tactical supplies" or "fuel" to maintain the brand aesthetic.`;

    if (dailyMacros) {
        prompt += `\n\nBe aware of their nutrition today: They have consumed ${Math.round(dailyMacros.calories.current)} out of their ${dailyMacros.calories.goal} calorie goal. You can use this information to give holistic advice that connects their training with their diet.`
    }

    if (coachContext) {
        prompt += `\nThe user is currently in a workout session, performing the "${coachContext}" exercise. Start the conversation by acknowledging this. You can offer specific tips on form for this exercise, ask how many reps they have left, or give them a motivational push to finish strong. Be direct and focused on the workout. For example: "Focus on your form for the ${coachContext}. Keep your core tight. You've got this!"`;
    } else if (workoutHistory && workoutHistory.length > 0) {
        const lastWorkout = workoutHistory[0];
        prompt += `\nTheir last logged workout was "${lastWorkout.title}" on ${lastWorkout.date}. Start the conversation by greeting them warmly by name. You can reference their last workout and ask how they're feeling, or what their plan is for today. Keep your opening brief and conversational. For example: "Welcome back, ${profile?.full_name}. I see your last session was ${lastWorkout.title}. How are you feeling today?"`;
    } else {
        prompt += `\nThis is the user's first time activating you. Start the conversation by introducing yourself briefly and welcoming them to their personalized training experience. Ask them what they're excited to accomplish. For example: "Welcome, ${profile?.full_name}. I am your personal AI training partner. I'm ready to help you achieve your goals. What's our mission for today?"`;
    }
    
    // --- UPDATED PROTOCOL TO FIX USER FRUSTRATION ---
    prompt += `\n\n*** CRITICAL OVERRIDE PROTOCOL - READ CAREFULLY ***`;
    prompt += `\n1. **Q&A PRIORITY**: If the user says "I have a question", "Can I ask something", or asks ANY question about fitness, nutrition, or life, YOU MUST ANSWER THE QUESTION. Do NOT start a workout. Do NOT call the "startWorkoutGeneration" tool. Just talk naturally.`;
    prompt += `\n2. **WORKOUT TRIGGER**: ONLY call the \`startWorkoutGeneration\` tool if the user EXPLICITLY says "Start workout", "Generate plan", "I want to train", or similar COMMANDS.`;
    prompt += `\n   - If the user input is vague, ASK FOR CLARIFICATION. Do not assume they want to start a workout.`;
    prompt += `\n3. **NO CODE OUTPUT**: You are a voice assistant. Do NOT output code blocks, JSON, XML, or Markdown formatting (like bold, italics, lists). Speak in plain text only.`;
    prompt += `\n\n**SUMMARY**: IF IN DOUBT, JUST TALK. DO NOT START A WORKOUT UNLESS COMMANDED. NO CODE.`;
    
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

            // Set initial volume boost to 3.0
            outputGainNode.gain.value = isMutedRef.current ? 0 : 3.0;

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
                                if (fc.name === 'startWorkoutGeneration') {
                                    const params = fc.args as WorkoutGenerationParams;
                                    
                                    // Close the coach overlay so the user sees the generation screen
                                    onClose();

                                    startWorkoutFromVoice(params);

                                    sessionPromise.then((session) => {
                                        session.sendToolResponse({
                                            functionResponses: {
                                                id : fc.id,
                                                name: fc.name,
                                                response: { result: "OK, workout generation initiated." },
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
      {/* Minimized / Non-intrusive Overlay allowing to see background 3D */}
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
                 <div className="h-10 overflow-hidden relative">
                     <p className="text-sm text-white/90 leading-tight absolute w-full transition-all duration-500 transform" style={{ opacity: isAiSpeaking ? 1 : 0.5 }}>
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
