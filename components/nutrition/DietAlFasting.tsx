import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Apple, Droplets, Flame, Recycle, Info, X, Loader as LoaderIcon, Wind, Play, Square, Zap, Radio } from 'lucide-react';
import { FastingPlan } from '../../types.ts';
import { getFastingPhaseExplanation } from '../../services/aiService.ts';

const DietAlHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6 font-['Poppins']">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">{title}</h1>
      <Apple className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
    </div>
    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">{subtitle}</p>
  </div>
);

const phaseMilestones = [
  { name: 'digestion', hours: 6, icon: Droplets, titleKey: 'nutrition.fasting.phase.digestion.title' },
  { name: 'fatburning', hours: 12, icon: Flame, titleKey: 'nutrition.fasting.phase.fatburning.title' },
  { name: 'ketosis', hours: 16, icon: Wind, titleKey: 'nutrition.fasting.phase.ketosis.title' },
  { name: 'autophagy', hours: 20, icon: Recycle, titleKey: 'nutrition.fasting.phase.autophagy.title' },
  { name: 'growth', hours: 24, icon: Zap, titleKey: 'nutrition.fasting.phase.growth.title' },
];

const FastingCircle: React.FC<{
  hoursElapsed: number;
  totalHours: number;
  onPhaseClick: (phaseName: string, titleKey: string) => void;
}> = ({ hoursElapsed, totalHours, onPhaseClick }) => {
  const { translate } = useApp();
  const progress = totalHours > 0 ? (hoursElapsed / totalHours) * 100 : (hoursElapsed / 24) * 100;

  const getPositionOnCircle = (hour: number, radius: number) => {
    const effectiveTotalHours = totalHours > 0 ? totalHours : 24;
    const angle = (hour / effectiveTotalHours) * 360 - 90;
    const x = 50 + radius * Math.cos(angle * Math.PI / 180);
    const y = 50 + radius * Math.sin(angle * Math.PI / 180);
    return { x, y };
  };

  return (
    <div className="relative w-64 h-64 mx-auto my-4 font-['Poppins']">
      <svg className="w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
        <circle
          className="text-green-500"
          strokeWidth="8"
          strokeDashoffset="0"
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          style={{ transition: 'stroke-dasharray 0.5s linear', strokeDasharray: `${(progress / 100) * 2 * Math.PI * 45} 999` }}
        />
      </svg>
      <div className="absolute inset-0">
        {phaseMilestones.map(phase => {
          const effectiveTotalHours = totalHours > 0 ? totalHours : 24;
          if (phase.hours > effectiveTotalHours && effectiveTotalHours < 24) return null;
          
          const position = getPositionOnCircle(phase.hours, 45);
          const isReached = hoursElapsed >= phase.hours;
          return (
            <button
              key={phase.name}
              onClick={() => onPhaseClick(phase.name, phase.titleKey)}
              className={`absolute w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 transform -translate-x-1/2 -translate-y-1/2
                ${isReached ? 'bg-green-500 text-white shadow-lg shadow-green-500/50 animate-pulse' : 'bg-gray-800 text-gray-400'}`
              }
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              aria-label={translate(phase.titleKey)}
            >
              <phase.icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const PhaseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  phaseName: string;
  title: string;
  explanation: string | null;
}> = ({ isOpen, onClose, phaseName, title, explanation }) => {
    if (!isOpen) return null;
    const { translate } = useApp();
    const phaseIcon = useMemo(() => {
        const phase = phaseMilestones.find(p => p.name === phaseName);
        return phase ? phase.icon : Info;
    }, [phaseName]);
    const Icon = phaseIcon;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn font-['Poppins']">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700 shadow-lg text-center relative max-h-[80vh] overflow-y-auto custom-scrollbar">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white p-2 sticky z-10 bg-gray-900/80 rounded-full">
                    <X size={24} />
                </button>
                <div className="w-16 h-16 rounded-full bg-green-900/50 flex items-center justify-center mx-auto mb-4 border-4 border-green-700 shrink-0">
                    <Icon className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                <div className="min-h-[100px] text-left">
                    {explanation ? (
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-normal">{explanation}</p>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-2 py-4">
                            <LoaderIcon className="w-6 h-6 animate-spin text-green-500" />
                            <p className="text-sm text-gray-400">{translate('nutrition.fasting.phase.modal.generating')}</p>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-green-500 text-white font-bold py-3 rounded-lg transition-opacity hover:opacity-80 active:scale-95 shrink-0">
                    {translate('nutrition.fasting.phase.modal.close')}
                </button>
            </div>
        </div>
    );
};

const HadithCard: React.FC = () => {
    const { translate } = useApp();
    return (
        <div className="bg-black/40 p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl backdrop-blur-md font-['Poppins']">
            <p className="text-center text-sm font-medium text-green-500 mb-6 uppercase tracking-widest">
              {translate('nutrition.fasting.hadith.header')}
            </p>
            <div className="relative mb-6">
               <p className="text-center text-2xl text-white leading-relaxed px-4 opacity-90 font-semibold italic">
                   {translate('nutrition.fasting.hadith.shield.text')}
               </p>
            </div>
            <p className="text-center text-[9px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-8">
              {translate('nutrition.fasting.hadith.source')}
            </p>
            <div className="space-y-3 px-2">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3 py-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 shrink-0 shadow-[0_0_5px_#22c55e]" />
                        <p className="text-gray-300 text-xs font-normal tracking-wide">{translate(`nutrition.fasting.hadith.bullet${i}`)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const DietAlFasting: React.FC = () => {
  const { translate, profile, updateFastingPlan, language, showStatus } = useApp();
  const [mode, setMode] = useState<'plan' | 'manual'>('manual');
  
  const [selectedPlan, setSelectedPlan] = useState<FastingPlan>(profile?.fasting_plan || { type: '16:8', eatingWindowHours: 8, fastingWindowHours: 16 });
  const [isSaving, setIsSaving] = useState(false);

  const [manualTimer, setManualTimer] = useState<{ startTime: number | null, elapsedSeconds: number, isRunning: boolean }>({ startTime: null, elapsedSeconds: 0, isRunning: false });
  const timerIntervalRef = useRef<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ phaseName: string; title: string; explanation: string | null }>({ phaseName: '', title: '', explanation: null });

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);
  
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartManual = () => {
    const startTime = Date.now() - manualTimer.elapsedSeconds * 1000;
    setManualTimer(prev => ({ ...prev, startTime, isRunning: true }));
    timerIntervalRef.current = window.setInterval(() => {
      setManualTimer(prev => ({ ...prev, elapsedSeconds: (Date.now() - (prev.startTime || Date.now())) / 1000 }));
    }, 1000);
  };
  
  const handleStopManual = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setManualTimer(prev => ({ ...prev, isRunning: false }));
  };

  const handleSavePlan = async () => {
    setIsSaving(true);
    await updateFastingPlan(selectedPlan);
    setIsSaving(false);
    showStatus(translate('nutrition.fasting.saveSuccess'));
  };

  const handlePhaseClick = async (phaseName: string, titleKey: string) => {
    const title = translate('nutrition.fasting.phase.modal.title', { phaseName: translate(titleKey) });
    setModalContent({ phaseName, title, explanation: null });
    setIsModalOpen(true);
    const explanation = await getFastingPhaseExplanation(phaseName, language);
    setModalContent({ phaseName, title, explanation });
  };
  
  const hoursElapsed = manualTimer.elapsedSeconds / 3600;

  return (
    <div className="space-y-6 animate-fadeIn pb-24 font-['Poppins']">
      <PhaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        {...modalContent}
      />
      <DietAlHeader title={translate('nutrition.fasting.title')} subtitle={translate('nutrition.fasting.subtitle')} />

      <section>
        <p className="text-[10px] font-black text-gray-500 mb-4 uppercase tracking-[0.2em] px-1">{translate('nutrition.fasting.mode.title')}</p>
        <div className="bg-gray-900/30 p-1 rounded-2xl grid grid-cols-2 gap-1 border border-gray-800/50">
            <button onClick={() => setMode('plan')} className={`py-3 rounded-xl font-semibold text-[10px] uppercase tracking-[0.2em] transition-all ${mode === 'plan' ? 'bg-green-600/20 text-green-400 border border-green-500/30 shadow-lg' : 'bg-transparent text-gray-600'}`}>{translate('nutrition.fasting.mode.plan')}</button>
            <button onClick={() => setMode('manual')} className={`py-3 rounded-xl font-semibold text-[10px] uppercase tracking-[0.2em] transition-all ${mode === 'manual' ? 'bg-green-600/20 text-green-400 border border-green-500/30 shadow-lg' : 'bg-transparent text-gray-600'}`}>{translate('nutrition.fasting.mode.manual')}</button>
        </div>
      </section>

      {mode === 'plan' ? (
        <div className="bg-black/40 p-8 rounded-[2.5rem] border border-gray-800/50 shadow-xl">
          <h3 className="text-[10px] font-black text-gray-500 mb-8 uppercase tracking-[0.4em] text-center">{translate('nutrition.fasting.selectPlan')}</h3>
          <div className="grid grid-cols-3 gap-4">
            {(['16:8', '18:6', '20:4'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedPlan({ type, fastingWindowHours: parseInt(type.split(':')[0]), eatingWindowHours: parseInt(type.split(':')[1]) })}
                className={`py-6 rounded-2xl font-light text-xl transition-all ${selectedPlan.type === type ? 'bg-green-600/20 text-white shadow-[0_0_20px_rgba(34,197,94,0.2)] scale-105 border border-green-500/50' : 'bg-gray-950 text-gray-700 border border-gray-900'}`}
              >
                {type}
              </button>
            ))}
          </div>
          <button onClick={handleSavePlan} disabled={isSaving} className="w-full bg-green-600 text-white font-bold py-4 px-4 rounded-2xl disabled:opacity-50 transition-all mt-10 flex items-center justify-center uppercase tracking-[0.3em] shadow-2xl active:scale-95 text-xs">
            <Radio size={16} className="mr-3" />
            {isSaving ? translate('processing') : translate('nutrition.fasting.savePlan')}
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="bg-black/40 p-8 rounded-[2.5rem] border border-gray-800/50 shadow-xl text-center">
              <h3 className="text-[9px] font-black text-gray-600 uppercase tracking-[0.5em] mb-4">{translate('nutrition.fasting.timerTitle')}</h3>
              <FastingCircle hoursElapsed={hoursElapsed} totalHours={0} onPhaseClick={handlePhaseClick} />
              <p className="text-6xl font-light font-mono text-white tracking-tighter mt-6" style={{ textShadow: '0 0 30px rgba(34,197,94,0.15)' }}>{formatTime(manualTimer.elapsedSeconds)}</p>
              <div className="mt-10 flex justify-center">
                  {!manualTimer.isRunning ? (
                      <button onClick={handleStartManual} className="bg-green-600 text-white font-bold py-5 px-12 rounded-2xl flex items-center justify-center transition-all hover:bg-green-500 shadow-2xl active:scale-95 uppercase tracking-[0.2em] text-xs">
                          <Play size={18} className="mr-3 fill-current"/> {translate('nutrition.fasting.startFast')}
                      </button>
                  ) : (
                      <button onClick={handleStopManual} className="bg-red-600 text-white font-bold py-5 px-12 rounded-2xl flex items-center justify-center transition-all hover:bg-red-500 shadow-2xl active:scale-95 uppercase tracking-[0.2em] text-xs">
                          <Square size={18} className="mr-3 fill-current"/> {translate('nutrition.fasting.endFast')}
                      </button>
                  )}
              </div>
          </div>
          <HadithCard />
        </div>
      )}
    </div>
  );
};

export default DietAlFasting;