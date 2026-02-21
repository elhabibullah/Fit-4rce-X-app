import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Share2, Flame, Watch, ArrowUpRight } from 'lucide-react';
import { generateDietPlan } from '../../services/aiService.ts';
import { Meal, MealType } from '../../types.ts';

const MacroRing: React.FC<{ label: string; current: number; goal: number; color: string; unit?: string }> = ({ label, current, goal, color, unit = 'g' }) => {
    const percentage = goal > 0 ? (current / goal) * 100 : 0;
    const strokeDash = 2 * Math.PI * 15.9155;

    return (
        <div className="flex flex-col items-center font-['Poppins']">
            <div className="relative w-20 h-20">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <circle className="text-gray-800" stroke="currentColor" strokeWidth="3" fill="none" r="15.9155" cx="18" cy="18" />
                    <circle
                        stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"
                        strokeDasharray={`${(Math.min(percentage, 100) / 100) * strokeDash}, ${strokeDash}`}
                        r="15.9155" cx="18" cy="18"
                        style={{ color, transition: 'stroke-dasharray 0.8s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-black text-white">{Math.round(current)}</span>
                </div>
            </div>
            <p className="mt-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-[9px] text-gray-500 font-mono">{current > goal ? goal : Math.round(current)} / {goal}{unit}</p>
        </div>
    );
};

const MealCard: React.FC<{ mealType: MealType; meals: Meal[] }> = ({ mealType, meals }) => {
    const { translate } = useApp();
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

    return (
        <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-800 shadow-lg backdrop-blur-sm font-['Poppins'] group hover:border-green-500/30 transition-all">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-white uppercase text-[10px] tracking-[0.2em]">{translate(`meal_type.${mealType}`)}</h3>
                <ArrowUpRight className="w-3 h-3 text-gray-700 group-hover:text-green-500" />
            </div>
            {meals.length > 0 ? (
                <div className="space-y-1.5">
                    {meals.map((meal, index) => (
                         <div key={index} className="flex justify-between items-center text-[11px] text-gray-300 font-normal">
                             <span className="truncate pr-2">{meal.name}</span>
                             <span className="font-mono text-gray-500">{meal.calories}</span>
                         </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-gray-800/50 flex justify-between">
                        <span className="text-[8px] text-gray-500 font-bold uppercase">Total</span>
                        <span className="text-xs font-black text-green-400">{totalCalories} {translate('nutrition.unit.kcal')}</span>
                    </div>
                </div>
            ) : (
                <p className="text-[9px] text-gray-600 mt-2 font-bold uppercase tracking-widest italic opacity-50">{translate('nutrition.log.noEntries')}</p>
            )}
        </div>
    );
}

const DietAlDashboard: React.FC = () => {
    const { translate, profile, dailyMacros, setDailyMacros, setDietPlan, nutritionHistory, language, planId, isDeviceConnected, deviceMetrics, openDeviceModal } = useApp();
    const [isLoading, setIsLoading] = useState(false);

    // EXACT GOALS AS REQUESTED
    const calorieGoal = 3200;
    const pGoal = 180;
    const cGoal = 440;
    const fGoal = 80;

    useEffect(() => {
        const fetchPlan = async () => {
            if (!dailyMacros && profile && language && planId === 'premium') {
                setIsLoading(true);
                try {
                    const plan = await generateDietPlan(profile, language);
                    if (plan) {
                        setDietPlan(plan.meals);
                        setDailyMacros({
                            calories: { goal: calorieGoal, current: 0 },
                            protein: { goal: pGoal, current: 0 },
                            fat: { goal: fGoal, current: 0 },
                            carbs: { goal: cGoal, current: 0 },
                        });
                    }
                } catch (e) {
                    console.error("Failed to generate diet plan:", e);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchPlan();
    }, [dailyMacros, profile, language, setDailyMacros, setDietPlan, planId]);

    const categorizedMeals = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaysMeals = nutritionHistory.filter(m => m.timestamp >= today.getTime());

        return {
            breakfast: todaysMeals.filter(m => m.mealType === 'breakfast'),
            lunch: todaysMeals.filter(m => m.mealType === 'lunch'),
            dinner: todaysMeals.filter(m => m.mealType === 'dinner'),
            snacks: todaysMeals.filter(m => m.mealType === 'snacks'),
        };
    }, [nutritionHistory]);
    
    const handleShare = async () => {
        if (!dailyMacros) return;
        const shareText = `My metabolic progress for today: ${Math.round(dailyMacros.calories.current)} / ${calorieGoal} ${translate('nutrition.unit.kcal')} consumed on Fit-4rce-X.`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'F4X Nutrition Pulse',
                    text: shareText,
                });
            }
        } catch (err) { console.error('Share failed:', err); }
    };

    const calorieProgress = dailyMacros ? (dailyMacros.calories.current / calorieGoal) * 100 : 0;
    
    return (
        <div className="space-y-6 animate-fadeIn font-['Poppins'] pb-20">
            <div className="flex justify-between items-center px-1">
                <div>
                    <h2 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mb-1">{translate('nutrition.hub.title')}</h2>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{translate('nutrition.dashboard.title')}</h1>
                </div>
                <button onClick={handleShare} className="p-3 bg-gray-900 rounded-full border border-gray-800 text-gray-400 hover:text-white transition-colors">
                    <Share2 size={18} />
                </button>
            </div>

            <div className="px-1">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{translate('nutrition.dashboard.dailyIntake')}</p>
            </div>

            <div className="bg-black/40 p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <Flame className="text-orange-500 w-5 h-5 animate-pulse" />
                </div>
                <div className="text-center">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4">{translate('nutrition.dashboard.consumed')}</p>
                    <div className="relative inline-block">
                         <div className="text-6xl font-black text-white tracking-tighter">{Math.round(dailyMacros?.calories.current || 0)}</div>
                         <div className="text-[10px] font-bold text-gray-600 uppercase mt-1 tracking-widest">
                            {language === 'ru' || language === 'ja' || language === 'zh' 
                                ? translate('nutrition.dashboard.of')
                                : `${translate('nutrition.dashboard.of')} ${calorieGoal} ${translate('nutrition.unit.kcal')}`
                            }
                         </div>
                    </div>
                    <div className="w-full bg-gray-900 h-1.5 rounded-full mt-8 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_#22c55e]" style={{ width: `${Math.min(calorieProgress, 100)}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <MacroRing label={translate('nutrition.dashboard.protein')} current={dailyMacros?.protein.current || 0} goal={pGoal} color="#f59e0b" />
                <MacroRing label={translate('nutrition.dashboard.carbs')} current={dailyMacros?.carbs.current || 0} goal={cGoal} color="#22c55e" />
                <MacroRing label={translate('nutrition.dashboard.fat')} current={dailyMacros?.fat.current || 0} goal={fGoal} color="#3b82f6" />
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4">
                <MealCard mealType="breakfast" meals={categorizedMeals.breakfast} />
                <MealCard mealType="lunch" meals={categorizedMeals.lunch} />
                <MealCard mealType="dinner" meals={categorizedMeals.dinner} />
                <MealCard mealType="snacks" meals={categorizedMeals.snacks} />
            </div>

            <div className="pt-4 pb-4">
                {isDeviceConnected ? (
                    <div className="bg-purple-900/10 border border-purple-500/30 p-5 rounded-3xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-950 flex items-center justify-center shadow-lg border border-purple-500/50">
                            <Watch className="text-purple-400 w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Active Burn</p>
                            <p className="text-xl font-black text-white font-mono">{Math.floor(deviceMetrics.caloriesBurned)} <span className="text-[10px] text-gray-500">{translate('nutrition.unit.kcal').toUpperCase()}</span></p>
                        </div>
                    </div>
                ) : (
                    <button onClick={openDeviceModal} className="w-full py-4 border border-dashed border-gray-800 rounded-2xl text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] hover:text-gray-400 hover:border-gray-600 transition-all">
                        {translate('device.connectPrompt')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default DietAlDashboard;