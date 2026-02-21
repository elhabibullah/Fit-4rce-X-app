import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/common/Card.tsx';
import { AnyTechnique, Screen } from '../types.ts';
import { useApp } from '../hooks/useApp.ts';
import { ChevronLeft, ChevronRight, Lock, Play, Pause, AlertTriangle, X, Award, Shield, Wind, Zap } from 'lucide-react';
import Button from '../components/common/Button.tsx';
import { HolographicCoach } from '../components/common/HolographicCoach.tsx';

const TechniqueDetailView: React.FC<{ technique: AnyTechnique; onBack: () => void; }> = ({ technique, onBack }) => {
    const { translate } = useApp();
    const [mode, setMode] = useState<'learn' | 'train'>('learn');
    const [countdown, setCountdown] = useState(10);
    const [isPrep, setIsPrep] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

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

    return (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fadeIn font-['Poppins']">
            <header className="p-6 flex items-center border-b border-gray-900 bg-black z-30">
                <button onClick={onBack} className="p-2 text-gray-400 hover:text-white"><ChevronLeft size={32} /></button>
                <h2 className="flex-1 text-center font-black uppercase tracking-widest text-xs">{technique.name}</h2>
                <div className="w-10" />
            </header>

            <div className="flex-1 p-6 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="h-64 w-full rounded-3xl border border-[#DAA520]/40 overflow-hidden bg-black relative shadow-[0_0_40px_rgba(218,165,32,0.1)] shrink-0">
                    <HolographicCoach modelUrl={technique.modelUrl} isPaused={isPaused || isPrep} />
                    
                    {isPrep && (
                        <div className="absolute inset-0 z-[210] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn">
                            <h4 className="text-[10px] font-black text-[#DAA520] uppercase tracking-[0.4em] mb-4">COMBAT READY</h4>
                            <div className="text-[8rem] font-black text-white drop-shadow-[0_0_30px_#DAA520]">{countdown}</div>
                        </div>
                    )}
                </div>

                <div className="flex-1 mt-8 space-y-6">
                    <div className="flex bg-gray-900 p-1 rounded-xl">
                        <button onClick={() => { setMode('learn'); setIsPrep(false); }} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${mode === 'learn' ? 'bg-[#DAA520] text-black shadow-lg' : 'text-gray-500'}`}>ANALYSIS</button>
                        <button onClick={() => { setMode('train'); setIsPrep(true); }} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-lg transition-all ${mode === 'train' ? 'bg-[#DAA520] text-black shadow-lg' : 'text-gray-500'}`}>DRILL MODE</button>
                    </div>

                    <Card className="border-[#DAA520]/20 bg-gray-950/40">
                        <h3 className="text-[10px] font-black text-[#DAA520] uppercase tracking-widest mb-2">Technical Guidance</h3>
                        <p className="text-sm text-gray-300 leading-relaxed font-normal">{technique.description}</p>
                    </Card>

                    <Card className="border-gray-800 bg-black/40">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Application</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{technique.application}</p>
                    </Card>
                    
                    <div className="pb-10">
                        <Button onClick={() => setIsPrep(true)} className="w-full py-4 bg-[#DAA520] border-[#DAA520] text-black font-black uppercase tracking-[0.2em]">
                            START TRAINING SEQUENCE
                        </Button>
                    </div>
                </div>
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
        <div className="animate-fadeIn p-6 pb-32 max-w-2xl mx-auto w-full font-['Poppins']">
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