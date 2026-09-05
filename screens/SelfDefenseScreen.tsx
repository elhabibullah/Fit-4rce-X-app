import React, { useState, useEffect, useMemo, useRef } from 'react';
import Card from '../components/common/Card.tsx';
import { AnyTechnique, Screen } from '../types.ts';
import { useApp } from '../hooks/useApp.ts';
import { 
    ChevronLeft, ChevronRight, Play, Pause, Award, 
    Shield, Wind, Zap, RotateCcw, RotateCw, Maximize2, Minimize2, Sun, Moon,
    CheckCircle2, Sparkles
} from 'lucide-react';
import Button from '../components/common/Button.tsx';
import { HolographicCoach } from '../components/common/HolographicCoach.tsx';
import { SIFU_MODEL_URL } from '../lib/constants.ts';
import { DeviceStatusTrigger } from '../components/common/DeviceStatusTrigger.tsx';

interface TechniqueDetailViewProps {
    technique: AnyTechnique;
    allTechniques?: AnyTechnique[];
    onSelectTechnique?: (t: AnyTechnique) => void;
    onBack: () => void;
}

const TechniqueDetailView: React.FC<TechniqueDetailViewProps> = ({ 
    technique, 
    allTechniques = [], 
    onSelectTechnique, 
    onBack 
}) => {
    const { translate, language } = useApp();
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
            {/* Header: High contrast, top controls with EMS trigger */}
            <header className="p-3 sm:p-4 flex items-center justify-between border-b border-gray-900/80 bg-black/95 backdrop-blur-md z-30 shrink-0">
                <button 
                    onClick={onBack} 
                    className="p-2 text-gray-400 hover:text-white shrink-0 rounded-full hover:bg-white/10 transition-colors"
                    title="Retour"
                >
                    <ChevronLeft size={24} />
                </button>
                
                <div className="flex-1 text-center min-w-0 px-2">
                    <span className="text-[9px] font-black text-[#DAA520] tracking-[0.25em] uppercase block truncate">
                        SIFU ABDELWAHID • ARTS MARTIAUX 3D
                    </span>
                    <h2 className="font-black uppercase tracking-wider text-xs sm:text-sm text-white leading-tight truncate">
                        {technique.name}
                    </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <DeviceStatusTrigger showLabel />
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 text-gray-400 hover:text-[#DAA520] rounded-full hover:bg-white/10 transition-colors"
                        title={isFullscreen ? "Quitter Plein Écran" : "Plein Écran"}
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col ${isFullscreen ? 'p-0 overflow-hidden' : 'p-2 sm:p-4 overflow-y-auto custom-scrollbar'}`}>
                {/* 3D CINEMA PLAYER VIEWPORT: EXPANDED DOMINANT HERO STUDIO */}
                <div className={`w-full relative transition-all duration-300 ${
                    isFullscreen 
                        ? 'flex-1 h-full rounded-none border-none' 
                        : 'h-[62vh] min-h-[440px] sm:h-[70vh] sm:min-h-[520px] rounded-3xl border shadow-2xl overflow-hidden shrink-0'
                } ${studioTheme === 'white' ? 'bg-white border-neutral-300/80 shadow-[0_10px_40px_rgba(0,0,0,0.08)]' : 'bg-black border-[#DAA520]/40 shadow-[0_0_50px_rgba(218,165,32,0.15)]'}`}>
                    
                    {/* 3D Model of Sifu with full viewport space */}
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
                    <div className="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between pointer-events-none">
                        {/* Camera Angle Selector */}
                        <div className={`flex items-center gap-1 p-0.5 rounded-full border pointer-events-auto shadow-lg backdrop-blur-md ${
                            studioTheme === 'white' ? 'bg-white/90 border-neutral-200' : 'bg-black/75 border-white/10'
                        }`}>
                            {(['face', 'profile', 'free'] as const).map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => setCameraPreset(preset)}
                                    className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider transition-all ${
                                        cameraPreset === preset 
                                            ? (studioTheme === 'white' ? 'bg-neutral-900 text-white shadow-sm' : 'bg-[#DAA520] text-black shadow-md') 
                                            : (studioTheme === 'white' ? 'text-neutral-500 hover:text-neutral-900' : 'text-gray-400 hover:text-white')
                                    }`}
                                >
                                    {preset === 'face' ? 'Face' : preset === 'profile' ? 'Profil' : '360°'}
                                </button>
                            ))}
                        </div>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={() => setStudioTheme(prev => prev === 'dark' ? 'white' : 'dark')}
                            className={`px-2.5 py-1 rounded-full border text-[8px] font-bold uppercase tracking-wider flex items-center gap-1.5 pointer-events-auto shadow-lg backdrop-blur-md transition-all ${
                                studioTheme === 'white'
                                    ? 'bg-white/90 border-neutral-200 text-neutral-800 hover:bg-neutral-100 hover:text-purple-700'
                                    : 'bg-black/75 border-white/10 text-white hover:text-[#DAA520]'
                            }`}
                        >
                            {studioTheme === 'white' ? <Moon size={11} className="text-purple-600" /> : <Sun size={11} className="text-[#DAA520]" />}
                            <span>{studioTheme === 'white' ? 'Dojo Noir' : 'Studio Blanc'}</span>
                        </button>
                    </div>

                    {/* DRILL PREP COUNTDOWN OVERLAY */}
                    {isPrep && (
                        <div className={`absolute inset-0 z-[210] flex flex-col items-center justify-center animate-fadeIn pointer-events-none backdrop-blur-md ${
                            studioTheme === 'white' ? 'bg-white/80' : 'bg-black/80'
                        }`}>
                            <h4 className="text-[10px] font-black text-[#DAA520] uppercase tracking-[0.4em] mb-2">SÉQUENCE DE COMBAT</h4>
                            <div className={`text-[7rem] sm:text-[9rem] font-black leading-none drop-shadow-[0_0_35px_#DAA520] ${
                                studioTheme === 'white' ? 'text-neutral-900' : 'text-white'
                            }`}>{countdown}</div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2">Placez-vous en posture</p>
                        </div>
                    )}

                    {/* ULTRA-SLEEK FLOATING MEDIA CONTROLS DOCK (MINIMALIST TO PRESERVE VIEWPORT) */}
                    <div className={`absolute bottom-2.5 left-2.5 right-2.5 z-30 backdrop-blur-xl border rounded-2xl p-2 sm:p-2.5 pointer-events-auto flex flex-col gap-1.5 transition-all ${
                        studioTheme === 'white'
                            ? 'bg-white/90 border-neutral-200/90 text-neutral-900 shadow-[0_8px_30px_rgba(0,0,0,0.12)]'
                            : 'bg-black/80 border-[#DAA520]/30 text-white shadow-[0_8px_35px_rgba(0,0,0,0.85)]'
                    }`}>
                        {/* Timeline Scrubber & Phase Indicator */}
                        <div className="flex flex-col gap-0.5">
                            <div className={`flex items-center justify-between text-[9px] font-mono px-0.5 ${
                                studioTheme === 'white' ? 'text-neutral-500' : 'text-gray-400'
                            }`}>
                                <span className="text-[#DAA520] font-bold uppercase tracking-wider text-[8px] truncate max-w-[65%]">
                                    {phaseDescription}
                                </span>
                                <span className="font-mono text-[8px]">
                                    {(scrubberProgress * 4.0).toFixed(1)}s / 4.0s
                                </span>
                            </div>

                            {/* Range Slider for Frame Scrubbing */}
                            <div className="relative flex items-center w-full">
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
                                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#DAA520] transition-colors ${
                                        studioTheme === 'white' ? 'bg-neutral-200 hover:bg-neutral-300' : 'bg-gray-800 hover:bg-gray-700'
                                    }`}
                                    style={{
                                        background: `linear-gradient(to right, #DAA520 0%, #DAA520 ${scrubberProgress * 100}%, ${studioTheme === 'white' ? '#e2e8f0' : '#333333'} ${scrubberProgress * 100}%, ${studioTheme === 'white' ? '#e2e8f0' : '#333333'} 100%)`
                                    }}
                                    title="Scrubber : glissez pour analyser le mouvement"
                                />
                            </div>
                        </div>

                        {/* Transport Buttons & Speed Selector */}
                        <div className={`flex items-center justify-between gap-1.5 pt-1 border-t ${
                            studioTheme === 'white' ? 'border-neutral-200/80' : 'border-gray-800/80'
                        }`}>
                            {/* Left: Step Frame Controls */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleStep(-0.05)}
                                    className={`p-1.5 rounded-lg border active:scale-95 transition-all text-[8px] font-bold flex items-center gap-1 ${
                                        studioTheme === 'white' 
                                            ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200' 
                                            : 'bg-gray-900/90 text-gray-300 hover:text-white hover:bg-gray-800 border-gray-800'
                                    }`}
                                    title="Reculer d'une frame (-0.2s)"
                                >
                                    <RotateCcw size={12} />
                                    <span className="hidden sm:inline">-0.2s</span>
                                </button>
                                <button
                                    onClick={() => handleStep(0.05)}
                                    className={`p-1.5 rounded-lg border active:scale-95 transition-all text-[8px] font-bold flex items-center gap-1 ${
                                        studioTheme === 'white' 
                                            ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200' 
                                            : 'bg-gray-900/90 text-gray-300 hover:text-white hover:bg-gray-800 border-gray-800'
                                    }`}
                                    title="Avancer d'une frame (+0.2s)"
                                >
                                    <RotateCw size={12} />
                                    <span className="hidden sm:inline">+0.2s</span>
                                </button>
                            </div>

                            {/* Center: Main Play / Pause Button */}
                            <button
                                onClick={() => {
                                    setIsPaused(!isPaused);
                                    setIsScrubbing(false);
                                }}
                                className="px-4 py-1.5 rounded-full bg-[#DAA520] hover:bg-[#c5961d] text-black font-black uppercase text-[11px] tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(218,165,32,0.4)] active:scale-95 transition-all"
                                title={isPaused ? "Lecture" : "Pause"}
                            >
                                {isPaused ? (
                                    <>
                                        <Play size={13} fill="black" />
                                        <span>Lecture</span>
                                    </>
                                ) : (
                                    <>
                                        <Pause size={13} fill="black" />
                                        <span>Pause</span>
                                    </>
                                )}
                            </button>

                            {/* Right: Speed Pills */}
                            <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border ${
                                studioTheme === 'white' ? 'bg-neutral-100 border-neutral-200' : 'bg-gray-900/90 border-gray-800'
                            }`}>
                                {[0.5, 1.0, 1.5].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setSpeed(s)}
                                        className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all ${
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

                {/* DETAILS BELOW PLAYER (COMPACT & UNCLUTTERED SO SIFU DOMINATES) */}
                {!isFullscreen && (
                    <div className="flex-1 mt-3 space-y-3">
                        {/* SLEEK HORIZONTAL TECHNIQUE SWITCHER BAR */}
                        {allTechniques.length > 1 && (
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block px-1">
                                    MOUVEMENTS DE CE NIVEAU ({allTechniques.length})
                                </span>
                                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                                    {allTechniques.map((tech, idx) => {
                                        const isCurrent = tech.id === technique.id;
                                        return (
                                            <button
                                                key={tech.id}
                                                onClick={() => onSelectTechnique?.(tech)}
                                                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 shrink-0 ${
                                                    isCurrent
                                                        ? 'bg-[#DAA520] text-black border-[#DAA520] shadow-[0_0_12px_rgba(218,165,32,0.4)]'
                                                        : 'bg-zinc-900/70 text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
                                                }`}
                                            >
                                                <span className="font-mono text-[9px] opacity-75">{idx + 1}.</span>
                                                <span className="truncate max-w-[150px]">{tech.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Mode Selector Tabs */}
                        <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-900">
                            <button 
                                onClick={() => { setMode('learn'); setIsPrep(false); }} 
                                className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${
                                    mode === 'learn' ? 'bg-[#DAA520] text-black shadow-md' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                ANALYSE BIOMÉCANIQUE
                            </button>
                            <button 
                                onClick={() => { setMode('train'); setIsPrep(true); }} 
                                className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${
                                    mode === 'train' ? 'bg-[#DAA520] text-black shadow-md' : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                DÉMARRER ENTRAÎNEMENT
                            </button>
                        </div>

                        {/* Compact Technical Guidance Card */}
                        <div className="bg-zinc-950/80 border border-[#DAA520]/20 rounded-xl p-3.5 space-y-2">
                            <div className="flex items-center gap-1.5">
                                <Shield size={13} className="text-[#DAA520]" />
                                <h3 className="text-[9px] font-black text-[#DAA520] uppercase tracking-widest">Guide Posture Sifu</h3>
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed font-normal">{technique.description}</p>
                            
                            <div className="pt-2 border-t border-gray-900 flex items-start gap-1.5">
                                <Zap size={12} className="text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">{technique.application}</p>
                            </div>
                        </div>

                        {/* Start Training Button */}
                        <div className="pb-8">
                            <Button 
                                onClick={() => {
                                    setIsPrep(true);
                                    setCountdown(10);
                                }} 
                                className="w-full py-3 bg-[#DAA520] hover:bg-[#c5961d] border-[#DAA520] text-black font-black uppercase text-xs tracking-[0.15em] shadow-[0_0_20px_rgba(218,165,32,0.3)] active:scale-95 transition-all"
                            >
                                LANCER LE DRILL SIFU (10s D'INSTALLATION)
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
        <div className="animate-fadeIn bg-black text-white min-h-screen p-4 sm:p-6 pb-32 max-w-2xl mx-auto w-full font-['Poppins']">
            {selectedTech && (
                <TechniqueDetailView 
                    technique={selectedTech} 
                    allTechniques={currentLevel?.techniques || []}
                    onSelectTechnique={setSelectedTech}
                    onBack={() => setSelectedTech(null)} 
                />
            )}
            
            {/* Header: Back button + Title + EMS trigger */}
            <header className="flex items-center justify-between mb-6">
                <button onClick={() => setScreen(Screen.Home)} className="p-2 -ml-2 text-gray-500 hover:text-white transition-colors">
                    <ChevronLeft size={28} />
                </button>
                <div className="text-center">
                    <h1 className="font-black uppercase tracking-[0.25em] text-base sm:text-lg text-white">{translate('nav.defense')}</h1>
                    <p className="text-[9px] text-[#DAA520] font-bold uppercase tracking-[0.2em] mt-0.5">Dojo Studio Sifu Abdelwahid</p>
                </div>
                <DeviceStatusTrigger showLabel />
            </header>

            {/* HERO SIFU STUDIO BANNER */}
            <div className="relative rounded-3xl overflow-hidden border border-[#DAA520]/30 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-5 mb-6 shadow-[0_0_40px_rgba(218,165,32,0.12)]">
                <div className="flex items-center justify-between">
                    <div className="max-w-[70%]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DAA520]/20 text-[#DAA520] border border-[#DAA520]/40 text-[8px] font-black uppercase tracking-widest mb-2">
                            <Sparkles size={10} /> STUDIO 3D HOLOGRAPHIQUE
                        </span>
                        <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-tight">
                            Maîtrise Martiale en Direct
                        </h2>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                            Visualisez chaque mouvement avec Sifu Abdelwahid à 360°, ralenti biomécanique et repères de frappe.
                        </p>
                    </div>

                    {currentLevel?.techniques[0] && (
                        <button
                            onClick={() => setSelectedTech(currentLevel.techniques[0])}
                            className="p-3.5 rounded-2xl bg-[#DAA520] text-black hover:bg-[#c5961d] shadow-[0_0_20px_rgba(218,165,32,0.4)] active:scale-95 transition-all flex flex-col items-center justify-center shrink-0"
                            title="Lancer le studio 3D"
                        >
                            <Play size={20} fill="black" />
                            <span className="text-[8px] font-black uppercase tracking-wider mt-1">Dojo 3D</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Discipline Selector Tabs */}
            <div className="flex bg-gray-950 p-1 rounded-2xl border border-gray-900 mb-6">
                {[
                    { id: 'kung-fu', icon: Shield, label: 'KUNG-FU TRADITIONNEL' },
                    { id: 'tai-chi', icon: Wind, label: 'NEO TAI-CHI CHUAN' }
                ].map((d) => (
                    <button
                        key={d.id}
                        onClick={() => setSelectedProgram(d.id as Discipline)}
                        className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                            selectedProgram === d.id 
                                ? 'bg-[#DAA520] text-black font-black shadow-lg' 
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        <d.icon size={16} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{d.label}</span>
                    </button>
                ))}
            </div>

            <div className="mb-3">
                 <h2 className="font-black uppercase tracking-[0.1em] text-lg text-white">{programData.name}</h2>
            </div>

            {/* Level Selector */}
            <div className="flex gap-2 mb-6 overflow-x-auto custom-scrollbar pb-1">
                {programData.levels.map((lvl, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setSelectedLevelIdx(idx)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                            selectedLevelIdx === idx 
                                ? 'bg-[#DAA520] text-black border-[#DAA520] shadow-[0_0_15px_rgba(218,165,32,0.3)]' 
                                : 'bg-zinc-950 text-gray-500 border-zinc-900 hover:border-gray-700'
                        }`}
                    >
                        {lvl.level_name}
                    </button>
                ))}
            </div>

            <section className="mb-8">
                <div className="bg-[#DAA520]/5 border border-[#DAA520]/20 p-4 rounded-2xl mb-5">
                    <p className="text-gray-300 text-xs leading-relaxed italic">{currentLevel?.description}</p>
                </div>

                {/* SLEEK, COMPACT TECHNIQUE CARDS (REPLACING OVERSIZED CLUNKY BUTTONS) */}
                <div className="space-y-2.5">
                    {currentLevel?.techniques.map((tech, idx) => (
                        <button
                            key={tech.id}
                            onClick={() => setSelectedTech(tech)}
                            className="w-full bg-zinc-950/90 border border-zinc-900 hover:border-[#DAA520]/50 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between group transition-all duration-200 active:scale-[0.98] hover:bg-zinc-900/60 shadow-sm text-left"
                        >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                                <div className="w-8 h-8 rounded-xl bg-[#DAA520]/10 border border-[#DAA520]/30 flex items-center justify-center text-[#DAA520] font-mono font-bold text-xs shrink-0 group-hover:bg-[#DAA520] group-hover:text-black transition-colors">
                                    {idx + 1}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-white font-black uppercase tracking-wider text-xs sm:text-sm truncate group-hover:text-[#DAA520] transition-colors">
                                        {tech.name}
                                    </h3>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5 tracking-wider truncate">
                                        {tech.application}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[8px] font-bold text-[#DAA520] uppercase tracking-widest hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                                    Voir Studio 3D
                                </span>
                                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-400 group-hover:text-white group-hover:border-[#DAA520]/60 transition-colors">
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            <section className="pt-4 border-t border-gray-900">
                <div className="flex items-center gap-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-900">
                    <div className="w-10 h-10 rounded-full bg-[#DAA520]/10 flex items-center justify-center border border-[#DAA520]/30 shrink-0">
                        <Award className="text-[#DAA520] w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Progression Martiale</h4>
                        <p className="text-[9px] text-gray-500 uppercase font-bold mt-0.5">
                            Niveau {selectedLevelIdx + 1} // Sifu Abdelwahid Dojo // EMS Synchronisé
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SelfDefenseScreen;