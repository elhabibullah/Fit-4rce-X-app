import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Apple, Flame } from 'lucide-react';

const DietAlHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6 font-['Poppins']">
    <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">{title}</h1>
        <Apple className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
    </div>
    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">{subtitle}</p>
  </div>
);

const MacroRing: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
    const strokeDash = 2 * Math.PI * 15.9155;
    return (
        <div className="flex flex-col items-center font-['Poppins']">
            <div className="relative w-16 h-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <circle className="text-gray-800" stroke="currentColor" strokeWidth="3" fill="none" r="15.9155" cx="18" cy="18" />
                    <circle stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray={`0, ${strokeDash}`} r="15.9155" cx="18" cy="18" style={{ color }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-white">0</span>
                </div>
            </div>
            <p className="mt-1.5 text-[7px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-[8px] text-gray-500 font-mono">{value}</p>
        </div>
    );
};

const MetricCard: React.FC<{ value: string }> = ({ value }) => (
    <div className="bg-gray-950/40 p-5 rounded-2xl border border-gray-800 shadow-sm text-center font-['Poppins']">
        <p className="text-[10px] text-white font-bold uppercase tracking-widest">{value}</p>
    </div>
);

const DietAlTracking: React.FC = () => {
    const { translate, openDeviceModal } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="space-y-6 animate-fadeIn font-['Poppins'] pb-24 px-1">
            {/* TOP SECTION: DAILY INTAKE */}
            <DietAlHeader title={translate('vitals.nutrition')} subtitle={translate('vitals.intake')} />

            <div className="bg-black/40 p-6 rounded-[2.5rem] border border-gray-800 shadow-xl relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 p-4"><Flame className="text-orange-500 w-4 h-4 animate-pulse" /></div>
                <div className="text-center">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.4em] mb-3">{translate('vitals.consumed')}</p>
                    <div className="relative inline-block mb-4">
                         <div className="text-4xl font-black text-white tracking-tighter">0</div>
                         <div className="text-[9px] font-bold text-gray-600 uppercase mt-1 tracking-widest">{translate('vitals.goal')}</div>
                    </div>
                    <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden mb-6"><div className="h-full bg-green-500 w-0 transition-all duration-1000"></div></div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <MacroRing label={translate('vitals.p')} value={translate('vitals.pG')} color="#f59e0b" />
                    <MacroRing label={translate('vitals.c')} value={translate('vitals.cG')} color="#22c55e" />
                    <MacroRing label={translate('vitals.f')} value={translate('vitals.fG')} color="#3b82f6" />
                </div>
            </div>

            {/* MIDDLE SECTION: BODY METRICS */}
            <div className="mt-10 mb-4 px-1">
                <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">{translate('metrics.title')}</h2>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">{translate('metrics.subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <MetricCard value={translate('metrics.weight')} />
                <MetricCard value={translate('metrics.height')} />
                <MetricCard value={translate('metrics.bmi')} />
                <MetricCard value={translate('metrics.fat')} />
            </div>

            {/* HISTORY EMPTY */}
            <div className="bg-gray-950/20 py-12 rounded-2xl border border-gray-900 border-dashed text-center mt-6">
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">{translate('metrics.history')}</p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => setIsModalOpen(true)} className="bg-green-600 text-white font-black py-4 rounded-xl shadow-lg text-[10px] uppercase tracking-widest">{translate('metrics.update')}</button>
                <button onClick={() => setIsModalOpen(true)} className="bg-gray-800 text-white font-black py-4 rounded-xl border border-gray-700 shadow-lg text-[10px] uppercase tracking-widest">{translate('metrics.setGoal')}</button>
            </div>

            {/* FOOTER: CONNECT BRACELET */}
            <div className="pt-6 pb-12">
                <button onClick={openDeviceModal} className="w-full py-4 border border-dashed border-gray-800 rounded-2xl text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] hover:text-gray-400 transition-all">
                    {translate('vitals.connect')}
                </button>
            </div>

            {/* SIMPLE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-3xl p-8 w-full max-w-sm border border-gray-800 text-center">
                        <h3 className="text-white font-black uppercase tracking-widest mb-6">Access Protocol</h3>
                        <p className="text-gray-500 text-xs mb-8">Synchronizing biometric sensors...</p>
                        <button onClick={() => setIsModalOpen(false)} className="w-full py-4 bg-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Done</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DietAlTracking;