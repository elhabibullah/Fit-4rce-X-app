
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Pause, Play, Repeat, Zap, Share2, Check, Bookmark, Mic, Bot, Heart, Flame, Timer, Watch, ShoppingBag } from 'lucide-react';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import { 
    generateWorkoutWithGemini,
    generateWorkoutWithOpenAI,
    generateWorkoutWithAnthropic,
    generateWorkoutWithPerplexity
} from '../services/aiService.ts';
import { WorkoutPlan, AIProvider, WorkoutGenerationParams, Screen } from '../types.ts';
import Loader from '../components/common/Loader.tsx';
import { useApp } from '../hooks/useApp.ts';
import Chatbot from '../components/common/Chatbot.tsx';
import { HolographicCoach } from '../components/common/HolographicCoach.tsx';
import { DeviceStatusTrigger } from '../components/common/DeviceStatusTrigger.tsx';

type WorkoutView = 'generation' | 'loading' | 'workout' | 'rest' | 'finished';
const AI_PROVIDERS: AIProvider[] = ['gemini', 'openai', 'anthropic', 'perplexity'];

const GenerationOption: React.FC<{ title: string; options: { key: string; label: string }[]; selected: string[] | string; onSelect: (key: string) => void; multiSelect?: boolean; }> = ({ title, options, selected, onSelect, multiSelect = false }) => {
  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <div className={`grid ${options.length > 2 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'} gap-2`}>
        {options.map(opt => {
          const isSelected = multiSelect ? (selected as string[]).includes(opt.key) : selected === opt.key;
          return (
            <button key={opt.key} onClick={() => onSelect(opt.key)} className="glow-container">
              <div className={`glow-content p-3 text-center transition-colors duration-300 ${isSelected ? 'bg-[#8A2BE2]/40' : ''}`}>
                <p className="font-light text-white text-sm">{opt.label}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Modified HUD to accept time as a prop for synchronization
const HUD: React.FC<{ sessionTime: number }> = ({ sessionTime }) => {
    const { deviceMetrics, translate, isDeviceConnected, openDeviceModal } = useApp();
    const { heartRate, caloriesBurned } = deviceMetrics;

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    return (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
            {/* Left: Heart Rate */}
            {isDeviceConnected ? (
                <div className="bg-black/40 backdrop-blur-md border border-red-500/30 p-2 rounded-lg flex items-center gap-2 animate-fadeIn">
                    <Heart className="w-5 h-5 text-red-500 animate-pulse" fill={heartRate > 100 ? "currentColor" : "none"} />
                    <div>
                        <p className="text-xs text-gray-400 font-bold">{translate('device.hud.hr')}</p>
                        <p className="text-xl font-mono font-bold text-white leading-none">{heartRate}</p>
                    </div>
                </div>
            ) : (
                <div className="w-16"></div> /* Spacer */
            )}

            {/* Center: Session Timer */}
            <div className="bg-black/40 backdrop-blur-md border border-purple-500/30 px-3 py-1 rounded-lg flex items-center gap-2 animate-fadeIn">
                <Timer className="w-4 h-4 text-purple-400" />
                <span className="text-xl font-mono font-bold text-white tracking-widest">{formatTime(sessionTime)}</span>
            </div>

            {/* Right: Connection Icon OR Calories */}
            <div className="pointer-events-auto w-16 flex justify-end">
                {isDeviceConnected ? (
                     <div className="bg-black/40 backdrop-blur-md border border-orange-500/30 p-2 rounded-lg flex items-center gap-2 animate-fadeIn">
                        <div>
                            <p className="text-xs text-gray-400 font-bold text-right">{translate('device.hud.cal')}</p>
                            <p className="text-xl font-mono font-bold text-white leading-none text-right">{Math.floor(caloriesBurned)}</p>
                        </div>
                        <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                ) : (
                    <button 
                        onClick={openDeviceModal}
                        className="bg-black/60 backdrop-blur-md p-2 rounded-full border border-gray-500/50 text-gray-400 hover:bg-black/80 hover:text-white transition-all hover:scale-105"
                        aria-label="Connect Gear"
                    >
                        <Watch className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}

// Helper to parse duration from description (e.g. "60 seconds", "30s", "1 min")
const parseDuration = (description: string): number => {
    if (!description) return 60;
    
    const secMatch = description.match(/(\d+)\s*(?:seconds|secs|s\b)/i);
    if (secMatch) return parseInt(secMatch[1]);
    
    const minMatch = description.match(/(\d+)\s*(?:minutes|mins|m\b)/i);
    if (minMatch) return parseInt(minMatch[1]) * 60;
    
    if (description.includes('reps')) return 45;

    return 60; // Default fallback
};

// Helper for Exercise Timer
const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const WorkoutScreen: React.FC = () => {
    const { translate, selectedPlan, setSelectedPlan, logWorkout, saveWorkoutPlan, voiceWorkoutParams, setVoiceWorkoutParams, setCoachContext, showStatus, setIsCoachOpen, startDeviceStream, stopDeviceStream, isDeviceConnected, setScreen } = useApp();
    
    const [view, setView] = useState<WorkoutView>('generation');
    const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [restTimer, setRestTimer] = useState(0);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [refreshKey, setRefreshKey] = useState(0); // Key to force re-render of 3D scene
    
    // TIMERS
    const [sessionTime, setSessionTime] = useState(0); // Total workout time
    const [exerciseTime, setExerciseTime] = useState(0); // Current exercise progress
    const [exerciseDuration, setExerciseDuration] = useState(60); // Goal duration for current exercise

    const [selectedCoach, setSelectedCoach] = useState<AIProvider>('gemini');
    const [workoutType, setWorkoutType] = useState('fitness');
    const [equipment, setEquipment] = useState(['bodyweight']);
    const [targetArea, setTargetArea] = useState(['full_body']);
    const [intensity, setIntensity] = useState('medium');
    const [customPrompt, setCustomPrompt] = useState('');

    const currentExercise = useMemo(() => {
        if (!workoutPlan) return null;
        const allExercises = [...(workoutPlan.warmup || []), ...workoutPlan.exercises, ...(workoutPlan.cooldown || [])];
        return allExercises[currentExerciseIndex];
    }, [workoutPlan, currentExerciseIndex]);
    
    // Update duration when exercise changes
    useEffect(() => {
        if (currentExercise) {
            const dur = parseDuration(currentExercise.description);
            setExerciseDuration(dur);
            setExerciseTime(0); // Reset exercise timer
            setRefreshKey(prev => prev + 1); // Refresh 3D view
        }
    }, [currentExercise]);

    useEffect(() => {
      setCoachContext(view === 'workout' ? currentExercise?.name || null : null);
      return () => setCoachContext(null);
    }, [view, currentExercise, setCoachContext]);

    useEffect(() => {
        if (selectedPlan) {
            setWorkoutPlan(selectedPlan);
            setView('workout');
            setCurrentExerciseIndex(0);
            setCountdown(5);
            setSessionTime(0);
            setSelectedPlan(null);
        } else if (voiceWorkoutParams) {
            handleGenerateWorkout(voiceWorkoutParams);
            setVoiceWorkoutParams(null);
        }
    }, [selectedPlan, voiceWorkoutParams]);
    
    // Device Stream
    useEffect(() => {
        if (view === 'workout' && isDeviceConnected && !isPaused && countdown === 0) {
            startDeviceStream();
        } else {
            stopDeviceStream();
        }
        return () => stopDeviceStream();
    }, [view, isDeviceConnected, isPaused, countdown]);

    // Rest Timer
    useEffect(() => {
        let timerId: number;
        if (view === 'rest' && restTimer > 0) {
            timerId = window.setTimeout(() => setRestTimer(t => t - 1), 1000);
        } else if (view === 'rest' && restTimer === 0) {
            handleNextExercise();
        }
        return () => clearTimeout(timerId);
    }, [view, restTimer]);

    // Countdown Timer (The "5-4-3-2-1" overlay)
    useEffect(() => {
        let timerId: number;
        // Only count down if NOT paused
        if (view === 'workout' && countdown > 0 && !isPaused) {
            timerId = window.setTimeout(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearTimeout(timerId);
    }, [view, countdown, isPaused]);

    // MAIN WORKOUT TIMER LOOP
    // Only runs if view is workout, countdown is finished, and not paused.
    useEffect(() => {
        let interval: number | null = null;
        if (view === 'workout' && countdown === 0 && !isPaused) {
            interval = window.setInterval(() => {
                setSessionTime(t => t + 1);
                setExerciseTime(t => t + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [view, countdown, isPaused]);
    
    const handleGenerateWorkout = useCallback(async (params?: WorkoutGenerationParams) => {
        setView('loading');
        
        const generationParams = params || { workoutType, equipment, targetArea, intensity, customPrompt };
        
        let prompt = `Generate a ${generationParams.intensity || 'medium'} intensity ${generationParams.workoutType || 'fitness'} workout.`;
        if (generationParams.targetArea && generationParams.targetArea.length > 0) prompt += ` It should target the ${generationParams.targetArea.join(' and ')}.`;
        if (generationParams.equipment && generationParams.equipment.length > 0) prompt += ` The user has access to: ${generationParams.equipment.join(', ')}.`;
        if (generationParams.customPrompt) prompt += ` Additional user request: "${generationParams.customPrompt}".`;
        prompt += ` Include a warm-up and cool-down. The response should be in JSON format.`;
        
        const generatorMap = {
            gemini: generateWorkoutWithGemini,
            openai: generateWorkoutWithOpenAI,
            anthropic: generateWorkoutWithAnthropic,
            perplexity: generateWorkoutWithPerplexity,
        };
        
        const generator = generatorMap[selectedCoach];
        
        try {
            const plan = await generator(prompt, 'en');
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (plan) {
                setWorkoutPlan(plan);
                setCurrentExerciseIndex(0);
                setCountdown(5);
                setSessionTime(0);
                setView('workout');
            } else {
                throw new Error("AI failed to generate a plan.");
            }
        } catch (error) {
            console.error("Workout generation failed:", error);
            await new Promise(resolve => setTimeout(resolve, 2000));
            showStatus(translate('workout.fallback'));
            const fallbackPlan: WorkoutPlan = { title: "Fallback Full Body", description: "A simple, effective workout.", exercises: [{ name: "Jumping Jacks", description: "60s", muscleGroups: [], modelUrl: "", difficulty: "beginner" }] };
            setWorkoutPlan(fallbackPlan);
            setCurrentExerciseIndex(0);
            setCountdown(5);
            setSessionTime(0);
            setView('workout');
        }
    }, [selectedCoach, workoutType, equipment, targetArea, intensity, customPrompt, showStatus, translate]);
    
    const handleNextExercise = () => {
        const allExercises = [...(workoutPlan?.warmup || []), ...(workoutPlan?.exercises || []), ...(workoutPlan?.cooldown || [])];
        if (currentExerciseIndex < allExercises.length - 1) {
             if (workoutPlan?.rest_duration_seconds && view !== 'rest') {
                setRestTimer(workoutPlan.rest_duration_seconds);
                setView('rest');
            } else {
                setCurrentExerciseIndex(i => i + 1);
                setCountdown(5); // Reset countdown for next exercise
                setView('workout');
            }
        } else {
            setView('finished');
            logWorkout(workoutPlan!);
        }
    };
    
    const handleSkipRest = () => {
        setRestTimer(0);
        setCurrentExerciseIndex(i => i + 1);
        setCountdown(5); // Reset countdown after rest
        setView('workout');
    };

    const handlePrevExercise = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(i => i - 1);
            setCountdown(5);
            setView('workout');
        }
    };
    
    // Restart Logic: Resets time, unpauses, restarts countdown
    const handleRestartExercise = () => {
        setExerciseTime(0);
        setIsPaused(false);
        setRefreshKey(prev => prev + 1); // Refresh key to restart 3D animation
        setCountdown(5); // Reset countdown to 5s
    };
    
    const handleSave = () => {
      if (workoutPlan) {
        saveWorkoutPlan(workoutPlan);
      }
    };
    
    const resetToGeneration = () => {
      setWorkoutPlan(null);
      setView('generation');
      setCurrentExerciseIndex(0);
    };

    if (view === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <Loader />
                <p className="mt-4 text-purple-400 animate-pulse">{translate('workout.generating')}</p>
            </div>
        );
    }
    
    if (view === 'generation') {
        return (
             <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-center relative mb-4">
                     <h1 className="text-xl font-medium text-white text-center">{translate('workout.title')}</h1>
                     <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <DeviceStatusTrigger />
                     </div>
                </div>

                <p className="text-center text-gray-400 -mt-4">{translate('workout.tutorial.text')}</p>
                
                <Card>
                    <h3 className="text-lg font-bold text-white mb-2">{translate('workout.selectYourCoach')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {AI_PROVIDERS.map(provider => {
                             // Use the raw name from translations, stripping any (Brand) text if present
                             const rawName = translate(`ai_provider.${provider}.name`);
                             // Split just in case the translation file wasn't fully cleaned, though it should be.
                             const name = rawName.split('(')[0].trim();
                             
                             return (
                                 <button key={provider} onClick={() => setSelectedCoach(provider)} className="glow-container">
                                    <div className={`glow-content p-2 py-3 text-center transition-colors duration-300 ${selectedCoach === provider ? 'bg-[#8A2BE2]/40' : ''}`}>
                                        <p className="font-light text-white text-sm">{name}</p>
                                        {/* Display 'Virtual' instead of company name */}
                                        <p className="text-[10px] text-purple-300 font-light mt-0.5">{translate('coach.type.virtual')}</p>
                                    </div>
                                 </button>
                             );
                        })}
                    </div>
                </Card>

                <Card className="space-y-4">
                    <GenerationOption 
                        title={translate('workout_type.title')} 
                        options={[
                            {key: 'calisthenics', label: translate('workout_type.calisthenics')}, 
                            {key: 'fitness', label: translate('workout_type.fitness')}, 
                            {key: 'powerlifting', label: translate('workout_type.powerlifting')}, 
                            {key: 'pilates', label: translate('workout_type.pilates')},
                            {key: 'yoga_stretching', label: translate('workout_type.yoga_stretching')}
                        ]} 
                        selected={workoutType} 
                        onSelect={setWorkoutType} 
                    />
                    <GenerationOption title={translate('equipment.title')} options={[{key: 'bodyweight', label: translate('equipment.bodyweight')}, {key: 'free_weights', label: translate('equipment.free_weights')}, {key: 'full_gym', label: translate('equipment.full_gym')}]} selected={equipment} onSelect={(key) => setEquipment(p => p.includes(key) ? p.filter(i => i !== key) : [...p, key])} multiSelect={true} />
                    <GenerationOption title={translate('target.title')} options={[{key: 'upper_body', label: translate('target.upper_body')}, {key: 'lower_body', label: translate('target.lower_body')}, {key: 'core_planks', label: translate('target.core_planks')}, {key: 'full_body', label: translate('target.full_body')}]} selected={targetArea} onSelect={(key) => setTargetArea(p => p.includes(key) ? p.filter(i => i !== key) : [...p, key])} multiSelect={true} />
                    <GenerationOption title={translate('workout.intensity.title')} options={[{key: 'low', label: translate('workout.intensity.low')}, {key: 'medium', label: translate('workout.intensity.medium')}, {key: 'high', label: translate('workout.intensity.high')}]} selected={intensity} onSelect={setIntensity} />
                    <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder={translate('workout.inputPlaceholder')} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#8A2BE2] h-20 resize-none"/>
                </Card>
                
                <Button onClick={() => handleGenerateWorkout()} className="w-full flex items-center justify-center text-xl font-bold py-4">
                    <Zap className="w-6 h-6 mr-2" />
                    {translate('home.generateButton')}
                </Button>
            </div>
        );
    }
    
    if (view === 'workout' && currentExercise && workoutPlan) {
        // Dynamic Progress Bar Calculation
        const progressPercent = Math.min(100, (exerciseTime / exerciseDuration) * 100);

        return (
            <div className="animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={handlePrevExercise} disabled={currentExerciseIndex === 0} className="p-2 disabled:opacity-30"><ChevronLeft className="w-8 h-8"/></button>
                  <div className="text-center flex-1 overflow-hidden px-2">
                    <h2 className="text-2xl font-bold text-white truncate">{currentExercise.name}</h2>
                    <p className="text-gray-400 truncate">{currentExercise.description}</p>
                  </div>
                  <button onClick={handleNextExercise} className="p-2"><ChevronRight className="w-8 h-8"/></button>
                </div>
                
                <div className="aspect-square w-full max-w-sm mx-auto rounded-3xl relative shadow-lg border-2 border-purple-500/50 overflow-hidden bg-black/80 backdrop-blur-sm">
                    <HUD sessionTime={sessionTime} />
                    
                    {/* LIVE BADGE ADDED HERE - Ensuring High Z-Index and proper placement */}
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded animate-pulse z-50">
                        {translate('live.badge')}
                    </div>

                    {countdown > 0 ? (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/80 backdrop-blur-sm z-40 countdown-overlay">
                            <div className="text-9xl font-black text-white" style={{ textShadow: '0 0 20px rgba(138, 43, 226, 0.7)' }}>{countdown}</div>
                        </div>
                    ) : (
                        <HolographicCoach key={refreshKey} isPaused={isPaused} state="active" modelUrl={currentExercise.modelUrl}/>
                    )}
                </div>
                
                {/* Exercise Specific Timer & Progress */}
                <div className="w-full max-w-sm mx-auto mt-4 px-4">
                     <div className="flex justify-between items-end mb-1 text-xs font-mono font-bold tracking-wider">
                        <span className="text-[#8A2BE2]">{formatDuration(exerciseTime)}</span>
                        <span className="text-gray-500">/ {formatDuration(exerciseDuration)}</span>
                     </div>
                     <div className="w-full bg-gray-700/50 rounded-full h-1.5 relative overflow-hidden">
                        <div 
                            className="bg-[#8A2BE2] h-1.5 rounded-full transition-all duration-1000 linear" 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                        {/* Little glowing dot at the end of the progress bar */}
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow transition-all duration-1000 linear" 
                            style={{ left: `calc(${progressPercent}% - 6px)` }}
                        ></div>
                    </div>
                </div>

                 <div className="mt-4 flex items-center justify-center space-x-6">
                    {/* Reset / Rotate Button */}
                    <button onClick={handleRestartExercise} className="p-3 text-gray-400 hover:text-white"><RotateCw className="w-6 h-6" /></button>
                    
                    <button onClick={() => { setIsPaused(true); setIsCoachOpen(true); }} className="p-3 text-purple-400 bg-purple-900/30 rounded-full border border-purple-500/50 hover:bg-purple-900/50 transition-colors">
                         <Mic className="w-6 h-6" />
                    </button>

                    {/* Play / Pause Button */}
                    <button onClick={() => setIsPaused(p => !p)} className="p-4 bg-gray-800/80 text-white rounded-full ring-2 ring-gray-700 hover:bg-gray-700 transition-colors">
                        {isPaused ? <Play className="w-8 h-8 ml-1" /> : <Pause className="w-8 h-8" />}
                    </button>
                    
                    {/* Repeat / Restart Button */}
                    <button onClick={handleRestartExercise} className="p-3 text-gray-400 hover:text-white"><Repeat className="w-6 h-6" /></button>
                </div>
            </div>
        );
    }
    
    if (view === 'rest' && workoutPlan) {
        const nextExerciseIndex = currentExerciseIndex + 1;
        const nextExercise = [...(workoutPlan.warmup || []), ...workoutPlan.exercises, ...(workoutPlan.cooldown || [])][nextExerciseIndex];
        return (
            <div className="flex flex-col items-center justify-center text-center min-h-[70vh] animate-fadeIn">
                <p className="text-2xl text-purple-400 font-bold uppercase tracking-widest">{translate('rest')}</p>
                <p className="text-9xl font-bold my-4 text-white">{restTimer}</p>
                <Card className="w-full max-w-sm">
                    <p className="text-sm text-gray-400">{translate('workout.rest.upNext')}</p>
                    <p className="text-xl font-bold text-white">{nextExercise?.name || translate('finish')}</p>
                </Card>
                <Button onClick={handleSkipRest} variant="secondary" className="mt-8">{translate('workout.rest.skip')}</Button>
            </div>
        );
    }
    
    if (view === 'finished' && workoutPlan) {
        return (
             <div className="flex flex-col items-center justify-center text-center min-h-[70vh] animate-fadeIn space-y-6">
                <div className="w-24 h-24 bg-purple-900/50 rounded-full flex items-center justify-center border-4 border-purple-500">
                    <Check className="w-16 h-16 text-purple-300"/>
                </div>
                <h1 className="text-3xl font-bold text-white">{translate('workout.finishWorkout')}</h1>
                <p className="text-gray-300">{translate('workout.finishWorkout')} - "{workoutPlan.title}"</p>
                
                {/* Recovery Fuel Card */}
                <Card className="w-full max-w-md border-red-500/30 bg-gradient-to-r from-red-900/20 to-black text-left relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 bg-black rounded-lg border border-red-500 flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">{translate('workout.recovery.fuel')}</p>
                            <h3 className="text-lg font-bold text-white">F4X ISO-WHEY</h3>
                            <p className="text-xs text-gray-400">{translate('workout.recovery.max')}</p>
                        </div>
                        <button 
                            onClick={() => setScreen(Screen.Nutrition)} 
                            className="bg-red-600 hover:bg-red-500 text-white p-2 px-4 rounded-lg font-bold text-sm shadow-[0_0_15px_rgba(220,38,38,0.4)] uppercase"
                        >
                            {translate('workout.recovery.acquire')}
                        </button>
                    </div>
                </Card>

                <Card className="w-full max-w-md">
                    <div className="space-y-3">
                        <Button onClick={handleSave} className="w-full flex items-center justify-center">
                            <Bookmark className="w-5 h-5 mr-2" /> {translate('workout.save')}
                        </Button>
                         <Button onClick={() => {}} variant="secondary" className="w-full flex items-center justify-center">
                            <Share2 className="w-5 h-5 mr-2" /> {translate('profile.share.title')}
                        </Button>
                        <Button onClick={() => setIsChatbotOpen(true)} variant="secondary" className="w-full flex items-center justify-center">
                            <Bot className="w-5 h-5 mr-2" /> {translate('workout.askCoach')}
                        </Button>
                    </div>
                </Card>
                <Button onClick={resetToGeneration} className="w-full max-w-md">{translate('workout.generateNew')}</Button>
                <Chatbot isVisible={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
            </div>
        );
    }

    // Fallback UI
    return (
        <div className="text-center text-gray-400 min-h-[70vh] flex flex-col justify-center">
            <p>Something went wrong.</p>
            <Button onClick={resetToGeneration} className="mt-4">Go Back</Button>
        </div>
    );
};
