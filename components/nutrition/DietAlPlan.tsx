
import React, { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Apple, Bookmark, RefreshCw, Bell, Lock } from 'lucide-react';
// FIX: Corrected import path from geminiService to aiService
import { generateDietPlan } from '../../services/aiService.ts';

const DietAlHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <Apple className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
    </div>
    <p className="text-gray-400">{subtitle}</p>
  </div>
);


const MealPlanCard: React.FC<{
    mealType: string;
    title: string;
    calories: number;
    recipe: string;
    benefits: string;
}> = ({ mealType, title, calories, recipe, benefits }) => {
    const { translate } = useApp();

    return (
        <div className="bg-black p-4 rounded-xl border border-gray-800 shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-gray-400 uppercase">{mealType}</p>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                </div>
                <p className="text-lg font-bold text-green-500">{calories} kcal</p>
            </div>
            <div className="mt-4">
                <p className="text-sm font-bold text-gray-200 mb-1">{translate('nutrition.plan.recipe')}</p>
                <p className="text-sm text-gray-300">{recipe}</p>
            </div>
             <div className="mt-4">
                <p className="text-sm font-bold text-gray-200 mb-1">{translate('nutrition.plan.benefits')}</p>
                <p className="text-sm text-gray-300">{benefits}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                <button onClick={() => alert(translate('nutrition.plan.saveAlert'))} className="bg-gray-800 text-gray-300 p-2 rounded-lg flex items-center justify-center font-medium transition-colors hover:bg-gray-700 active:scale-95"><Bookmark size={14} className="mr-1"/>{translate('nutrition.plan.saveMeal')}</button>
                <button onClick={() => alert(translate('nutrition.plan.replaceAlert'))} className="bg-gray-800 text-gray-300 p-2 rounded-lg flex items-center justify-center font-medium transition-colors hover:bg-gray-700 active:scale-95"><RefreshCw size={14} className="mr-1"/>{translate('nutrition.plan.replaceItem')}</button>
                <button onClick={() => alert(translate('nutrition.plan.reminderAlert'))} className="bg-gray-800 text-gray-300 p-2 rounded-lg flex items-center justify-center font-medium transition-colors hover:bg-gray-700 active:scale-95"><Bell size={14} className="mr-1"/>{translate('nutrition.plan.addReminder')}</button>
            </div>
        </div>
    );
};

const DietAlPlan: React.FC = () => {
    const { translate, profile, dietPlan, setDietPlan, setDailyMacros, language, planId } = useApp();
    const [isLoading, setIsLoading] = useState(false);

    const isPremium = planId === 'premium';

    const handleGeneratePlan = async () => {
        if (!profile || !language || !isPremium) return;
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
    };
    
    // Auto-generate plan on first load for premium users if they don't have one
    useEffect(() => {
        if (isPremium && !dietPlan && !isLoading) {
            handleGeneratePlan();
        }
    }, [isPremium, dietPlan, isLoading]);

    return (
        <div className="space-y-6 animate-fadeIn">
            <DietAlHeader title={translate('nutrition.plan.title')} subtitle={translate('nutrition.plan.subtitle')} />

            {!dietPlan && (
                 <div className="text-center py-10">
                    <p className="text-gray-400 mb-4">{isPremium ? translate('nutrition.plan.noPlan') : translate('nutrition.plan.premiumFeature')}</p>
                    <button onClick={handleGeneratePlan} disabled={isLoading || !isPremium} className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 flex items-center justify-center mx-auto">
                        {isLoading ? translate('nutrition.plan.generating') : translate('nutrition.plan.generateButton')}
                        {!isPremium && <Lock size={16} className="ml-2"/>}
                    </button>
                </div>
            )}
            
            {isLoading && !dietPlan && <p className="text-center text-gray-400">{translate('nutrition.plan.generating')}</p>}

            {dietPlan && (
                <div className="space-y-4">
                    {dietPlan.map(meal => (
                        <MealPlanCard 
                            key={meal.title}
                            mealType={translate(`meal_type.${meal.mealType.toLowerCase()}`)}
                            title={meal.title}
                            calories={meal.calories}
                            recipe={meal.recipe}
                            benefits={meal.benefits}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DietAlPlan;
