
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Apple, Droplets, Flame, Recycle, Save, CheckCircle, Info, X, Loader as LoaderIcon, Wind, Play, Square, Zap } from 'lucide-react';
import { FastingPlan } from '../../types.ts';
import { getFastingPhaseExplanation } from '../../services/aiService.ts';

const DietAlHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <Apple className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
    </div>
    <p className="text-gray-400">{subtitle}</p>
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
    <div className="relative w-64 h-64 mx-auto my-4">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fadeIn">
            {/* Added max-h and overflow-y-auto to allow scrolling */}
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
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{explanation}</p>
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
        <div className="bg-black p-4 rounded-xl border border-gray-800">
            <p className="text-center text-sm font-bold text-green-500 mb-2">{translate('nutrition.fasting.hadith.header')}</p>
            <p className="text-center text-xl text-white font-serif whitespace-pre-line mb-2 italic">
                {translate('nutrition.fasting.hadith.shield.text')}
            </p>
            <p className="text-center text-xs text-gray-500 mb-4">{translate('nutrition.fasting.hadith.source')}</p>
            
            <ul className="mt-3 text-xs text-gray-300 space-y-1 pl-4 list-disc marker:text-green-500">
                <li>{translate('nutrition.fasting.hadith.shield.detail1')}</li>
                <li>{translate('nutrition.fasting.hadith.shield.detail2')}</li>
                <li>{translate('nutrition.fasting.hadith.shield.detail3')}</li>
                <li>{translate('nutrition.fasting.hadith.shield.detail4')}</li>
                <li>{translate('nutrition.fasting.hadith.shield.detail5')}</li>
            </ul>
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
    <div className="space-y-6 animate-fadeIn">
      <PhaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        {...modalContent}
      />
      <DietAlHeader title={translate('nutrition.fasting.title')} subtitle={translate('nutrition.fasting.subtitle')} />

      <div className="bg-gray-800 p-1 rounded-lg grid grid-cols-2 gap-1">
        <button onClick={() => setMode('plan')} className={`py-2 rounded-md font-bold text-sm ${mode === 'plan' ? 'bg-black text-white shadow-sm' : 'bg-transparent text-gray-400'}`}>{translate('nutrition.fasting.mode.plan')}</button>
        <button onClick={() => setMode('manual')} className={`py-2 rounded-md font-bold text-sm ${mode === 'manual' ? 'bg-black text-white shadow-sm' : 'bg-transparent text-gray-400'}`}>{translate('nutrition.fasting.mode.manual')}</button>
      </div>

      {mode === 'plan' ? (
        <div className="bg-black p-4 rounded-2xl border border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-4">{translate('nutrition.fasting.selectPlan')}</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['16:8', '18:6', '20:4'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedPlan({ type, fastingWindowHours: parseInt(type.split(':')[0]), eatingWindowHours: parseInt(type.split(':')[1]) })}
                className={`py-4 rounded-lg font-bold ${selectedPlan.type === type ? 'bg-green-500 text-white' : 'bg-gray-800 text-white'}`}
              >
                {type}
              </button>
            ))}
          </div>
          <button onClick={handleSavePlan} disabled={isSaving} className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition-opacity mt-4 flex items-center justify-center">
            <Save size={16} className="mr-2" />
            {isSaving ? translate('processing') : translate('nutrition.fasting.savePlan')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-black p-4 rounded-2xl border border-gray-800 shadow-sm text-center">
              <h3 className="text-lg font-bold text-white">{translate('nutrition.fasting.timerTitle')}</h3>
              <FastingCircle hoursElapsed={hoursElapsed} totalHours={0} onPhaseClick={handlePhaseClick} />
              <p className="text-5xl font-bold font-mono text-white">{formatTime(manualTimer.elapsedSeconds)}</p>
              <div className="mt-4 flex justify-center gap-2">
                  {!manualTimer.isRunning ? (
                      <button onClick={handleStartManual} className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95">
                          <Play size={18} className="mr-2"/> {translate('nutrition.fasting.startFast')}
                      </button>
                  ) : (
                      <button onClick={handleStopManual} className="bg-red-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95">
                          <Square size={18} className="mr-2"/> {translate('nutrition.fasting.endFast')}
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
