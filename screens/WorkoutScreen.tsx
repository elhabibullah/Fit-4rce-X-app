import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Pause, Play, X, ChevronLeft, ChevronRight, Activity, Timer as TimerIcon, Video, Box, Sun, Moon, 
    CheckCircle2, Flame, Dumbbell, Zap, RotateCcw, FastForward, Award, Clock 
} from 'lucide-react';
import { generateWorkoutWithGemini, getWorkoutSeriesAndRest } from '../services/aiService.ts';
import { WorkoutPlan, Screen, AIProvider } from '../types.ts';
import Loader from '../components/common/Loader.tsx';
import { useApp } from '../hooks/useApp.ts';
import Button from '../components/common/Button.tsx';
import { HolographicCoach } from '../components/common/HolographicCoach.tsx';
import { DeviceStatusTrigger } from '../components/common/DeviceStatusTrigger.tsx';

type WorkoutView = 'setup' | 'loading' | 'active' | 'finished';
type WorkoutPhase = 'prep' | 'work' | 'rest';

const CoachOption: React.FC<{ provider: AIProvider; label: string; isSelected: boolean; onSelect: (p: AIProvider) => void }> = ({ provider, label, isSelected, onSelect }) => (
    <div className={`glow-container w-full h-20 ${isSelected ? 'active' : ''}`}>
        <button 
            onClick={() => onSelect(provider)}
            className="glow-content p-2 w-full h-full text-center"
        >
            <span className="text-[10px] font-light uppercase tracking-[0.2em] leading-tight text-white">{label}</span>
        </button>
    </div>
);

// Self-contained Web Audio synth for tactical feedback
const playSoundEffect = (type: 'beep' | 'done' | 'start') => {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'beep') {
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } else if (type === 'start') {
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } else if (type === 'done') {
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        }
    } catch {
        // Safe fail if audio context cannot be initialized
    }
};

const WorkoutScreen: React.FC = () => {
    const { setScreen, language, showStatus, logWorkout, selectedPlan, setSelectedPlan, selectedCoachPersona, setSelectedCoachPersona, setIsGeneratingWorkout, translate } = useApp();
    
    const [view, setView] = useState<WorkoutView>(selectedPlan ? 'active' : 'setup');
    const [plan, setPlan] = useState<WorkoutPlan | null>(selectedPlan);
    const [idx, setIdx] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [phase, setPhase] = useState<WorkoutPhase>('prep');
    
    // Timers
    const [timer, setTimer] = useState(45); // Work set pacing countdown
    const [restTimer, setRestTimer] = useState(30); // Rest pause countdown
    const [prepTimer, setPrepTimer] = useState(8); // Preparation countdown
    const [isPaused, setIsPaused] = useState(false);
    
    // Statistics counters
    const [completedSetsTotal, setCompletedSetsTotal] = useState(0);
    const [completedRepsTotal, setCompletedRepsTotal] = useState(0);
    const [sessionDurationSeconds, setSessionDurationSeconds] = useState(0);

    const [customRequirements, setCustomRequirements] = useState('');
    const [displayMode, setDisplayMode] = useState<'video' | '3d'>('3d');
    const [studioTheme, setStudioTheme] = useState<'white' | 'dark'>(() => {
        return (localStorage.getItem('f4x_studio_theme') as 'white' | 'dark') || 'white';
    });
    const videoRef = useRef<HTMLVideoElement>(null);

    // Setup configuration:
    // Level rule:
    // Beginner ('low'): 3 sets x 15 reps (3x15)
    // Medium ('medium'): 4 sets x 14 reps (4x14)
    // Advanced ('high'): 5 sets x 15 reps (5x15)
    const [workoutType, setWorkoutType] = useState('fitness');
    const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
    
    // Rest rule:
    // Standard Fitness: 30s pause max (default 30s)
    // Mass Gaining: 45s pause (optimal metabolic stress / hypertrophy)
    // Power Training: 60s pause (neuromuscular / ATP-CP recovery)
    const [trainingGoal, setTrainingGoal] = useState<'fitness' | 'mass_gaining' | 'power_training'>('fitness');
    const [customRestSeconds, setCustomRestSeconds] = useState<number | null>(null);

    // Synchronize training goal with workout type if relevant
    const handleSelectWorkoutType = (type: string) => {
        setWorkoutType(type);
        if (type === 'powerlifting' || type === 'power_training') {
            setTrainingGoal('power_training');
        } else if (type === 'mass_gaining') {
            setTrainingGoal('mass_gaining');
        } else if (trainingGoal === 'power_training' || trainingGoal === 'mass_gaining') {
            // Keep current goal unless user wants to change
        }
    };

    // Calculate current target sets and reps
    const currentEx = plan ? plan.exercises[idx] : null;

    const targetSets = currentEx?.sets || plan?.targetSets || (
        intensity === 'low' ? 3 :
        intensity === 'high' ? 5 : 4
    );

    const targetReps = currentEx?.reps || plan?.targetReps || (
        intensity === 'medium' ? 14 : 15
    );

    const restBetweenSets = customRestSeconds || currentEx?.restSeconds || plan?.restBetweenSets || (
        trainingGoal === 'power_training' ? 60 :
        trainingGoal === 'mass_gaining' ? 45 : 30
    );

    // Initialize or reload when plan changes
    useEffect(() => {
        if (selectedPlan) {
            setPlan(selectedPlan);
            setView('active');
            setIdx(0);
            setCurrentSet(1);
            setPhase('prep');
            setPrepTimer(8);
            setTimer(45);
            setRestTimer(selectedPlan.restBetweenSets || 30);
            setIsPaused(false);
            setCompletedSetsTotal(0);
            setCompletedRepsTotal(0);
            setSessionDurationSeconds(0);
        }
    }, [selectedPlan]);

    const handleFinish = useCallback(() => {
        if (plan) {
            logWorkout(plan);
        }
        playSoundEffect('done');
        setView('finished');
    }, [plan, logWorkout]);

    // Action: Complete the current set (manually or when work timer completes)
    const handleCompleteSet = useCallback(() => {
        if (!plan) return;
        playSoundEffect('done');
        setCompletedSetsTotal(prev => prev + 1);
        setCompletedRepsTotal(prev => prev + targetReps);

        if (currentSet < targetSets) {
            // More sets to complete in this exercise -> Enter rest pause
            setPhase('rest');
            setRestTimer(restBetweenSets);
        } else {
            // All sets for current exercise completed!
            if (idx < plan.exercises.length - 1) {
                // Next exercise -> Inter-exercise transition
                setIdx(prev => prev + 1);
                setCurrentSet(1);
                setPhase('rest');
                setRestTimer(restBetweenSets);
            } else {
                // Entire workout completed!
                handleFinish();
            }
        }
    }, [plan, currentSet, targetSets, targetReps, idx, restBetweenSets, handleFinish]);

    // Action: Skip the rest pause and immediately start the next set
    const handleSkipRest = useCallback(() => {
        playSoundEffect('start');
        if (currentSet < targetSets) {
            setCurrentSet(prev => prev + 1);
            setPhase('work');
            setTimer(45);
        } else {
            // Was resting between exercises
            setPhase('work');
            setTimer(45);
        }
    }, [currentSet, targetSets]);

    // Action: Add 10 seconds of rest
    const handleAddRestTime = () => {
        setRestTimer(prev => prev + 10);
    };

    // Action: Skip to next exercise
    const skipExercise = useCallback(() => {
        if (!plan) return;
        if (idx < plan.exercises.length - 1) {
            setIdx(prev => prev + 1);
            setCurrentSet(1);
            setPhase('prep');
            setPrepTimer(6);
            setTimer(45);
            setIsPaused(false);
        } else {
            handleFinish();
        }
    }, [idx, plan, handleFinish]);

    const handleClose = () => {
        setSelectedPlan(null);
        setScreen(Screen.Home);
    };

    // Main Timer Engine
    useEffect(() => {
        if (view !== 'active' || isPaused || !plan) return;

        const interval = setInterval(() => {
            // Track total session duration
            setSessionDurationSeconds(prev => prev + 1);

            if (phase === 'prep') {
                setPrepTimer((prev) => {
                    if (prev <= 1) {
                        playSoundEffect('start');
                        setPhase('work');
                        setTimer(45);
                        return 8;
                    }
                    if (prev <= 4) {
                        playSoundEffect('beep');
                    }
                    return prev - 1;
                });
            } else if (phase === 'work') {
                setTimer((prev) => {
                    if (prev <= 1) {
                        handleCompleteSet();
                        return 45;
                    }
                    return prev - 1;
                });
            } else if (phase === 'rest') {
                setRestTimer((prev) => {
                    if (prev <= 1) {
                        handleSkipRest();
                        return restBetweenSets;
                    }
                    if (prev <= 4) {
                        playSoundEffect('beep');
                    }
                    return prev - 1;
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [view, isPaused, phase, plan, handleCompleteSet, handleSkipRest, restBetweenSets]);

    // Video play/pause synchronization
    useEffect(() => {
        const v = videoRef.current;
        if (v) {
            if (isPaused || phase === 'prep' || phase === 'rest') {
                v.pause();
            } else {
                v.play().catch(e => console.log("Video playback error:", e));
            }
        }
    }, [isPaused, phase, idx, view, displayMode]);

    // Generate workout with Gemini or high-performance fallback
    const handleGenerate = async () => {
        setView('loading');
        setIsGeneratingWorkout(true);
        try {
            const { sets, reps, restSeconds } = getWorkoutSeriesAndRest(intensity, trainingGoal);
            const prompt = `Generate a ${intensity} intensity ${workoutType} workout. Protocol: ${sets} sets of ${reps} reps with ${restSeconds}s rest pause between sets. Requirements: ${customRequirements}. Be concise.`;
            
            const generated = await generateWorkoutWithGemini(prompt, language, {
                level: intensity,
                goal: trainingGoal,
                targetSets: sets,
                targetReps: reps,
                restBetweenSets: restSeconds
            });

            if (generated) {
                setPlan(generated);
                setSelectedPlan(generated);
                setView('active');
                setIdx(0);
                setCurrentSet(1);
                setPhase('prep');
                setPrepTimer(8);
                setTimer(45);
                setRestTimer(restSeconds);
                setIsPaused(false);
                setCompletedSetsTotal(0);
                setCompletedRepsTotal(0);
                setSessionDurationSeconds(0);
            } else throw new Error();
        } catch (error) {
            showStatus(translate('workout.error.neural'));
            setView('setup');
        } finally {
            setIsGeneratingWorkout(false);
        }
    };

    if (view === 'loading') return (
        <div className="fixed inset-0 z-[3000] bg-black flex flex-col items-center justify-center p-8 font-['Poppins']">
            <Loader />
            <p className="text-[#8A2BE2] font-light uppercase tracking-[0.4em] mt-8 animate-pulse text-xs text-center">
                {translate('workout.loading.calculating')}
            </p>
            <div className="mt-4 px-4 py-2 bg-neutral-900/80 border border-neutral-800 rounded-full text-zinc-400 text-[11px] font-mono tracking-widest uppercase">
                {intensity === 'low' ? '3x15 Séries' : intensity === 'high' ? '5x15 Séries' : '4x14 Séries'} • Pause {trainingGoal === 'power_training' ? '60s' : trainingGoal === 'mass_gaining' ? '45s' : '30s max'}
            </div>
        </div>
    );

    if (view === 'active' && plan) {
        const ex = plan.exercises[idx];
        if (!ex) return null;
        
        const hasVideo = !!ex.videoUrl;
        const workProgress = ((45 - timer) / 45) * 100;
        const restProgress = ((restBetweenSets - restTimer) / restBetweenSets) * 100;

        return (
            <div className={`fixed inset-0 z-[2500] ${displayMode === '3d' ? (studioTheme === 'dark' ? 'bg-[#08080c]' : 'bg-white') : 'bg-neutral-950'} flex flex-col font-['Poppins'] overflow-hidden`}>
                <div className={`relative flex-1 ${displayMode === '3d' ? (studioTheme === 'dark' ? 'bg-[#08080c]' : 'bg-white') : 'bg-neutral-950'} overflow-hidden`}>
                    
                    {/* VIDEO OR 3D COACH VIEW */}
                    {displayMode === 'video' && hasVideo ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
                            <video
                                ref={videoRef}
                                key={ex.videoUrl}
                                src={ex.videoUrl}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
                        </div>
                    ) : (
                        <div className={`absolute inset-0 z-10 ${studioTheme === 'dark' ? 'bg-[#08080c]' : 'bg-white'}`}>
                            <HolographicCoach 
                                key="workout-holographic-coach"
                                modelUrl={ex.modelUrl} 
                                isPaused={isPaused || phase === 'rest'} 
                                exerciseName={ex.name}
                                isPrep={phase === 'prep'}
                                studioTheme={studioTheme}
                                onToggleStudioTheme={(next) => {
                                    setStudioTheme(next);
                                    localStorage.setItem('f4x_studio_theme', next);
                                }}
                                hideThemeToggle={true}
                            />
                        </div>
                    )}

                    {/* TOP CONTROLS & HUD */}
                    <div className="absolute top-0 left-0 right-0 z-[500] p-3 sm:p-5 flex justify-between items-start pointer-events-none">
                        <div className="flex items-center gap-2 pointer-events-auto flex-wrap max-w-[75%]">
                            <button 
                                onClick={handleClose} 
                                className={`p-2.5 rounded-full shadow-2xl active:scale-90 transition-transform border ${
                                    studioTheme === 'dark' && displayMode === '3d'
                                        ? 'bg-neutral-900/90 text-white border-neutral-700'
                                        : 'bg-white/90 text-black border-zinc-200'
                                    }`}
                                title="Fermer la séance"
                            >
                                <X size={18}/>
                            </button>

                            {/* EMS BAND TRIGGER */}
                            <DeviceStatusTrigger showLabel />

                            {/* TOGGLE VIDEO / 3D COACH */}
                            {hasVideo && (
                                <button 
                                    onClick={() => setDisplayMode(prev => prev === 'video' ? '3d' : 'video')}
                                    className="px-3 py-1.5 bg-black/70 backdrop-blur-md border border-purple-500/40 rounded-full text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                                >
                                    {displayMode === 'video' ? <Box size={13} className="text-purple-400" /> : <Video size={13} className="text-purple-400" />}
                                    <span>{displayMode === 'video' ? 'Coach 3D' : 'Vidéo'}</span>
                                </button>
                            )}

                            {/* STUDIO NIGHT / DAY MODE TOGGLE */}
                            {displayMode === '3d' && (
                                <button
                                    onClick={() => {
                                        const next = studioTheme === 'dark' ? 'white' : 'dark';
                                        setStudioTheme(next);
                                        localStorage.setItem('f4x_studio_theme', next);
                                    }}
                                    className={`px-3 py-1.5 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all border ${
                                        studioTheme === 'dark'
                                            ? 'bg-neutral-900/90 border-neutral-700 text-white hover:bg-neutral-800'
                                            : 'bg-white/90 border-zinc-200 text-neutral-800 hover:bg-neutral-100'
                                    }`}
                                    title={studioTheme === 'dark' ? "Passer au Studio Blanc" : "Passer en Mode Nuit (Studio Noir)"}
                                >
                                    {studioTheme === 'dark' ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-purple-600" />}
                                    <span className="hidden sm:inline">{studioTheme === 'dark' ? 'Studio Blanc' : 'Mode Nuit'}</span>
                                </button>
                            )}

                            {/* CURRENT PROTOCOL BADGE */}
                            <div className="px-2.5 py-1 bg-black/80 backdrop-blur-md border border-zinc-800 rounded-full text-white text-[10px] font-mono tracking-wider flex items-center gap-1.5 shadow-lg">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="font-bold text-[#8A2BE2]">{targetSets}×{targetReps}</span>
                                <span className="text-zinc-400">• Pause {restBetweenSets}s</span>
                            </div>
                        </div>

                        {/* RIGHT HUD: TIMER & PLAY/PAUSE */}
                        <div className="flex flex-col items-end gap-2 pointer-events-auto">
                            <div className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl border ${
                                phase === 'rest' 
                                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                                    : 'bg-[#8A2BE2] text-white border-purple-400 shadow-[0_0_20px_rgba(138,43,226,0.4)]'
                            }`}>
                                <TimerIcon size={15} />
                                <span className="text-base sm:text-lg font-bold font-mono leading-none">
                                    {phase === 'rest' ? restTimer : timer}s
                                </span>
                            </div>

                            <button 
                                onClick={() => setIsPaused(!isPaused)} 
                                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all border ${
                                    studioTheme === 'dark' && displayMode === '3d'
                                        ? 'bg-neutral-900 text-white border-neutral-700'
                                        : 'bg-white/95 text-black border-zinc-200'
                                }`}
                                title={isPaused ? "Reprendre" : "Mettre en pause"}
                            >
                                {isPaused ? <Play size={18} fill={studioTheme === 'dark' && displayMode === '3d' ? "white" : "black"} className="ml-0.5"/> : <Pause size={18} fill={studioTheme === 'dark' && displayMode === '3d' ? "white" : "black"}/>}
                            </button>
                        </div>
                    </div>

                    {/* PREP COUNTDOWN OVERLAY */}
                    {phase === 'prep' && (
                        <div className={`absolute inset-0 z-[200] ${displayMode === '3d' ? 'bg-white/60 backdrop-blur-[3px]' : 'bg-zinc-950/60 backdrop-blur-[4px]'} flex flex-col items-center justify-center animate-fadeIn pointer-events-none px-4 text-center`}>
                            <div className="px-4 py-1.5 bg-black/80 border border-purple-500/50 rounded-full text-[#8A2BE2] text-xs font-bold tracking-[0.2em] uppercase mb-2">
                                Préparez-vous
                            </div>
                            <div className={`text-[7rem] sm:text-[11rem] font-black ${displayMode === '3d' ? 'text-purple-600 drop-shadow-[0_0_40px_rgba(138,43,226,0.35)]' : 'text-white drop-shadow-[0_0_40px_rgba(138,43,226,0.8)]'} leading-none tabular-nums animate-pulse`}>
                                {prepTimer}
                            </div>
                            <div className="px-6 py-3 bg-[#8A2BE2] text-white rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm mt-6 shadow-[0_0_30px_rgba(138,43,226,0.6)] text-center max-w-[92%] break-words">
                                {ex.name} • Série {currentSet}/{targetSets} ({targetReps} reps)
                            </div>
                        </div>
                    )}

                    {/* REST BETWEEN SETS HUD OVERLAY - OPTIMIZED FOR ANDROID FRAMES */}
                    {phase === 'rest' && (
                        <div className="absolute inset-0 z-[200] bg-black/92 backdrop-blur-md overflow-y-auto overscroll-contain flex flex-col items-center justify-between p-4 sm:p-6 text-center select-none pointer-events-auto custom-scrollbar">
                            <div className="max-w-md w-full my-auto py-2 flex flex-col items-center space-y-3 sm:space-y-4">
                                
                                {/* TOP ROW: REST BADGE & QUICK PAUSE & EMS BAND */}
                                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-300 text-[11px] font-bold uppercase tracking-[0.2em]">
                                        <Clock size={13} className="animate-spin text-amber-400" />
                                        <span>{translate('workout.active.rest')}</span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setIsPaused(!isPaused)} 
                                        className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-xs text-white hover:bg-neutral-800 flex items-center gap-1.5 active:scale-95 transition-all"
                                    >
                                        {isPaused ? (
                                            <>
                                                <Play size={12} fill="white" />
                                                <span>Reprendre</span>
                                            </>
                                        ) : (
                                            <>
                                                <Pause size={12} fill="white" />
                                                <span>Pause</span>
                                            </>
                                        )}
                                    </button>

                                    {/* EMS BAND TRIGGER DIRECTLY IN REST */}
                                    <DeviceStatusTrigger showLabel />
                                </div>

                                {/* GIANT DIGITAL COUNTDOWN (SCALED FOR MOBILE) */}
                                <div className="relative flex items-center justify-center py-1">
                                    <div className="text-6xl sm:text-8xl font-black font-mono text-white tracking-tighter drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                                        {restTimer}
                                        <span className="text-2xl sm:text-3xl text-amber-400 font-sans ml-1">s</span>
                                    </div>
                                </div>

                                {/* REST CONTEXT BADGE (POWER TRAINING VS MASS GAINING VS FITNESS) */}
                                <div className="px-3.5 py-2 bg-neutral-900/90 border border-neutral-800 rounded-xl text-zinc-300 text-[11px] text-center max-w-sm">
                                    {trainingGoal === 'power_training' && (
                                        <p className="flex items-center justify-center gap-1.5 font-medium">
                                            <Zap size={13} className="text-amber-400 shrink-0" />
                                            <span><strong>Power Training</strong> : Récupération neuromusculaire complète (60s).</span>
                                        </p>
                                    )}
                                    {trainingGoal === 'mass_gaining' && (
                                        <p className="flex items-center justify-center gap-1.5 font-medium">
                                            <Flame size={13} className="text-orange-400 shrink-0" />
                                            <span><strong>Prise de Masse</strong> : Stress métabolique & hypertrophie optimaux (45s).</span>
                                        </p>
                                    )}
                                    {trainingGoal === 'fitness' && (
                                        <p className="flex items-center justify-center gap-1.5 font-medium">
                                            <Activity size={13} className="text-purple-400 shrink-0" />
                                            <span><strong>Fitness Standard</strong> : 30s pause max pour maintenir l'intensité.</span>
                                        </p>
                                    )}
                                </div>

                                {/* UP NEXT PREVIEW */}
                                <div className="bg-neutral-950/90 border border-purple-500/30 rounded-xl p-3.5 w-full max-w-sm">
                                    <span className="text-[9px] font-bold text-purple-400 uppercase tracking-[0.25em] block mb-1">
                                        {translate('workout.active.next')}
                                    </span>
                                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase leading-snug">
                                        {currentSet < targetSets ? (
                                            <>Série {currentSet + 1} / {targetSets} <span className="text-purple-400">({targetReps} reps)</span> • {ex.name}</>
                                        ) : (
                                            <>Prochain Exercice : {plan.exercises[idx + 1]?.name || 'Fin de séance'}</>
                                        )}
                                    </h3>
                                </div>

                                {/* REST CONTROLS */}
                                <div className="flex items-center gap-2.5 w-full max-w-sm pt-1">
                                    <button
                                        onClick={handleSkipRest}
                                        className="flex-1 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-2xl hover:bg-neutral-200 active:scale-95 transition-all"
                                    >
                                        <FastForward size={14} />
                                        <span>{translate('workout.active.skip_rest')}</span>
                                    </button>

                                    <button
                                        onClick={handleAddRestTime}
                                        className="px-4 py-3 bg-neutral-900 border border-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-800 active:scale-95 transition-all"
                                        title="Ajouter 10 secondes"
                                    >
                                        {translate('workout.active.add_time')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTTOM EXERCISE & SETS HUD BAR */}
                <div className="bg-zinc-950 px-4 sm:px-8 py-4 sm:py-6 z-[300] relative flex flex-col justify-center border-t border-zinc-900 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
                    
                    {/* PROGRESS BAR */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-900 overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ease-linear ${
                                phase === 'rest' 
                                    ? 'bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.8)]' 
                                    : 'bg-[#8A2BE2] shadow-[0_0_15px_#8A2BE2]'
                            }`}
                            style={{ width: `${phase === 'rest' ? restProgress : workProgress}%` }} 
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        
                        {/* LEFT: EXERCISE INFO & SET BADGES */}
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-[10px] font-black text-[#8A2BE2] uppercase tracking-[0.25em]">
                                    Exercice {idx + 1} / {plan.exercises.length}
                                </span>
                                
                                {/* SERIES BADGE (e.g. SÉRIE 2 / 4) */}
                                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase tracking-wider">
                                    Série {currentSet} / {targetSets}
                                </span>

                                {/* REPS BADGE */}
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
                                    {targetReps} Reps
                                </span>
                            </div>

                            <h2 className={`${ex.name.length > 25 ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-black text-white uppercase leading-tight truncate`}>
                                {ex.name}
                            </h2>

                            {/* SETS PROGRESS CHIPS (e.g. 3, 4, or 5 sets indicator) */}
                            <div className="flex items-center gap-1.5 mt-2">
                                {Array.from({ length: targetSets }).map((_, sIdx) => {
                                    const setNumber = sIdx + 1;
                                    const isDone = setNumber < currentSet;
                                    const isCurrent = setNumber === currentSet;
                                    return (
                                        <div 
                                            key={sIdx}
                                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase transition-all ${
                                                isDone 
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                                                    : isCurrent 
                                                        ? 'bg-[#8A2BE2] text-white shadow-[0_0_10px_rgba(138,43,226,0.6)] animate-pulse' 
                                                        : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                                            }`}
                                        >
                                            {isDone && <CheckCircle2 size={10} />}
                                            <span>S{setNumber}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT: COMPLETE SET BUTTON & SKIP EXERCISE */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {phase === 'work' && (
                                <button
                                    onClick={handleCompleteSet}
                                    className="flex-1 sm:flex-initial px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all shrink-0"
                                >
                                    <CheckCircle2 size={18} />
                                    <span>{translate('workout.active.validate_set')} ({targetReps} reps)</span>
                                </button>
                            )}

                            {phase === 'rest' && (
                                <button
                                    onClick={handleSkipRest}
                                    className="flex-1 sm:flex-initial px-5 py-3.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all shrink-0"
                                >
                                    <FastForward size={18} />
                                    <span>{translate('workout.active.skip_rest')}</span>
                                </button>
                            )}

                            <button 
                                onClick={skipExercise} 
                                title="Passer à l'exercice suivant"
                                className="bg-neutral-800 hover:bg-neutral-700 text-white w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-xl shrink-0"
                            >
                                <ChevronRight size={22} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'finished') {
        const totalRepsCalculated = completedRepsTotal || (plan ? plan.exercises.length * targetSets * targetReps : 0);
        const totalSetsCalculated = completedSetsTotal || (plan ? plan.exercises.length * targetSets : 0);
        const minutes = Math.floor(sessionDurationSeconds / 60);
        const seconds = sessionDurationSeconds % 60;

        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-black font-['Poppins']">
                <div className="w-20 h-20 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(138,43,226,0.5)]">
                    <Award size={44} className="text-purple-400" />
                </div>
                
                <h2 className="text-xl sm:text-3xl font-black text-white uppercase mb-2 tracking-wide px-2 leading-none">
                    {translate('workout.finished.title')}
                </h2>
                <p className="text-zinc-400 text-xs mb-8 uppercase tracking-widest leading-relaxed max-w-sm mx-auto px-4">
                    {translate('workout.finished.desc')}
                </p>

                {/* STATS SUMMARY RECAP */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-8">
                    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Séries</span>
                        <span className="text-2xl font-black text-white font-mono">{totalSetsCalculated}</span>
                    </div>
                    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Répétitions</span>
                        <span className="text-2xl font-black text-emerald-400 font-mono">{totalRepsCalculated}</span>
                    </div>
                    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Pause Séries</span>
                        <span className="text-2xl font-black text-amber-400 font-mono">{restBetweenSets}s</span>
                    </div>
                </div>

                <div className="bg-neutral-900/60 border border-zinc-800 rounded-2xl p-4 w-full max-w-md mb-8 text-left">
                    <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-zinc-500 uppercase">Protocole appliqué :</span>
                        <span className="font-bold text-purple-400">
                            {targetSets}×{targetReps} ({intensity === 'low' ? 'Débutant 3x15' : intensity === 'high' ? 'Avancé 5x15' : 'Moyen 4x14'})
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-zinc-500 uppercase">Objectif & Récupération :</span>
                        <span className="font-bold text-amber-400">
                            {trainingGoal === 'power_training' ? 'Power Training (60s)' : trainingGoal === 'mass_gaining' ? 'Prise de Masse (45s)' : 'Fitness Standard (30s max)'}
                        </span>
                    </div>
                    {sessionDurationSeconds > 0 && (
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 uppercase">Temps total :</span>
                            <span className="font-bold text-white font-mono">{minutes}m {seconds}s</span>
                        </div>
                    )}
                </div>

                <Button onClick={() => setScreen(Screen.Home)} className="w-full max-w-md py-6 font-bold text-xs tracking-widest uppercase shadow-[0_0_40px_rgba(138,43,226,0.3)]">
                    {translate('workout.btn.home')}
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 animate-fadeIn max-w-lg mx-auto w-full pt-6 pb-44 overflow-y-auto bg-black custom-scrollbar font-['Poppins']">
            <header className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setScreen(Screen.Home)} className="p-2 text-gray-500 hover:text-white -ml-2 transition-colors">
                        <ChevronLeft size={26} />
                    </button>
                    <DeviceStatusTrigger showLabel />
                </div>
                <h1 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight sm:tracking-widest px-2 leading-none text-center">
                    {translate('workout.setup.title')}
                </h1>
                <div className="w-16 h-0.5 bg-[#8A2BE2] mx-auto mt-5 rounded-full shadow-[0_0_15px_#8A2BE2]" />
            </header>
            
            <div className="space-y-10">
                
                {/* 1. SELECT COACH */}
                <section>
                    <h3 className="text-[10px] font-light text-zinc-500 uppercase tracking-[0.5em] mb-4 px-1">
                        {translate('workout.setup.coach')}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <CoachOption provider="anthropic" label={translate('workout.coach.noemie')} isSelected={selectedCoachPersona === 'anthropic'} onSelect={setSelectedCoachPersona} />
                        <CoachOption provider="gemini" label={translate('workout.coach.abdel')} isSelected={selectedCoachPersona === 'gemini'} onSelect={setSelectedCoachPersona} />
                        <CoachOption provider="openai" label={translate('workout.coach.noor')} isSelected={selectedCoachPersona === 'openai'} onSelect={setSelectedCoachPersona} />
                        <CoachOption provider="perplexity" label={translate('workout.coach.saud')} isSelected={selectedCoachPersona === 'perplexity'} onSelect={setSelectedCoachPersona} />
                    </div>
                </section>

                {/* 2. DISCIPLINES */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-[1px] flex-1 bg-zinc-800"></div>
                        <h3 className="text-[10px] font-light text-zinc-500 uppercase tracking-[0.5em] px-2">
                            {translate('workout.setup.disciplines')}
                        </h3>
                        <div className="h-[1px] flex-1 bg-zinc-800"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { key: 'fitness', label: 'Fitness' },
                            { key: 'calisthenics', label: 'Calisthénie' },
                            { key: 'powerlifting', label: 'Powerlifting / Force' },
                            { key: 'mass_gaining', label: 'Prise de Masse' },
                            { key: 'pilates', label: 'Pilates' },
                            { key: 'yoga', label: 'Yoga' }
                        ].map(({ key, label }) => (
                            <div key={key} className={`glow-container w-full h-14 ${workoutType === key ? 'active' : ''}`}>
                                <button 
                                    onClick={() => handleSelectWorkoutType(key)} 
                                    className="glow-content w-full h-full text-[9px] font-bold uppercase tracking-[0.2em] text-white px-2"
                                >
                                    {label}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. LEVEL & SERIES PROTOCOL (BEGINNER: 3x15, MEDIUM: 4x14, ADVANCED: 5x15) */}
                <section className="bg-neutral-950/70 border border-zinc-800/80 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[10px] font-light text-zinc-400 uppercase tracking-[0.4em]">
                            {translate('workout.setup.intensity')}
                        </h3>
                        <span className="text-[10px] font-bold text-purple-400 uppercase font-mono">
                            {intensity === 'low' ? '3 × 15' : intensity === 'high' ? '5 × 15' : '4 × 14'}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                        {[
                            { level: 'low' as const, title: 'Débutant', desc: '3 Séries × 15' },
                            { level: 'medium' as const, title: 'Moyen', desc: '4 Séries × 14' },
                            { level: 'high' as const, title: 'Avancé', desc: '5 Séries × 15' }
                        ].map(({ level, title, desc }) => (
                            <button
                                key={level}
                                onClick={() => setIntensity(level)}
                                className={`p-3 rounded-xl border text-center transition-all active:scale-95 ${
                                    intensity === level
                                        ? 'bg-[#8A2BE2] text-white border-purple-400 shadow-[0_0_20px_rgba(138,43,226,0.4)]'
                                        : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                                }`}
                            >
                                <span className="block text-[11px] font-black uppercase tracking-wider mb-1 leading-tight">
                                    {title}
                                </span>
                                <span className={`block text-[10px] font-mono ${intensity === level ? 'text-white' : 'text-zinc-500'}`}>
                                    {desc}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 4. OBJECTIVE & REST PERIOD (POWER TRAINING: 60s, MASS GAINING: 45s, FITNESS: 30s MAX) */}
                <section className="bg-neutral-950/70 border border-zinc-800/80 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[10px] font-light text-zinc-400 uppercase tracking-[0.4em]">
                            {translate('workout.setup.goal')}
                        </h3>
                        <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">
                            Pause {trainingGoal === 'power_training' ? '60s' : trainingGoal === 'mass_gaining' ? '45s' : '30s max'}
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {[
                            { 
                                goal: 'fitness' as const, 
                                title: 'Fitness Standard', 
                                pause: '30s max', 
                                desc: 'Cadence dynamique & maintien du rythme métabolique' 
                            },
                            { 
                                goal: 'mass_gaining' as const, 
                                title: 'Prise de Masse (Hypertrophie)', 
                                pause: '45s', 
                                desc: 'Accumulation du stress métabolique & recharge cellulaire' 
                            },
                            { 
                                goal: 'power_training' as const, 
                                title: 'Power Training (Force & Puissance)', 
                                pause: '60s', 
                                desc: 'Récupération neuromusculaire complète & régénération ATP' 
                            }
                        ].map(({ goal, title, pause, desc }) => (
                            <button
                                key={goal}
                                onClick={() => {
                                    setTrainingGoal(goal);
                                    setCustomRestSeconds(null);
                                }}
                                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                                    trainingGoal === goal
                                        ? 'bg-neutral-900 text-white border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                        : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                                }`}
                            >
                                <div className="min-w-0 pr-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-black uppercase tracking-wider ${trainingGoal === goal ? 'text-white' : 'text-zinc-300'}`}>
                                            {title}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
                                        {desc}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold shrink-0 ${
                                    trainingGoal === goal
                                        ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                        : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                    {pause}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 5. REQUIREMENTS */}
                <section>
                    <h3 className="text-[10px] font-light text-zinc-500 uppercase tracking-[0.5em] mb-3 px-1">
                        {translate('workout.setup.requirements')}
                    </h3>
                    <textarea 
                        value={customRequirements}
                        onChange={(e) => setCustomRequirements(e.target.value)}
                        placeholder="Ex: accent sur les quadriceps, aucun matériel ou haltères légères..."
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-white text-xs font-light tracking-wider focus:outline-none focus:border-purple-500/50 min-h-[90px] resize-none"
                    />
                </section>

                {/* 6. GENERATE BUTTON */}
                <div className="pt-4">
                    <Button onClick={handleGenerate} className="w-full py-6 text-sm font-light uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(138,43,226,0.35)]">
                        {translate('workout.btn.generate')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default WorkoutScreen;
