import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Pause, Play, X, ChevronRight, Activity, Timer as TimerIcon } from 'lucide-react';
import { generateWorkoutWithGemini } from '../services/aiService.ts';
import { WorkoutPlan, Screen, AIProvider } from '../types.ts';
import Loader from '../components/common/Loader.tsx';
import { useApp } from '../hooks/useApp.ts';
import Button from '../components/common/Button.tsx';
import { HolographicCoach } from '../components/common/HolographicCoach.tsx';

type WorkoutView = 'setup' | 'loading' | 'active' | 'finished';

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

export const WorkoutScreen: React.FC = () => {
    const { setScreen, language, showStatus, logWorkout, selectedPlan, setSelectedPlan, selectedCoachPersona, setSelectedCoachPersona, setIsGeneratingWorkout, translate } = useApp();
    
    const [view, setView] = useState<WorkoutView>(selectedPlan ? 'active' : 'setup');
    const [plan, setPlan] = useState<WorkoutPlan | null>(selectedPlan);
    const [idx, setIdx] = useState(0);
    const [timer, setTimer] = useState(45);
    const [isPaused, setIsPaused] = useState(false);
    const [isPrep, setIsPrep] = useState(true);
    const [prepTimer, setPrepTimer] = useState(10);
    const [customRequirements, setCustomRequirements] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);

    const [workoutType, setWorkoutType] = useState('fitness');
    const [intensity, setIntensity] = useState('medium');

    const handleFinish = useCallback(() => {
        if (plan) logWorkout(plan);
        setView('finished');
    }, [plan, logWorkout]);

    const skipExercise = useCallback(() => {
        if (!plan) return;
        if (idx < plan.exercises.length - 1) {
            setIdx(prev => prev + 1);
            setTimer(45);
            setPrepTimer(10);
            setIsPrep(true);
            setIsPaused(false);
        } else {
            handleFinish();
        }
    }, [idx, plan, handleFinish]);

    const handleClose = () => {
        setSelectedPlan(null);
        setScreen(Screen.Home);
    };

    useEffect(() => {
        if (view !== 'active' || isPaused || !plan) return;
        const interval = setInterval(() => {
            if (isPrep) {
                setPrepTimer((prev) => {
                    if (prev <= 1) {
                        setIsPrep(false);
                        return 10;
                    }
                    return prev - 1;
                });
            } else {
                setTimer((prev) => {
                    if (prev <= 1) {
                        skipExercise();
                        return 45;
                    }
                    return prev - 1;
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [view, isPaused, isPrep, plan, skipExercise]);

    useEffect(() => {
        const v = videoRef.current;
        if (v) {
            if (isPaused || isPrep) {
                v.pause();
            } else {
                v.play().catch(e => console.log("Video error:", e));
            }
        }
    }, [isPaused, isPrep, idx, view]);

    const handleGenerate = async () => {
        setView('loading');
        setIsGeneratingWorkout(true);
        try {
            const prompt = `${intensity} intensity ${workoutType} session. Requirements: ${customRequirements}`;
            const generated = await generateWorkoutWithGemini(prompt, language);
            if (generated) {
                setPlan(generated);
                setSelectedPlan(generated);
                setView('active');
                setIdx(0);
                setTimer(45);
                setPrepTimer(10);
                setIsPrep(true);
            } else throw new Error();
        } catch (error) {
            showStatus(translate('workout.error.neural'));
            setView('setup');
        } finally {
            setIsGeneratingWorkout(false);
        }
    };

    if (view === 'loading') return (
        <div className="fixed inset-0 z-[3000] bg-black flex flex-col items-center justify-center p-8">
            <Loader />
            <p className="text-[#8A2BE2] font-light uppercase tracking-[0.4em] mt-8 animate-pulse text-xs">
                {translate('workout.loading.calculating')}
            </p>
        </div>
    );

    if (view === 'active' && plan) {
        const ex = plan.exercises[idx];
        const progress = ((45 - timer) / 45) * 100;
        const hasVideo = !!ex.videoUrl;

        return (
            <div className="fixed inset-0 z-[2500] bg-white flex flex-col font-['Poppins'] animate-fadeIn overflow-hidden">
                <div className="relative flex-1 bg-white overflow-hidden">
                    {hasVideo ? (
                        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
                            <video 
                                ref={videoRef}
                                key={ex.videoUrl}
                                src={ex.videoUrl}
                                loop 
                                muted 
                                playsInline 
                                autoPlay
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="absolute inset-0 z-10">
                            <HolographicCoach key={`coach-${idx}`} modelUrl={ex.modelUrl} isPaused={isPaused} />
                        </div>
                    )}

                    <div className="absolute top-0 left-0 right-0 z-[100] p-6 flex justify-between items-start pointer-events-none">
                        <button onClick={handleClose} className="p-3 bg-white/90 text-black rounded-full shadow-2xl pointer-events-auto active:scale-90 transition-transform border border-zinc-200">
                            <X size={20}/>
                        </button>

                        <div className="flex flex-col items-end gap-3 pointer-events-auto">
                            <div className="bg-[#8A2BE2] px-5 py-2 rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(138,43,226,0.4)]">
                                <TimerIcon size={18} className="text-white" />
                                <span className="text-xl font-bold text-white font-mono leading-none">{timer}</span>
                            </div>
                            <button onClick={() => setIsPaused(!isPaused)} className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center text-black shadow-2xl active:scale-90 transition-all border border-zinc-200">
                                {isPaused ? <Play size={24} fill="black" className="ml-1"/> : <Pause size={24} fill="black"/>}
                            </button>
                        </div>
                    </div>

                    {isPrep && (
                        <div className="absolute inset-0 z-[200] bg-white/98 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn">
                            <div className="text-[12rem] font-black text-[#8A2BE2] leading-none tabular-nums drop-shadow-[0_0_30px_rgba(138,43,226,0.3)]">
                                {prepTimer}
                            </div>
                            <div className="px-10 py-4 bg-black text-white rounded-3xl font-light uppercase tracking-[0.4em] text-[10px] mt-12 shadow-2xl">
                                {translate('workout.active.next')} : {ex.name}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-40 bg-white p-8 z-[300] relative flex flex-col justify-center border-t border-zinc-100 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-zinc-100">
                        <div className="h-full bg-[#8A2BE2] transition-all duration-1000 ease-linear shadow-[0_0_15px_#8A2BE2]" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between items-center gap-6">
                        <div className="flex-1 overflow-hidden">
                            <span className="text-[10px] font-black text-[#8A2BE2] uppercase tracking-[0.4em]">{idx + 1} / {plan.exercises.length}</span>
                            <h2 className="text-2xl font-black text-black uppercase truncate leading-tight mt-1">{ex.name}</h2>
                        </div>
                        <button onClick={skipExercise} className="bg-black text-white w-16 h-16 rounded-2xl flex items-center justify-center active:scale-90 transition-transform shadow-xl">
                            <ChevronRight size={32} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'finished') return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-black">
            <Activity size={64} className="text-green-400 mb-8 animate-pulse" />
            <h2 className="text-3xl font-light text-white uppercase mb-4 tracking-[0.3em]">{translate('workout.finished.title')}</h2>
            <p className="text-zinc-500 text-[10px] mb-12 uppercase tracking-[0.4em] leading-relaxed max-w-xs mx-auto">{translate('workout.finished.desc')}</p>
            <Button onClick={() => setScreen(Screen.Home)} className="w-full max-w-sm py-6 font-light text-sm tracking-[0.3em] uppercase">{translate('workout.btn.home')}</Button>
        </div>
    );

    return (
        <div className="p-8 animate-fadeIn max-w-lg mx-auto w-full pt-10 pb-44 overflow-y-auto h-full bg-black custom-scrollbar">
            <header className="text-center mb-12">
                <h1 className="text-2xl font-light text-white uppercase tracking-[0.4em]">{translate('workout.setup.title')}</h1>
                <div className="w-16 h-0.5 bg-[#8A2BE2] mx-auto mt-6 rounded-full shadow-[0_0_15px_#8A2BE2]" />
            </header>

            <section className="mb-12">
                <h3 className="text-[10px] font-light text-zinc-500 uppercase tracking-[0.5em] mb-6 px-1">{translate('workout.setup.coach')}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <CoachOption provider="anthropic" label={translate('workout.coach.noemie')} isSelected={selectedCoachPersona === 'anthropic'} onSelect={setSelectedCoachPersona} />
                    <CoachOption provider="gemini" label={translate('workout.coach.abdel')} isSelected={selectedCoachPersona === 'gemini'} onSelect={setSelectedCoachPersona} />
                    <CoachOption provider="openai" label={translate('workout.coach.noor')} isSelected={selectedCoachPersona === 'openai'} onSelect={setSelectedCoachPersona} />
                    <CoachOption provider="perplexity" label={translate('workout.coach.saud')} isSelected={selectedCoachPersona === 'perplexity'} onSelect={setSelectedCoachPersona} />
                </div>
            </section>

            <div className="space-y-12">
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-[1px] flex-1 bg-zinc-800"></div>
                        <h3 className="text-[10px] font-light text-zinc-500 uppercase tracking-[0.5em] px-2">{translate('workout.setup.disciplines')}</h3>
                        <div className="h-[1px] flex-1 bg-zinc-800"></div>
                    </div>
                    
                    <h3 className="text-[9px] font-light text-zinc-600 uppercase tracking-[0.4em] mb-4 px-1">{translate('workout.setup.type')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {['fitness', 'calisthenics', 'powerlifting', 'pilates', 'yoga', 'crossfit'].map(k => (
                            <div key={k} className={`glow-container w-full h-16 ${workoutType === k ? 'active' : ''}`}>
                                <button 
                                    onClick={() => setWorkoutType(k)} 
                                    className="glow-content w-full h-full text-[9px] font-light uppercase tracking-[0.3em] text-white"
                                >
                                    {translate(`workout_type.${k}`)}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] font-light text-zinc-500 uppercase tracking-[0.5em] mb-5 px-1">{translate('workout.setup.intensity')}</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {['low', 'medium', 'high'].map(level => (
                            <div key={level} className={`glow-container w-full h-16 ${intensity === level ? 'active' : ''}`}>
                                <button 
                                    onClick={() => setIntensity(level)} 
                                    className="glow-content w-full h-full text-[9px] font-light uppercase tracking-[0.3em] text-white"
                                >
                                    {translate(`workout.intensity.${level}`)}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] font-light text-zinc-500 uppercase tracking-[0.5em] mb-4 px-1">{translate('workout.setup.requirements')}</h3>
                    <textarea 
                        value={customRequirements}
                        onChange={(e) => setCustomRequirements(e.target.value)}
                        placeholder="..."
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-white text-xs font-light tracking-widest focus:outline-none focus:border-purple-500/50 min-h-[100px] resize-none"
                    />
                </section>

                <div className="pt-8">
                    <Button onClick={handleGenerate} className="w-full py-6 text-sm font-light uppercase tracking-[0.4em] shadow-[0_0_40px_rgba(138,43,226,0.3)]">
                        {translate('workout.btn.generate')}
                    </Button>
                </div>
            </div>
        </div>
    );
};