
import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Apple, Scale, TrendingUp, CheckCircle } from 'lucide-react';

const DietAlHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <Apple className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
    </div>
    <p className="text-gray-400">{subtitle}</p>
  </div>
);

const BMIGauge: React.FC<{ bmi: number }> = ({ bmi }) => {
    const getBmiData = (value: number) => {
        if (value < 18.5) return { cat: 'underweight', color: '#3b82f6', deg: Math.min((value / 40) * 180, 180) };
        if (value < 25) return { cat: 'normal', color: '#22c55e', deg: Math.min((value / 40) * 180, 180) };
        if (value < 30) return { cat: 'overweight', color: '#f59e0b', deg: Math.min((value / 40) * 180, 180) };
        return { cat: 'obese', color: '#ef4444', deg: Math.min((value / 40) * 180, 180) };
    };
    const { translate } = useApp();
    const { cat, color, deg } = getBmiData(bmi);

    return (
        <div className="w-full aspect-square relative flex items-center justify-center -mt-4 -mb-8">
             <div className="w-[240px] h-[120px] overflow-hidden absolute top-1/2 -translate-y-[1px]">
                <div className="w-[240px] h-[240px] rounded-full border-[12px] border-gray-800" />
            </div>
            <div className="w-[240px] h-[120px] overflow-hidden absolute top-1/2 -translate-y-[1px]">
                <div 
                    className="w-[240px] h-[240px] rounded-full" 
                    style={{ 
                        background: `conic-gradient(from -90deg, #3b82f6 0 46.25%, #22c55e 46.25% 62.5%, #f59e0b 62.5% 75%, #ef4444 75% 100%)`,
                        clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)'
                    }} 
                />
            </div>
            <div 
                className="absolute top-1/2 left-1/2 w-0.5 h-[108px] origin-bottom transition-transform duration-1000" 
                style={{ transform: `translateX(-50%) rotate(${deg-90}deg)` }}
            >
                <div className="w-full h-full bg-gray-200 rounded-full"></div>
                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-black border-4 border-gray-200 shadow-md"></div>
            </div>
             <div className="absolute top-1/2 mt-4 text-center">
                <p className="text-5xl font-bold text-white">{bmi > 0 ? bmi.toFixed(1) : '-'}</p>
                <p className="font-bold" style={{ color }}>{translate(`nutrition.tracking.bmiCategory.${cat}`)}</p>
            </div>
        </div>
    );
};

const WeightChart: React.FC = () => {
    const { profile, translate } = useApp();
    const history = profile?.weight_history || [];

    const dataPoints = history.slice(-30); 
    if (dataPoints.length < 2) return <p className="text-center text-gray-400 py-4">{translate('nutrition.tracking.historyEmpty')}</p>;

    const maxWeight = Math.max(...dataPoints.map(p => p.weight));
    const minWeight = Math.min(...dataPoints.map(p => p.weight));
    const spread = maxWeight - minWeight;

    const points = dataPoints.map((p, i) => {
        const x = (i / (dataPoints.length - 1)) * 100;
        const y = spread > 0 ? 100 - ((p.weight - minWeight) / spread) * 80 - 10 : 50;
        return `${x},${y}`;
    }).join(' ');
    
    return (
        <div className="w-full h-40 -mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5"/>
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                    </linearGradient>
                </defs>
                <path d={`M 0,100 ${points} L 100,100 Z`} fill="url(#glow)"/>
                <polyline fill="none" stroke="#22c55e" strokeWidth="1.5" points={points} style={{filter: 'drop-shadow(0 0 5px #22c55e)'}}/>
            </svg>
        </div>
    );
};

const MetricsModal: React.FC<{
    titleKey: string;
    weightValue: string;
    setWeightValue: (val: string) => void;
    heightValue: string;
    setHeightValue: (val: string) => void;
    onSave: () => void;
    onClose: () => void;
}> = ({ titleKey, weightValue, setWeightValue, heightValue, setHeightValue, onSave, onClose }) => {
    const { translate } = useApp();
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700 shadow-lg">
                <h3 className="text-lg font-bold text-white">{translate(titleKey)}</h3>
                
                <label className="text-sm text-gray-400 mt-4 block">{translate('nutrition.tracking.updateModal.label')}</label>
                <input 
                    type="number"
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white mt-1"
                    autoFocus
                />

                <label className="text-sm text-gray-400 mt-4 block">{translate('nutrition.tracking.updateMetricsModal.heightLabel')}</label>
                <input 
                    type="number"
                    value={heightValue}
                    onChange={(e) => setHeightValue(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white mt-1"
                />

                <div className="grid grid-cols-2 gap-2 mt-4">
                    <button onClick={onClose} className="bg-gray-700 text-gray-200 font-bold py-3 rounded-lg transition-colors hover:bg-gray-600 active:scale-95">{translate('nutrition.tracking.updateModal.cancel')}</button>
                    <button onClick={onSave} className="bg-green-500 text-white font-bold py-3 rounded-lg transition-opacity hover:opacity-80 active:scale-95">{translate('nutrition.tracking.updateModal.save')}</button>
                </div>
            </div>
        </div>
    );
};

const GoalModal: React.FC<{
    titleKey: string;
    labelKey: string;
    saveKey: string;
    value: string;
    setValue: (val: string) => void;
    onSave: () => void;
    onClose: () => void;
}> = ({ titleKey, labelKey, saveKey, value, setValue, onSave, onClose }) => {
    const { translate } = useApp();
    return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700 shadow-lg">
            <h3 className="text-lg font-bold text-white">{translate(titleKey)}</h3>
            <label className="text-sm text-gray-400 mt-4 block">{translate(labelKey)}</label>
            <input 
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white mt-1"
                autoFocus
            />
            <div className="grid grid-cols-2 gap-2 mt-4">
                <button onClick={onClose} className="bg-gray-700 text-gray-200 font-bold py-3 rounded-lg transition-colors hover:bg-gray-600 active:scale-95">{translate('nutrition.tracking.updateModal.cancel')}</button>
                <button onClick={onSave} className="bg-green-500 text-white font-bold py-3 rounded-lg transition-opacity hover:opacity-80 active:scale-95">{translate(saveKey)}</button>
            </div>
        </div>
    </div>
)};

const DietAlTracking: React.FC = () => {
    const { translate, profile, updateWeightGoal, updateUserMetrics } = useApp();
    const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [newWeight, setNewWeight] = useState(profile?.weight?.toString() || '');
    const [newHeight, setNewHeight] = useState(profile?.height?.toString() || '');
    const [newGoalWeight, setNewGoalWeight] = useState(profile?.weight_goal?.toString() || '');
    const [status, setStatus] = useState('');

    const { weight = 0, height = 0, age = 0, gender = 'Male' } = profile || {};
    const heightInMeters = height / 100;
    const bmi = heightInMeters > 0 ? weight / (heightInMeters * heightInMeters) : 0;
    
    const bodyFat = useMemo(() => {
        if (bmi > 0 && age > 0) {
            const genderFactor = gender === 'Male' ? 1 : 0;
            return (1.20 * bmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4;
        }
        return 0;
    }, [bmi, age, gender]);

    const showTemporaryStatus = (textKey: string) => {
        setStatus(translate(textKey));
        setTimeout(() => setStatus(''), 3000);
    };

    const handleUpdateMetrics = () => {
        const weightValue = parseFloat(newWeight);
        const heightValue = parseFloat(newHeight);
        
        if (!isNaN(weightValue) && weightValue > 0 && !isNaN(heightValue) && heightValue > 0) {
            updateUserMetrics(weightValue, heightValue);
            setIsMetricsModalOpen(false);
            showTemporaryStatus('nutrition.tracking.metricsUpdated');
        }
    };
    
    const handleSetGoal = () => {
        const goalValue = parseFloat(newGoalWeight);
        if (!isNaN(goalValue) && goalValue > 0) {
            updateWeightGoal(goalValue);
            setIsGoalModalOpen(false);
            showTemporaryStatus('nutrition.tracking.goalUpdated');
        }
    };
    
    return (
        <div className="space-y-6 animate-fadeIn">
            {isMetricsModalOpen && <MetricsModal 
                titleKey="nutrition.tracking.updateMetricsModal.title"
                weightValue={newWeight}
                setWeightValue={setNewWeight}
                heightValue={newHeight}
                setHeightValue={setNewHeight}
                onSave={handleUpdateMetrics}
                onClose={() => setIsMetricsModalOpen(false)}
            />}
             {isGoalModalOpen && <GoalModal 
                titleKey="nutrition.tracking.setGoalModal.title"
                labelKey="nutrition.tracking.setGoalModal.label"
                saveKey="nutrition.tracking.setGoalModal.save"
                value={newGoalWeight}
                setValue={setNewGoalWeight}
                onSave={handleSetGoal}
                onClose={() => setIsGoalModalOpen(false)}
            />}
            <DietAlHeader title={translate('nutrition.tracking.title')} subtitle={translate('nutrition.tracking.subtitle')} />
            
             {status && (
                <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg relative flex items-center" role="alert">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="block sm:inline">{status}</span>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-black p-4 rounded-2xl border border-gray-800 shadow-sm text-center">
                    <p className="text-sm font-bold text-gray-400">{translate('nutrition.tracking.currentWeight')}</p>
                    <p className="text-4xl font-bold text-white">{weight.toFixed(1)}<span className="text-lg">kg</span></p>
                </div>
                 <div className="bg-black p-4 rounded-2xl border border-gray-800 shadow-sm text-center">
                    <p className="text-sm font-bold text-gray-400">{translate('nutrition.tracking.height')}</p>
                    <p className="text-4xl font-bold text-white">{height}<span className="text-lg">cm</span></p>
                </div>
            </div>
            
            <div className="bg-black p-4 rounded-2xl border border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold text-white text-center">{translate('nutrition.tracking.bmi')}</h3>
                <BMIGauge bmi={bmi}/>
            </div>

            <div className="bg-black p-4 rounded-2xl border border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold text-white mb-2">{translate('nutrition.tracking.bodyFat')}</h3>
                <div className="flex items-center gap-4">
                    <p className="text-4xl font-bold text-white">{bodyFat > 0 ? bodyFat.toFixed(1) : '-'}<span className="text-lg">%</span></p>
                    <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                        <div className="h-4 rounded-full bg-gradient-to-r from-green-400 to-blue-500" style={{ width: `${Math.min(bodyFat * 2.5, 100)}%`, boxShadow: `0 0 8px #22c55e` }}></div>
                    </div>
                </div>
            </div>

            <div className="bg-black p-4 rounded-2xl border border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold text-white text-center">{translate('nutrition.tracking.history')}</h3>
                <WeightChart />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setIsMetricsModalOpen(true)} className="bg-green-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95">
                    <Scale size={16} className="mr-2" />{translate('nutrition.tracking.updateMetrics')}
                </button>
                <button onClick={() => setIsGoalModalOpen(true)} className="bg-gray-800 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-700 active:scale-95 border border-gray-600">
                    <TrendingUp size={16} className="mr-2" />{translate('nutrition.tracking.setGoal')}
                </button>
            </div>

        </div>
    );
};

export default DietAlTracking;
