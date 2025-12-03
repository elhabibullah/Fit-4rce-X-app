
import React from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Apple, BarChart } from 'lucide-react';

const DietAlHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <Apple className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
    </div>
    <p className="text-gray-400">{subtitle}</p>
  </div>
);

const MacroBar: React.FC<{ label: string; value: number; goal: number; color: string }> = ({ label, value, goal, color }) => {
    const percentage = goal > 0 ? (value / goal) * 100 : 0;
    const isOver = percentage > 100;
    const displayPercentage = Math.min(percentage, 100);

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-gray-300">{label}</span>
                <span className="text-sm text-gray-500">{Math.round(value)} / {goal} g</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5">
                <div 
                    className="h-2.5 rounded-full" 
                    style={{ width: `${displayPercentage}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                ></div>
            </div>
            {isOver && <p className="text-xs text-right text-red-500 mt-1">+{Math.round(value - goal)}g over goal</p>}
        </div>
    );
}

const OTHER_NUTRIENT_KEYS = ["cholesterol", "omega3", "saturated_fat", "sodium", "sugar", "caffeine", "alcohol", "vitamins"];

const DietAlAnalytics: React.FC = () => {
    const { translate, dailyMacros } = useApp();
    const macros = dailyMacros || {
        calories: { goal: 2000, current: 0 }, protein: { goal: 150, current: 0 },
        carbs: { goal: 200, current: 0 }, fat: { goal: 60, current: 0 }
    };
    const caloriePercentage = (macros.calories.current / macros.calories.goal) * 100;

    return (
        <div className="animate-fadeIn">
            <DietAlHeader title={translate('nutrition.analytics.title')} subtitle={translate('nutrition.analytics.subtitle')} />

            <div className="bg-black p-6 rounded-2xl border border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold text-white flex items-center mb-4">
                    <BarChart className="w-5 h-5 mr-2 text-green-500" />
                    {translate('nutrition.analytics.intake')}
                </h3>
                <div className="relative w-36 h-36 mx-auto">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path className="text-gray-700" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path
                            className="text-green-500"
                            stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"
                            strokeDasharray={`${caloriePercentage}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-white">{Math.round(macros.calories.current)}</span>
                        <span className="text-sm text-gray-400">/ {macros.calories.goal} kcal</span>
                    </div>
                </div>

                 <h3 className="text-lg font-bold text-white flex items-center mt-8 mb-4">
                    <BarChart className="w-5 h-5 mr-2 text-green-500" />
                    {translate('nutrition.analytics.macros')}
                </h3>
                <div className="space-y-4">
                    <MacroBar label={translate('nutrition.dashboard.protein')} value={macros.protein.current} goal={macros.protein.goal} color="#f59e0b" />
                    <MacroBar label={translate('nutrition.dashboard.carbs')} value={macros.carbs.current} goal={macros.carbs.goal} color="#22c55e" />
                    <MacroBar label={translate('nutrition.dashboard.fat')} value={macros.fat.current} goal={macros.fat.goal} color="#3b82f6" />
                </div>
            </div>

            <div className="bg-black p-6 rounded-2xl border border-gray-800 shadow-sm mt-6">
                <h3 className="text-lg font-bold text-white mb-4">{translate('nutrition.analytics.trackedItems')}</h3>
                <div className="flex flex-wrap gap-2">
                    {OTHER_NUTRIENT_KEYS.map(key => (
                        <span key={key} className="px-3 py-1 bg-gray-800 text-gray-300 text-sm font-medium rounded-full">{translate(`nutrition.nutrients.${key}`)}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DietAlAnalytics;
