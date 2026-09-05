import React, { useState, useEffect, useMemo, useRef } from 'react';
import Card from '../components/common/Card.tsx';
import { AnyTechnique, Screen } from '../types.ts';
import { useApp } from '../hooks/useApp.ts';
import { 
    ChevronLeft, ChevronRight, Lock, Play, Pause, AlertTriangle, X, Award, 
    Shield, Wind, Zap, RotateCcw, RotateCw, Maximize2, Minimize2, Eye, Camera, Sun, Moon 
} from 'lucide-react';
import Button from '../components/common/Button.tsx';
import { HolographicCoach } from '../components/common/HolographicCoach.tsx';
import { SIFU_MODEL_URL } from '../lib/constants.ts';

const TechniqueDetailView: React.FC<{ technique: AnyTechnique; onBack: () => void; }> = ({ technique, onBack }) => {
    const { translate } = useApp();
    const [mode, setMode] = useState<'learn' | 'train'>('learn');
    const [countdown, setCountdown] = useState(10);
    const [isPrep, setIsPrep] = useState(false);

    // Full Player State
    const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState<number>(1.0);
    const [scrubberProgress, setScrubberProgress] = useState<number>(0);
    const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
    const [cameraPreset, setCameraPreset] = useState<'face' | 'profile' | 'free'>('face');
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [studioTheme, setStudioTheme] = useState<'dark' | 'white'>('white');

    // Continuous timeline progress tracking when playing
    useEffect(() => {
        if (isPaused || isPrep || isScrubbing) return;
        const cycleDurationMs = 4000 / speed;
        let lastTime = performance.now();
        let frameId: number;

        const loop = (now: number) => {
            const elapsed = now - lastTime;
            lastTime = now;
            setScrubberProgress(prev => (prev + (elapsed / cycleDurationMs)) % 1);
            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [isPaused, isPrep, isScrubbing, speed]);

    // Countdown for drill training mode
    useEffect(() => {
        let timer: number;
        if (isPrep && countdown > 0) {
            timer = window.setTimeout(() => setCountdown(c => {
                if (c <= 1) {
                    setIsPrep(false);
                    return 10;
                }
                return c - 1;
            }), 1000);
        }
        return () => clearTimeout(timer);
    }, [isPrep, countdown]);

    const handleStep = (delta: number) => {
        setIsPaused(true);
        setIsScrubbing(false);
        setScrubberProgress(prev => {
            let next = prev + delta;
            if (next < 0) next = 0;
            if (next > 1) next = 1;
            return next;
        });
    };

    const phaseDescription = useMemo(() => {
        if (scrubberProgress < 0.22) return "Phase 1 : Enracinement & Garde";
        if (scrubberProgress < 0.55) return "Phase 2 : Déploiement de Puissance";
        if (scrubberProgress < 0.80) return "Phase 3 : Point d'Impact & Alignement";
        return "Phase 4 : Rapatriement & Équilibre";
    }, [scrubberProgress]);

    const effectiveModelUrl = technique.modelUrl || SIFU_MODEL_URL;

    return (
        <div className="fixed inset-0 z-[200] bg-black text-white flex flex-col font-['Poppins'] select-none">
            {/* Header: Clean, high contrast, uncluttered */}
            <header className="p-3 sm:p-5 flex items-center justify-between border-b border-gray-900/60 bg-black/90 backdrop-blur-md z-30 shrink-0">
                <button 
                    onClick={onBack} 
                    className="p-2 text-gray-400 hover:text-white shrink-0 rounded-full hover:bg-white/10 transition-colors"
                    title="Retour"
                >
                    <ChevronLeft size={26} />
                </button>
                <div className="flex-1 text-center min-w-0 px-3">
                    <span className="text-[10px] font-black text-[#DAA520] tracking-[0.3em] uppercase block">
                        SIFU ABDELWAHID • ARTS MARTIAUX
                    </span>
                    <h2 className="font-black uppercase tracking-wider text-xs sm:text-base text-white leading-tight truncate">
                        {technique.name}
                    </h2>
                </div>
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 text-gray-400 hover:text-[#DAA520] shrink-0 rounded-full hover:bg-white/10 transition-colors"
                    title={isFullscreen ? "Quitter Plein Écran" : "Plein Écran"}
                >
                    {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
                </button>
            </header>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col ${isFullscreen ? 'p-0 overflow-hidden' : 'p-3 sm:p-6 overflow-y-auto custom-scrollbar'}`}>
                {/* 3D CINEMA PLAYER VIEWPORT: Expanded height, uncluttered, true player */}
                <div className={`w-full relative transition-all duration-300 ${
                    isFullscreen 
                        ? 'flex-1 h-full rounded-none border-none' 
                        : 'h-[50vh] min-h-[380px] sm:h-[58vh] sm:min-h-[460px] rounded-3xl border shadow-xl overflow-hidden shrink-0'
                } ${studioTheme === 'white' ? 'bg-white border-neutral-300/80 shadow-[0_10px_40px_rgba(0,0,0,0.08)]' : 'bg-black border-[#DAA520]/40 shadow-[0_0_50px_rgba(218,165,32,0.15)]'}`}>
                    
                    {/* 3D Model with zero text overlaying Sifu */}
                    <HolographicCoach 
                        modelUrl={effectiveModelUrl} 
                        exerciseName={technique.name} 
                        isPaused={isPaused || isScrubbing} 
                        isPrep={isPrep}
                        speed={speed}
                        timelineProgress={isPaused || isScrubbing ? scrubberProgress : undefined}
                        cameraPreset={cameraPreset}
                        studioTheme={studioTheme}
                        onToggleStudioTheme={setStudioTheme}
                        hideBadge={true}
                        hideThemeToggle={true}
                    />

                    {/* TOP PLAYER HUD: Camera Angles & Studio Mode */}
                    <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
                        {/* Camera Angle Selector */}
                        <div className={`flex items-center gap-1 p-1 rounded-full border pointer-events-auto shadow-lg backdrop-blur-md ${
                            studioTheme === 'white' ? 'bg-white/90 border-neutral-200' : 'bg-black/75 border-white/10'
                        }`}>
                            <button
                                onClick={() => setCameraPreset('face')}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                                    cameraPreset === 'face' 
                                        ? (studioTheme === 'white' ? 'bg-neutral-900 text-white shadow-sm' : 'bg-[#DAA520] text-black shadow-md') 
                                        : (studioTheme === 'white' ? 'text-neutral-500 hover:text-neutral-900' : 'text-gray-400 hover:text-white')
                                }`}
                            >
                                Face
                            </button>
                            <button
                                onClick={() => setCameraPreset('profile')}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                                    cameraPreset === 'profile' 
                                        ? (studioTheme === 'white' ? 'bg-neutral-900 text-white shadow-sm' : 'bg-[#DAA520] text-black shadow-md') 
                                        : (studioTheme === 'white' ? 'text-neutral-500 hover:text-neutral-900' : 'text-gray-400 hover:text-white')
                                }`}
                            >
                                Profil
                            </button>
                            <button
                                onClick={() => setCameraPreset('free')}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                                    cameraPreset === 'free' 
                                        ? (studioTheme === 'white' ? 'bg-neutral-900 text-white shadow-sm' : 'bg-[#DAA520] text-black shadow-md') 
                                        : (studioTheme === 'white' ? 'text-neutral-500 hover:text-neutral-900' : 'text-gray-400 hover:text-white')
                                }`}
                            >
                                360° Libre
                            </button>
                        </div>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={() => setStudioTheme(prev => prev === 'dark' ? 'white' : 'dark')}
                            className={`px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 pointer-events-auto shadow-lg backdrop-blur-md transition-all ${
                                studioTheme === 'white'
                                    ? 'bg-white/90 border-neutral-200 text-neutral-800 hover:bg-neutral-100 hover:text-purple-700'
                                    : 'bg-black/75 border-white/10 text-white hover:text-[#DAA520]'
                            }`}
                        >
                            {studioTheme === 'white' ? <Moon size={12} className="text-purple-600" /> : <Sun size={12} className="text-[#DAA520]" />}
                            <span>{studioTheme === 'white' ? 'Dojo Noir' : 'Studio Blanc'}</span>
                        </button>
                    </div>

                    {/* DRILL PREP COUNTDOWN OVERLAY */}
                    {isPrep && (
                        <div className={`absolute inset-0 z-[210] flex flex-col items-center justify-center animate-fadeIn pointer-events-none backdrop-blur-md ${
                            studioTheme === 'white' ? 'bg-white/75' : 'bg-black/75'
                        }`}>
                            <h4 className="text-[11px] font-black text-[#DAA520] uppercase tracking-[0.4em] mb-3">SÉQUENCE DE COMBAT</h4>
                            <div className={`text-[8rem] sm:text-[10rem] font-black leading-none drop-shadow-[0_0_35px_#DAA520] ${
                                studioTheme === 'white' ? 'text-neutral-900' : 'text-white'
                            }`}>{countdown}</div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-4">Placez-vous en posture</p>
                        </div>
                    )}

                    {/* FLOATING MEDIA PLAYER CONTROLS (BOTTOM DOCK) */}
                    <div className={`absolute bottom-3 left-3 right-3 z-30 backdrop-blur-xl border rounded-2xl p-3 sm:p-4 pointer-events-auto flex flex-col gap-2.5 transition-all ${
                        studioTheme === 'white'
                            ? 'bg-white/95 border-neutral-200/90 text-neutral-900 shadow-[0_10px_35px_rgba(0,0,0,0.12)]'
                            : 'bg-black/85 border-[#DAA520]/30 text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)]'
                    }`}>
                        {/* Timeline Scrubber & Phase Indicator */}
                        <div className="flex flex-col gap-1">
                            <div className={`flex items-center justify-between text-[10px] font-mono ${
                                studioTheme === 'white' ? 'text-neutral-500' : 'text-gray-400'
                            }`}>
                                <span className="text-[#DAA520] font-bold font-sans uppercase tracking-wider text-[9px]">
                                    {phaseDescription}
                                </span>
                                <span>
                                    {(scrubberProgress * 4.0).toFixed(1)}s / 4.0s
                                </span>
                            </div>

                            {/* Range Slider for Frame Scrubbing */}
                            <div className="relative flex items-center w-full group">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.005"
                                    value={scrubberProgress}
                                    onMouseDown={() => setIsScrubbing(true)}
                                    onTouchStart={() => setIsScrubbing(true)}
                                    onChange={(e) => {
                                        setIsPaused(true);
                                        setScrubberProgress(parseFloat(e.target.value));
                                    }}
                                    onMouseUp={() => setIsScrubbing(false)}
                                    onTouchEnd={() => setIsScrubbing(false)}
                                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#DAA520] transition-colors ${
                                        studioTheme === 'white' ? 'bg-neutral-200 hover:bg-neutral-300' : 'bg-gray-800 hover:bg-gray-700'
                                    }`}
                                    style={{
                                        background: `linear-gradient(to right, #DAA520 0%, #DAA520 ${scrubberProgress * 100}%, ${studioTheme === 'white' ? '#e2e8f0' : '#333333'} ${scrubberProgress * 100}%, ${studioTheme === 'white' ? '#e2e8f0' : '#333333'} 100%)`
                                    }}
                                    title="Scrubber de mouvement : glissez pour analyser le mouvement image par image"
                                />
                            </div>
                        </div>

                        {/* Transport Buttons & Speed Selector */}
                        <div className={`flex items-center justify-between gap-2 pt-1 border-t ${
                            studioTheme === 'white' ? 'border-neutral-200/80' : 'border-gray-800/80'
                        }`}>
                            {/* Left: Step Frame Controls */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handleStep(-0.05)}
                                    className={`p-2 rounded-xl border active:scale-95 transition-all text-[9px] font-bold flex items-center gap-1 ${
                                        studioTheme === 'white' 
                                            ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200' 
                                            : 'bg-gray-900/90 text-gray-300 hover:text-white hover:bg-gray-800 border-gray-800'
                                    }`}
                                    title="Reculer d'une frame (-0.2s)"
                                >
                                    <RotateCcw size={14} />
                                    <span className="hidden sm:inline">-0.2s</span>
                                </button>
                                <button
                                    onClick={() => handleStep(0.05)}
                                    className={`p-2 rounded-xl border active:scale-95 transition-all text-[9px] font-bold flex items-center gap-1 ${
                                        studioTheme === 'white' 
                                            ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200' 
                                            : 'bg-gray-900/90 text-gray-300 hover:text-white hover:bg-gray-800 border-gray-800'
                                    }`}
                                    title="Avancer d'une frame (+0.2s)"
                                >
                                    <RotateCw size={14} />
                                    <span className="hidden sm:inline">+0.2s</span>
                                </button>
                            </div>

                            {/* Center: Main Play / Pause Button */}
                            <button
                                onClick={() => {
                                    setIsPaused(!isPaused);
                                    setIsScrubbing(false);
                                }}
                                className="px-5 py-2.5 rounded-full bg-[#DAA520] hover:bg-[#c5961d] text-black font-black uppercase text-xs tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(218,165,32,0.4)] active:scale-95 transition-all"
                                title={isPaused ? "Lecture" : "Pause"}
                            >
                                {isPaused ? (
                                    <>
                                        <Play size={16} fill="black" />
                                        <span>Lecture</span>
                                    </>
                                ) : (
                                    <>
                                        <Pause size={16} fill="black" />
                                        <span>Pause</span>
                                    </>
                                )}
                            </button>

                            {/* Right: Speed Pills */}
                            <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                                studioTheme === 'white' ? 'bg-neutral-100 border-neutral-200' : 'bg-gray-900/90 border-gray-800'
                            }`}>
                                {[0.25, 0.5, 1.0, 1.5].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setSpeed(s)}
                                        className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all ${
                                            speed === s 
                                                ? (studioTheme === 'white' ? 'bg-neutral-900 text-white shadow-sm' : 'bg-[#DAA520] text-black font-bold shadow-sm')
                                                : (studioTheme === 'white' ? 'text-neutral-500 hover:text-neutral-900' : 'text-gray-400 hover:text-white')
                                        }`}
                                        title={`Vitesse ${s}x`}
                                    >
                                        {s}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* DETAILS BELOW PLAYER (Visible when not in fullscreen mode) */}
                {!isFullscreen && (
                    <div className="flex-1 mt-6 space-y-6">
                        {/* Mode Selector Tabs */}
                        <div className="flex bg-gray-900 p-1 rounded-2xl border border-gray-800">
                            <button 
                                onClick={() => { setMode('learn'); setIsPrep(false); }} 
                                className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${
                                    mode === 'learn' ? 'bg-[#DAA520] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                ANALYSE BIOMÉCANIQUE
                            </button>
                            <button 
                                onClick={() => { setMode('train'); setIsPrep(true); }} 
                                className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${
                                    mode === 'train' ? 'bg-[#DAA520] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                MODE ENTRAÎNEMENT
                            </button>
                        </div>

                        {/* Technical Guidance */}
                        <Card className="border-[#DAA520]/20 bg-gray-950/60 p-5 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield size={16} className="text-[#DAA520]" />
                                <h3 className="text-[10px] font-black text-[#DAA520] uppercase tracking-widest">Guide Technique Sifu</h3>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed font-normal">{technique.description}</p>
                        </Card>

                        {/* Practical Combat Application */}
                        <Card className="border-gray-800 bg-black/40 p-5 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap size={16} className="text-amber-400" />
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Application Martiale</h3>
                            </div>
                            <p className="text-xs text-gray-300 font-bold uppercase tracking-wider">{technique.application}</p>
                        </Card>

                        {/* Start Training Button */}
                        <div className="pb-10">
                            <Button 
                                onClick={() => {
                                    setIsPrep(true);
                                    setCountdown(10);
                                }} 
                                className="w-full py-4 bg-[#DAA520] hover:bg-[#c5961d] border-[#DAA520] text-black font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(218,165,32,0.3)] active:scale-95 transition-all"
                            >
                                DÉMARRER LA SÉQUENCE DE COMBAT
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

type Discipline = 'kung-fu' | 'tai-chi';

export const SelfDefenseScreen: React.FC = () => {
    const { setScreen, constants, translate } = useApp();
    const [selectedTech, setSelectedTech] = useState<AnyTechnique | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<Discipline>('kung-fu');
    const [selectedLevelIdx, setSelectedLevelIdx] = useState(0);

    const programData = useMemo(() => {
        switch(selectedProgram) {
            case 'tai-chi': 
                const ntc = constants.NEO_TAI_CHI_PROGRAM;
                return {
                    name: ntc.program_name,
                    intro: ntc.description,
                    levels: ntc.levels.map(l => ({
                        level_name: l.title,
                        description: l.objective,
                        techniques: l.techniques
                    }))
                };
            case 'kung-fu':
            default:
                const kf = constants.KUNG_FU_PROGRAM;
                return {
                    name: kf.program_name,
                    intro: kf.description,
                    levels: kf.levels.map(l => ({
                        level_name: l.level_name,
                        description: l.description,
                        techniques: l.sections[0].movements
                    }))
                };
        }
    }, [selectedProgram, constants]);

    // Reset level index when changing programs
    useEffect(() => {
        setSelectedLevelIdx(0);
    }, [selectedProgram]);

    const currentLevel = programData.levels[selectedLevelIdx];

    return (
        <div className="animate-fadeIn bg-black text-white min-h-screen p-6 pb-32 max-w-2xl mx-auto w-full font-['Poppins']">
            {selectedTech && <TechniqueDetailView technique={selectedTech} onBack={() => setSelectedTech(null)} />}
            
            <header className="flex items-center mb-8">
                <button onClick={() => setScreen(Screen.Home)} className="p-2 -ml-2 text-gray-500 hover:text-white"><ChevronLeft size={32} /></button>
                <div className="flex-1 text-center">
                    <h1 className="font-black uppercase tracking-[0.3em] text-lg text-white">{translate('nav.defense')}</h1>
                    <p className="text-[9px] text-[#DAA520] font-bold uppercase tracking-[0.2em] mt-1">Combat Defense Ecosystem</p>
                </div>
            </header>

            {/* Discipline Selector Tabs */}
            <div className="flex bg-gray-900/50 p-1 rounded-2xl border border-gray-800 mb-8">
                {[
                    { id: 'kung-fu', icon: Shield, label: 'KUNG-FU' },
                    { id: 'tai-chi', icon: Wind, label: 'TAI-CHI' }
                ].map((d) => (
                    <button
                        key={d.id}
                        onClick={() => setSelectedProgram(d.id as Discipline)}
                        className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${selectedProgram === d.id ? 'bg-[#DAA520] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <d.icon size={18} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{d.label}</span>
                    </button>
                ))}
            </div>

            <div className="mb-4">
                 <h2 className="font-black uppercase tracking-[0.1em] text-xl text-white">{programData.name}</h2>
            </div>

            {/* Level Selector */}
            <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
                {programData.levels.map((lvl, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setSelectedLevelIdx(idx)}
                        className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${selectedLevelIdx === idx ? 'bg-[#DAA520] text-black border-[#DAA520] shadow-[0_0_15px_rgba(218,165,32,0.4)]' : 'bg-gray-950 text-gray-600 border-gray-800'}`}
                    >
                        {lvl.level_name}
                    </button>
                ))}
            </div>

            <section className="mb-10">
                <div className="bg-[#DAA520]/5 border border-[#DAA520]/20 p-5 rounded-2xl mb-8">
                    <p className="text-gray-300 text-sm leading-relaxed italic">{currentLevel?.description}</p>
                </div>

                <div className="space-y-4">
                    {currentLevel?.techniques.map((tech) => (
                        <div key={tech.id} className="glow-container h-24 !bg-zinc-900/50 !border-[#DAA520]/20">
                            <button onClick={() => setSelectedTech(tech)} className="glow-content !bg-transparent w-full h-full p-6 flex justify-between items-center group">
                                <div className="text-left overflow-hidden">
                                    <h3 className="text-white font-black uppercase tracking-widest text-sm truncate">{tech.name}</h3>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 tracking-widest truncate">{tech.application}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <ChevronRight className="text-gray-700 group-hover:text-[#DAA520] transition-colors" />
                                </div>
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="pt-6 border-t border-gray-800">
                <div className="flex items-center gap-4 bg-gray-900/40 p-6 rounded-3xl border border-gray-800">
                    <div className="w-12 h-12 rounded-full bg-[#DAA520]/10 flex items-center justify-center border border-[#DAA520]/30">
                        <Award className="text-[#DAA520] w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Discipline Mastery</h4>
                        <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Level {selectedLevelIdx + 1} // Biometric Tracking Active</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SelfDefenseScreen;