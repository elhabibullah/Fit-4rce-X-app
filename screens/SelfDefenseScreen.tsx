
import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card.tsx';
import { AnyTechnique, Screen } from '../types.ts';
import { useApp } from '../hooks/useApp.ts';
import { ChevronLeft, ChevronRight, Lock, Play, Pause, RotateCw, Shield, AlertTriangle, CheckCircle, Zap, Clock, Target } from 'lucide-react';
import Button from '../components/common/Button.tsx';
import { HolographicCoach } from '../components/common/HolographicCoach.tsx';
import { TECHNIQUE_MODEL_URL } from '../constants.ts';

// --- Background Assets ---
export const DISCIPLINE_BACKGROUNDS: Record<string, string> = {
    'kung_fu': 'https://www.dropbox.com/scl/fi/4j2bm515kj72ue8z09j67/ancient-undergound-shaolin-temple.jpeg?rlkey=jxqentdovc749tfc7kurk711m&st=600edn5r&raw=1',
    'jujutsu': 'https://www.dropbox.com/scl/fi/dbkm8bxyia3nszql0mvn7/japanese-dojo-interior.jpeg?rlkey=svzvdmm55ldtykpg676qm5ewp&st=furarzoy&raw=1', 
    'karate': 'https://www.dropbox.com/scl/fi/dbkm8bxyia3nszql0mvn7/japanese-dojo-interior.jpeg?rlkey=svzvdmm55ldtykpg676qm5ewp&st=furarzoy&raw=1',
    'tai_chi': 'https://www.dropbox.com/scl/fi/tavdk7ba2n1gar7zdvp5h/tai-Chi-park.png?rlkey=y1zr55cf2rz6pcmg8dc7cwr1h&st=aes6ztua&raw=1',
    'wrestling': 'https://www.dropbox.com/scl/fi/1fin923o2q0mohjm645nr/underground-fight-club-arena-empty-octagon-mat.jpeg?rlkey=pns79snsic95izwtfy0eo112c&st=61uq5eyr&raw=1',
    'default': 'https://www.dropbox.com/scl/fi/dbkm8bxyia3nszql0mvn7/japanese-dojo-interior.jpeg?rlkey=svzvdmm55ldtykpg676qm5ewp&st=furarzoy&raw=1'
};

type Mode = 'learn' | 'application' | 'coaching' | 'train';

type View = 
    | 'main'
    | 'kungfu_intro' | 'kungfu_levels' | 'kungfu_sections' | 'kungfu_movements'
    | 'jujutsu_intro' | 'jujutsu_modules' | 'jujutsu_techniques'
    | 'tai_chi_intro' | 'tai_chi_levels' | 'tai_chi_techniques'
    | 'karate_intro' | 'karate_levels' | 'karate_modules' | 'karate_lessons'
    | 'wrestling_intro' | 'wrestling_levels' | 'wrestling_movements';

// --- Components ---

const Header: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
    <header className="flex items-center relative mb-6 h-10 z-10 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <ChevronLeft className="w-7 h-7" />
        </button>
        <h1 className="text-xl font-bold text-center w-full truncate px-10 text-white shadow-black drop-shadow-md">{title}</h1>
    </header>
);

const PathItemCard: React.FC<{ title: string; subtitle?: string; onClick: () => void; disabled?: boolean; }> = ({ title, subtitle, onClick, disabled = false }) => {
    return (
        <button onClick={onClick} disabled={disabled} className="w-full text-left group disabled:opacity-60 disabled:cursor-not-allowed mb-4 relative z-10">
            <div className={`
                relative overflow-hidden rounded-2xl p-4 transition-all duration-300
                bg-black/80 backdrop-blur-md
                border border-[#DAA520]
                hover:shadow-[0_0_15px_rgba(218,165,32,0.3)]
                group-hover:bg-black/90
            `}>
                <div className="flex justify-between items-center">
                    <div className="flex-1 overflow-hidden">
                        <h3 className="text-xl font-bold truncate text-white group-hover:text-[#DAA520] transition-colors">{title}</h3>
                        {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
                    </div>
                    {disabled 
                        ? <Lock className="w-6 h-6 text-gray-600 ml-4 flex-shrink-0" />
                        : <ChevronRight className="w-6 h-6 text-[#DAA520] transform group-hover:translate-x-1 transition-transform ml-4 flex-shrink-0" />
                    }
                </div>
            </div>
        </button>
    );
};

const LevelCard: React.FC<{ title: string; subtitle?: string; onClick: () => void; }> = ({ title, subtitle, onClick }) => {
    return (
        <button onClick={onClick} className="w-full text-left group mb-3 relative z-10">
            <div className={`
                relative overflow-hidden rounded-xl p-3 transition-all duration-300
                bg-black/60 backdrop-blur-md
                border border-[#DAA520]/60
                hover:border-[#DAA520]
                hover:bg-black/80
                active:scale-98
            `}>
                <div className="flex justify-between items-center">
                    <div className="flex-1 overflow-hidden">
                        <h3 className="text-base font-bold truncate text-white group-hover:text-[#DAA520] transition-colors">{title}</h3>
                        {subtitle && <p className="text-gray-400 text-xs mt-0.5 truncate">{subtitle}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#DAA520] transform group-hover:translate-x-1 transition-transform ml-2 flex-shrink-0" />
                </div>
            </div>
        </button>
    );
};

// IMPROVED INTRO VIEW: Fixed text weight to font-normal for better readability
const IntroView: React.FC<{ title: string; text: string; onContinue: () => void; onBack: () => void }> = ({ title, text, onContinue, onBack }) => {
    const { translate } = useApp();
    return (
        <div className="relative animate-fadeIn h-full flex flex-col bg-black/60 backdrop-blur-sm max-w-2xl mx-auto w-full">
            <div className="p-4 flex-none">
                <Header title={title} onBack={onBack} />
                <Button onClick={onContinue} className="w-full bg-red-600 hover:bg-red-700 text-white border border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)] uppercase tracking-widest font-bold">
                    {translate('continue')}
                </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 pb-32 custom-scrollbar">
                <Card className="border border-[#DAA520]/30 bg-black/90 backdrop-blur-xl shadow-[0_0_30px_rgba(218,165,32,0.2)] mb-4">
                    <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-line font-normal">
                        {text}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const TechniqueDetailView: React.FC<{ technique: AnyTechnique; onBack: () => void; }> = ({ technique, onBack }) => {
    const { translate } = useApp();
    const [mode, setMode] = useState<Mode>('learn');
    const [showHologram, setShowHologram] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        let timer: number;
        if (countdown > 0) {
            timer = window.setTimeout(() => setCountdown(c => c - 1), 1000);
        } else {
            setShowHologram(true);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const renderContent = () => {
        switch(mode) {
            case 'learn':
                return (
                    <div className="pb-8">
                        <h3 className="text-lg font-bold text-[#DAA520] mb-2">{translate('selfDefense.description')}</h3>
                        <p className="text-gray-300 leading-relaxed mb-4 text-sm font-normal">{technique.description}</p>
                    </div>
                );
            case 'application':
                return (
                    <div className="pb-8">
                        <h3 className="text-lg font-bold text-red-500 mb-2 flex items-center"><AlertTriangle className="w-5 h-5 mr-2"/> {translate('selfDefense.applicationNotes')}</h3>
                        <p className="text-gray-300 leading-relaxed mb-4 text-sm font-normal">{technique.application}</p>
                        {'drills' in technique && technique.drills && (
                            <div className="mt-4">
                                <h4 className="font-bold text-white mb-2 text-sm">{translate('selfDefense.drills')}</h4>
                                <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                                    {technique.drills.map((drill: string, i: number) => <li key={i}>{drill}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            case 'train':
                return (
                    <div className="text-center space-y-4 py-8">
                        <div className="text-6xl font-bold text-white font-mono">{countdown > 0 ? countdown : "GO"}</div>
                        <p className="text-gray-400">Follow the hologram rhythm</p>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="relative h-full flex flex-col animate-fadeIn bg-black/80 backdrop-blur-sm max-w-2xl mx-auto w-full">
            <div className="p-4 flex-none">
                <Header title={technique.name} onBack={onBack} />
                
                {/* 3D Viewport - Fixed Aspect Ratio */}
                <div className="relative w-full aspect-video bg-black/50 rounded-2xl border-2 border-[#DAA520]/50 overflow-hidden shadow-[0_0_20px_rgba(218,165,32,0.2)] mb-4">
                    {showHologram ? (
                        <>
                            <HolographicCoach state="active" modelUrl={technique.modelUrl} isPaused={isPaused} />
                            <button 
                                onClick={() => setIsPaused(!isPaused)} 
                                className="absolute bottom-4 right-4 p-3 bg-black/60 text-white rounded-full border border-white/20 hover:bg-black/80 z-[60] transition-colors"
                            >
                                {isPaused ? <Play className="w-6 h-6"/> : <Pause className="w-6 h-6"/>}
                            </button>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-4xl font-bold text-[#DAA520] animate-pulse">{countdown}</div>
                        </div>
                    )}
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-gray-900/80 p-1 rounded-lg mb-2 border border-gray-800">
                    {(['learn', 'application', 'train'] as Mode[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all duration-300 ${mode === m ? 'bg-[#DAA520] text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            {translate(`selfDefense.${m}Mode`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area - Scrollable Fixed Container */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar min-h-0">
                <Card className="bg-black/80 border-[#DAA520]/20 min-h-min">
                    {renderContent()}
                </Card>
            </div>
        </div>
    );
};

// --- MAIN SCREEN ---

export const SelfDefenseScreen: React.FC = () => {
    const { setScreen, constants, translate } = useApp();
    const [view, setView] = useState<View>('main');
    
    // Selection Indices
    const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
    const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
    const [selectedTechniqueIndex, setSelectedTechniqueIndex] = useState(0);

    const handleDisciplineSelect = (newView: View) => {
        setSelectedLevelIndex(0);
        setSelectedSectionIndex(0);
        setSelectedTechniqueIndex(0);
        setView(newView);
    };

    const getBackgroundImage = () => {
        if (view.startsWith('kungfu')) return DISCIPLINE_BACKGROUNDS.kung_fu;
        if (view.startsWith('jujutsu')) return DISCIPLINE_BACKGROUNDS.jujutsu;
        if (view.startsWith('karate')) return DISCIPLINE_BACKGROUNDS.karate;
        if (view.startsWith('tai_chi')) return DISCIPLINE_BACKGROUNDS.tai_chi;
        if (view.startsWith('wrestling')) return DISCIPLINE_BACKGROUNDS.wrestling;
        return DISCIPLINE_BACKGROUNDS.default;
    };

    return (
        <div className="fixed inset-0 z-0 bg-black text-white font-sans overflow-hidden">
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 opacity-40"
                style={{ backgroundImage: `url(${getBackgroundImage()})` }}
            ></div>
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>

            <div className="relative z-10 h-full flex flex-col w-full">
                
                {view === 'main' && (
                    <div className="p-4 pt-10 h-full flex flex-col animate-fadeIn max-w-2xl mx-auto w-full">
                        <header className="flex items-center relative mb-8 flex-shrink-0">
                            <button onClick={() => setScreen(Screen.Home)} className="p-2 -ml-2 text-gray-400 hover:text-white absolute left-0">
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <h1 className="text-3xl font-bold text-center w-full text-white uppercase tracking-widest" style={{ textShadow: '0 0 10px #DAA520' }}>
                                {translate('nav.defense')}
                            </h1>
                        </header>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            <PathItemCard 
                                title="Iron Buffalo Kung Fu" 
                                subtitle={translate('discipline.kung_fu.desc')}
                                onClick={() => handleDisciplineSelect('kungfu_intro')}
                            />
                            <PathItemCard 
                                title="Neo Tai Chi" 
                                subtitle={translate('selfDefense.taiChiDesc')}
                                onClick={() => handleDisciplineSelect('tai_chi_intro')}
                            />
                            <PathItemCard 
                                title="Shotokan Karate" 
                                subtitle={translate('discipline.karate.desc')}
                                onClick={() => handleDisciplineSelect('karate_intro')}
                            />
                            <PathItemCard 
                                title="Imperial Jujutsu" 
                                subtitle={translate('discipline.jujutsu.desc')}
                                onClick={() => handleDisciplineSelect('jujutsu_intro')}
                            />
                            <PathItemCard 
                                title="Combat Wrestling" 
                                subtitle={translate('discipline.wrestling.desc')}
                                onClick={() => handleDisciplineSelect('wrestling_intro')}
                            />
                        </div>
                    </div>
                )}

                {/* --- KUNG FU FLOW --- */}
                {view === 'kungfu_intro' && (
                    <IntroView 
                        title={constants.KUNG_FU_PROGRAM.program_name}
                        text={constants.KUNG_FU_PROGRAM.description || ""}
                        onContinue={() => setView('kungfu_levels')}
                        onBack={() => setView('main')}
                    />
                )}
                {view === 'kungfu_levels' && (
                    <div className="p-4 pt-6 animate-fadeIn h-full flex flex-col max-w-2xl mx-auto w-full">
                        <Header title="Select Level" onBack={() => setView('kungfu_intro')} />
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            {constants.KUNG_FU_PROGRAM.levels.map((level, i) => (
                                <LevelCard 
                                    key={i} 
                                    title={level.level_name} 
                                    subtitle={level.description}
                                    onClick={() => { setSelectedLevelIndex(i); setView('kungfu_sections'); }}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {view === 'kungfu_sections' && (
                    <div className="p-4 pt-6 animate-fadeIn h-full flex flex-col max-w-2xl mx-auto w-full">
                        <Header title={constants.KUNG_FU_PROGRAM.levels[selectedLevelIndex].level_name} onBack={() => setView('kungfu_levels')} />
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            {constants.KUNG_FU_PROGRAM.levels[selectedLevelIndex].sections.map((section, i) => (
                                <LevelCard 
                                    key={i} 
                                    title={section.section_name} 
                                    onClick={() => { setSelectedSectionIndex(i); setView('kungfu_movements'); }}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {view === 'kungfu_movements' && (
                    <div className="p-4 pt-6 animate-fadeIn h-full flex flex-col max-w-2xl mx-auto w-full">
                        <Header title="Select Movement" onBack={() => setView('kungfu_sections')} />
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            {constants.KUNG_FU_PROGRAM.levels[selectedLevelIndex].sections[selectedSectionIndex].movements.map((move, i) => (
                                <LevelCard 
                                    key={i} 
                                    title={move.name} 
                                    subtitle={move.description}
                                    onClick={() => setSelectedTechniqueIndex(i)} 
                                />
                            ))}
                        </div>
                        {/* Detail Modal Overlay */}
                        {selectedTechniqueIndex !== -1 && (
                            <div className="fixed inset-0 z-50">
                                <TechniqueDetailView 
                                    technique={constants.KUNG_FU_PROGRAM.levels[selectedLevelIndex].sections[selectedSectionIndex].movements[selectedTechniqueIndex]} 
                                    onBack={() => setSelectedTechniqueIndex(-1)} 
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* --- JUJUTSU FLOW --- */}
                {view === 'jujutsu_intro' && (
                    <IntroView 
                        title={constants.IMPERIAL_JUJUTSU_PROGRAM.program_name}
                        text={constants.IMPERIAL_JUJUTSU_PROGRAM.description || ""}
                        onContinue={() => setView('jujutsu_modules')}
                        onBack={() => setView('main')}
                    />
                )}
                {view === 'jujutsu_modules' && (
                    <div className="p-4 pt-6 animate-fadeIn h-full flex flex-col max-w-2xl mx-auto w-full">
                        <Header title="Select Module" onBack={() => setView('jujutsu_intro')} />
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            {constants.IMPERIAL_JUJUTSU_PROGRAM.modules.map((mod, i) => (
                                <LevelCard 
                                    key={i} 
                                    title={mod.module_name} 
                                    subtitle={mod.module_label}
                                    onClick={() => { setSelectedLevelIndex(i); setView('jujutsu_techniques'); }}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {view === 'jujutsu_techniques' && (
                    <div className="p-4 pt-6 animate-fadeIn h-full flex flex-col max-w-2xl mx-auto w-full">
                        <Header title="Select Technique" onBack={() => setView('jujutsu_modules')} />
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            {constants.IMPERIAL_JUJUTSU_PROGRAM.modules[selectedLevelIndex].techniques.map((tech, i) => (
                                <LevelCard 
                                    key={i} 
                                    title={tech.name} 
                                    subtitle={`${tech.name_ja_kanji} (${tech.name_romaji})`}
                                    onClick={() => setSelectedTechniqueIndex(i)} 
                                />
                            ))}
                        </div>
                        {/* Detail Modal Overlay */}
                        {selectedTechniqueIndex !== -1 && (
                            <div className="fixed inset-0 z-50">
                                <TechniqueDetailView 
                                    technique={constants.IMPERIAL_JUJUTSU_PROGRAM.modules[selectedLevelIndex].techniques[selectedTechniqueIndex]} 
                                    onBack={() => setSelectedTechniqueIndex(-1)} 
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAI CHI FLOW --- */}
                {view === 'tai_chi_intro' && (
                    <IntroView 
                        title={constants.NEO_TAI_CHI_PROGRAM.program_name}
                        text={constants.NEO_TAI_CHI_PROGRAM.description || ""}
                        onContinue={() => setView('tai_chi_levels')}
                        onBack={() => setView('main')}
                    />
                )}
                {view === 'tai_chi_levels' && (
                    <div className="p-4 pt-6 animate-fadeIn h-full flex flex-col max-w-2xl mx-auto w-full">
                        <Header title="Select Level" onBack={() => setView('tai_chi_intro')} />
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            {constants.NEO_TAI_CHI_PROGRAM.levels.map((lvl, i) => (
                                <LevelCard 
                                    key={i} 
                                    title={lvl.level} 
                                    subtitle={lvl.title}
                                    onClick={() => { setSelectedLevelIndex(i); setView('tai_chi_techniques'); }}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {view === 'tai_chi_techniques' && (
                    <div className="p-4 pt-6 animate-fadeIn h-full flex flex-col max-w-2xl mx-auto w-full">
                        <Header title="Select Technique" onBack={() => setView('tai_chi_levels')} />
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            {constants.NEO_TAI_CHI_PROGRAM.levels[selectedLevelIndex].techniques.map((tech, i) => (
                                <LevelCard 
                                    key={i} 
                                    title={tech.name} 
                                    onClick={() => setSelectedTechniqueIndex(i)} 
                                />
                            ))}
                        </div>
                        {selectedTechniqueIndex !== -1 && (
                            <div className="fixed inset-0 z-50">
                                <TechniqueDetailView 
                                    technique={constants.NEO_TAI_CHI_PROGRAM.levels[selectedLevelIndex].techniques[selectedTechniqueIndex]} 
                                    onBack={() => setSelectedTechniqueIndex(-1)} 
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* --- KARATE FLOW --- */}
                {view === 'karate_intro' && (
                    <IntroView 
                        title={constants.KARATE_PROGRAM.program_name}
                        text={constants.KARATE_PROGRAM.description || ""}
                        onContinue={() => setView('karate_levels')}
                        onBack={() => setView('main')}
                    />
                )}
                {view === 'karate_levels' && (
                    <div className="p-4 pt-6 animate-fadeIn h-full flex flex-col max-w-2xl mx-auto w-full">
                        <Header title="Select Belt" onBack={() => setView('karate_intro')} />
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            {constants.KARATE_PROGRAM.levels.map((lvl, i) => (
                                <LevelCard 
                                    key={i} 
                                    title={lvl.level_name} 
                                    subtitle={lvl.description}
                                    onClick={() => { setSelectedLevelIndex(i); setView('karate_modules'); }}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {view === 'karate_modules' && (
                    <div className="p-4 pt-6 animate-fadeIn h-full flex flex-col max-w-2xl mx-auto w-full">
                        <Header title="Select Module" onBack={() => setView('karate_levels')} />
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            {constants.KARATE_PROGRAM.levels[selectedLevelIndex].modules.map((mod, i) => (
                                <LevelCard 
                                    key={i} 
                                    title={mod.module_name} 
                                    onClick={() => { setSelectedSectionIndex(i); setView('karate_lessons'); }}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {view === 'karate_lessons' && (
                    <div className="p-4 pt-6 animate-fadeIn h-full flex flex-col max-w-2xl mx-auto w-full">
                        <Header title="Select Lesson" onBack={() => setView('karate_modules')} />
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            {constants.KARATE_PROGRAM.levels[selectedLevelIndex].modules[selectedSectionIndex].lessons.map((lesson, i) => (
                                <LevelCard 
                                    key={i} 
                                    title={lesson.name} 
                                    onClick={() => setSelectedTechniqueIndex(i)} 
                                />
                            ))}
                        </div>
                        {selectedTechniqueIndex !== -1 && (
                            <div className="fixed inset-0 z-50">
                                <TechniqueDetailView 
                                    technique={constants.KARATE_PROGRAM.levels[selectedLevelIndex].modules[selectedSectionIndex].lessons[selectedTechniqueIndex]} 
                                    onBack={() => setSelectedTechniqueIndex(-1)} 
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* --- WRESTLING FLOW --- */}
                {view === 'wrestling_intro' && (
                    <IntroView 
                        title={constants.WRESTLING_PROGRAM.program_name}
                        text={constants.WRESTLING_PROGRAM.description || ""}
                        onContinue={() => setView('wrestling_levels')}
                        onBack={() => setView('main')}
                    />
                )}
                {view === 'wrestling_levels' && (
                    <div className="p-4 pt-6 animate-fadeIn h-full flex flex-col max-w-2xl mx-auto w-full">
                        <Header title="Select Level" onBack={() => setView('wrestling_intro')} />
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            {constants.WRESTLING_PROGRAM.levels.map((lvl, i) => (
                                <LevelCard 
                                    key={i} 
                                    title={lvl.level_name} 
                                    subtitle={lvl.description}
                                    onClick={() => { setSelectedLevelIndex(i); setView('wrestling_movements'); }}
                                />
                            ))}
                        </div>
                    </div>
                )}
                {view === 'wrestling_movements' && (
                    <div className="p-4 pt-6 animate-fadeIn h-full flex flex-col max-w-2xl mx-auto w-full">
                        <Header title="Select Movement" onBack={() => setView('wrestling_levels')} />
                        <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                            {constants.WRESTLING_PROGRAM.levels[selectedLevelIndex].movements.map((move, i) => (
                                <LevelCard 
                                    key={i} 
                                    title={move.name} 
                                    onClick={() => setSelectedTechniqueIndex(i)} 
                                />
                            ))}
                        </div>
                        {selectedTechniqueIndex !== -1 && (
                            <div className="fixed inset-0 z-50">
                                <TechniqueDetailView 
                                    technique={constants.WRESTLING_PROGRAM.levels[selectedLevelIndex].movements[selectedTechniqueIndex]} 
                                    onBack={() => setSelectedTechniqueIndex(-1)} 
                                />
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default SelfDefenseScreen;
