import React from 'react';
import { useApp } from './useApp.ts';
import { Apple, BarChart } from 'lucide-react';

const DietAlHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6 font-['Poppins']">
    <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">{title}</h1>
        <Apple className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
    </div>
    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">{subtitle}</p>
  </div>
);

const MacroBar: React.FC<{ label: string; value: number; goal: number; color: string }> = ({ label, value, goal, color }) => {
    const percentage = goal > 0 ? (value / goal) * 100 : 0;
    const isOver = percentage > 100;
    const displayPercentage = Math.min(percentage, 100);

    return (
        <div className="mb-6 font-['Poppins']">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-gray-300">{label}</span>
                <span className="text-xs font-mono text-gray-500">{Math.round(value)} / {goal} g</span>
            </div>
            <div className="w-full bg-gray-900/60 rounded-full h-3 border border-gray-800">
                <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${displayPercentage}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
                ></div>
            </div>
            {isOver && <p className="text-[10px] font-bold text-right text-red-500 mt-1.5 uppercase tracking-widest">+{Math.round(value - goal)}g excess</p>}
        </div>
    );
}

const NUTRIENT_KEYS = [
    "cholesterol", 
    "omega3", 
    "saturated_fat", 
    "sodium", 
    "sugar", 
    "caffeine", 
    "vitamins"
];

const DietAlAnalytics: React.FC = () => {
    const { translate, dailyMacros } = useApp();
    
    // REQUESTED GOALS: 3000 kcal, 180g P, 390g C, 80g F
    const calGoal = 3000;
    const pGoal = 180;
    const cGoal = 390;
    const fGoal = 80;

    const macros = dailyMacros || {
        calories: { goal: calGoal, current: 0 }, 
        protein: { goal: pGoal, current: 0 },
        carbs: { goal: cGoal, current: 0 }, 
        fat: { goal: fGoal, current: 0 }
    };
    
    const caloriePercentage = (macros.calories.current / calGoal) * 100;

    return (
        <div className="animate-fadeIn space-y-8 font-['Poppins'] pb-20 px-1">
            <DietAlHeader title={translate('analytics.title')} subtitle={translate('analytics.nutrientBreakdown')} />

            <div className="bg-gray-950/60 p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl backdrop-blur-md">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center mb-8">
                    <BarChart className="w-4 h-4 mr-2 text-green-500" />
                    {translate('analytics.caloricIntake')}
                </h3>
                <div className="relative w-44 h-44 mx-auto mb-10">
                    <svg className="w-full h-full" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        <path className="text-gray-900" stroke="currentColor" strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path
                            className="text-green-500"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"
                            strokeDasharray={`${Math.min(caloriePercentage, 100)}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            style={{ filter: 'drop-shadow(0 0 10px #22c55e)' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-white tracking-tighter">{Math.round(macros.calories.current)}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">/ {calGoal} {translate('nutrition.unit.kcal')}</span>
                    </div>
                </div>

                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center mb-8">
                    <BarChart className="w-4 h-4 mr-2 text-green-500" />
                    {translate('analytics.macrosDistribution')}
                </h3>
                <div className="space-y-4">
                    <MacroBar label={translate('nutrition.dashboard.protein')} value={macros.protein.current} goal={pGoal} color="#f59e0b" />
                    <MacroBar label={translate('nutrition.dashboard.carbs')} value={macros.carbs.current} goal={cGoal} color="#22c55e" />
                    <MacroBar label={translate('nutrition.dashboard.fat')} value={macros.fat.current} goal={fGoal} color="#3b82f6" />
                </div>
            </div>

            <div className="bg-gray-950/40 p-8 rounded-[2.5rem] border border-gray-800/50 shadow-xl pb-12">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6 flex items-center">
                    {translate('analytics.trackedItems')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {NUTRIENT_KEYS.map(key => (
                        <div key={key} className="px-4 py-3 bg-gray-900/80 border border-gray-800 text-gray-300 text-[9px] font-black uppercase tracking-widest rounded-xl shadow-sm flex items-center justify-center text-center">
                            {translate(`nutrient.${key}`)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DietAlAnalytics;