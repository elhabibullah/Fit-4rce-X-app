
import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Apple, Share2, Flame, Watch } from 'lucide-react';
// FIX: Corrected import path from geminiService to aiService
import { generateDietPlan } from '../../services/aiService.ts';
import { Meal, MealType } from '../../types.ts';

const MacroRing: React.FC<{ label: string; current: number; goal: number; color: string }> = ({ label, current, goal, color }) => {
    const percentage = goal > 0 ? (current / goal) * 100 : 0;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-20 h-20">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-gray-700" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path
                        stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"
                        strokeDasharray={`${percentage}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        style={{ color }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{Math.round(current)}</span>
                </div>
            </div>
            <p className="mt-2 text-xs font-bold text-gray-200">{label}</p>
            <p className="text-xs text-gray-400">{goal}g</p>
        </div>
    );
};

const MealCard: React.FC<{ mealType: MealType; meals: Meal[] }> = ({ mealType, meals }) => {
    const { translate } = useApp();
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

    return (
        <div className="bg-black p-4 rounded-xl border border-gray-800 shadow-sm">
            <h3 className="font-bold text-white">{translate(`meal_type.${mealType}`)}</h3>
            {meals.length > 0 ? (
                <div className="mt-2">
                    {meals.map((meal, index) => (
                         <p key={index} className="text-sm text-gray-300 truncate">{meal.name}</p>
                    ))}
                    <p className="text-sm font-bold text-right text-white mt-1">{totalCalories} kcal</p>
                </div>
            ) : (
                <p className="text-sm text-gray-400 mt-2">{translate('nutrition.log.noEntries')}</p>
            )}
        </div>
    );
}

const DietAlDashboard: React.FC = () => {
    const { translate, profile, dailyMacros, setDailyMacros, setDietPlan, nutritionHistory, language, planId, isDeviceConnected, deviceMetrics, openDeviceModal } = useApp();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchPlan = async () => {
            if (!dailyMacros && profile && language && planId === 'premium') {
                setIsLoading(true);
                try {
                    const plan = await generateDietPlan(profile, language);
                    if (plan) {
                        setDietPlan(plan.meals);
                        setDailyMacros({
                            calories: { ...plan.macros.calories, current: 0 },
                            protein: { ...plan.macros.protein, current: 0 },
                            fat: { ...plan.macros.fat, current: 0 },
                            carbs: { ...plan.macros.carbs, current: 0 },
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
        const shareText = translate('nutrition.dashboard.share.text', {
            calories: Math.round(dailyMacros.calories.current),
            goal: dailyMacros.calories.goal
        });
        try {
            if (navigator.share) {
                await navigator.share({
                    title: translate('nutrition.dashboard.share.title'),
                    text: shareText,
                });
            } else {
                alert(translate('nutrition.share.notSupported'));
            }
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    const calorieProgress = dailyMacros ? (dailyMacros.calories.current / dailyMacros.calories.goal) * 100 : 0;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">{translate('nutrition.dashboard.title')}</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={handleShare} className="text-gray-400 hover:text-white" aria-label={translate('profile.share.title')}>
                            <Share2 className="w-6 h-6" />
                        </button>
                        <Apple className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
                    </div>
                </div>
                <p className="text-gray-400">{translate('nutrition.dashboard.subtitle')}</p>
            </div>
            
            <div className="bg-black p-4 rounded-2xl border border-gray-800 shadow-sm flex items-center justify-between cursor-pointer" onClick={() => !isDeviceConnected && openDeviceModal()}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isDeviceConnected ? 'bg-orange-500/20' : 'bg-gray-800'}`}>
                        <Flame className={`w-6 h-6 ${isDeviceConnected ? 'text-orange-500' : 'text-gray-500'}`} />
                    </div>
                    <div>
                         <p className="font-bold text-white">{translate('device.nutrition.activeBurn')}</p>
                         {isDeviceConnected ? (
                             <p className="text-xs text-gray-400">{translate('device.status.connected')}</p>
                         ) : (
                             <p className="text-xs text-gray-500">{translate('device.connectPrompt')}</p>
                         )}
                    </div>
                </div>
                <div className="text-right">
                    {isDeviceConnected ? (
                        <p className="text-2xl font-bold text-white">{Math.floor(deviceMetrics.caloriesBurned)} <span className="text-xs text-gray-400">kcal</span></p>
                    ) : (
                        <Watch className="w-6 h-6 text-gray-600" />
                    )}
                </div>
            </div>

            {isLoading && !dailyMacros && <p className="text-center text-gray-400">{translate('nutrition.plan.generating')}</p>}
            
            {dailyMacros && (
                <>
                    <div className="bg-black p-6 rounded-2xl border border-gray-800 shadow-sm text-center">
                        <div className="relative w-40 h-40 mx-auto">
                            <svg className="w-full h-full" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                                <path className="text-gray-700" stroke="currentColor" strokeWidth="2" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path
                                    className="text-green-500"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"
                                    strokeDasharray={`${calorieProgress}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold text-white">{Math.round(dailyMacros.calories.current)}</span>
                                <span className="text-sm text-gray-300">{translate('nutrition.dashboard.consumed')}</span>
                                <span className="text-xs text-gray-400">{translate('nutrition.dashboard.of')} {dailyMacros.calories.goal} kcal</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <MacroRing label={translate('nutrition.dashboard.protein')} current={dailyMacros.protein.current} goal={dailyMacros.protein.goal} color="#f59e0b" />
                        <MacroRing label={translate('nutrition.dashboard.carbs')} current={dailyMacros.carbs.current} goal={dailyMacros.carbs.goal} color="#22c55e" />
                        <MacroRing label={translate('nutrition.dashboard.fat')} current={dailyMacros.fat.current} goal={dailyMacros.fat.goal} color="#3b82f6" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MealCard mealType="breakfast" meals={categorizedMeals.breakfast} />
                        <MealCard mealType="lunch" meals={categorizedMeals.lunch} />
                        <MealCard mealType="dinner" meals={categorizedMeals.dinner} />
                        <MealCard mealType="snacks" meals={categorizedMeals.snacks} />
                    </div>
                </>
            )}
        </div>
    );
};

export default DietAlDashboard;
