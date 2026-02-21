import React, { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Apple, Bookmark, RefreshCw, Bell } from 'lucide-react';
import { generateDietPlan } from '../../services/aiService.ts';
import { MealPlanSection } from '../../types.ts';

const DietAlHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6 font-['Poppins']">
    <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">{title}</h1>
        <Apple className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
    </div>
    <p className="text-gray-400 font-normal text-sm">{subtitle}</p>
  </div>
);

const NORMALIZE_MEAL_TYPE = (type: string): string => {
    const t = type.toLowerCase();
    if (t.includes('breakfast') || t.includes('petit') || t.includes('desayuno') || t.includes('إفطار') || t.includes('завтрак')) return 'breakfast';
    if (t.includes('lunch') || t.includes('déjeuner') || t.includes('comida') || t.includes('غداء') || t.includes('обед')) return 'lunch';
    if (t.includes('dinner') || t.includes('dîner') || t.includes('cena') || t.includes('عشاء') || t.includes('ужин')) return 'dinner';
    return 'snacks';
};

const MealPlanCard: React.FC<{
    mealType: string;
    title: string;
    calories: number;
    recipe: string;
    benefits: string;
    onSave: () => void;
    onReplace: () => void;
    onRemind: () => void;
}> = ({ mealType, title, calories, recipe, benefits, onSave, onReplace, onRemind }) => {
    const { translate } = useApp();

    return (
        <div className="bg-gray-900/40 p-5 rounded-3xl border border-gray-800 shadow-xl mb-6 font-['Poppins'] group hover:border-green-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">{mealType}</p>
                    <h3 className="text-lg font-black text-white mt-1 uppercase tracking-tight">{title}</h3>
                </div>
                <div className="bg-green-950/30 px-3 py-1 rounded-lg border border-green-600/20">
                    <p className="text-sm font-bold text-green-400">{calories} {translate('nutrition.unit.kcal')}</p>
                </div>
            </div>
            
            <div className="space-y-4 mb-6">
                <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{translate('nutrition.plan.recipe_label')}</p>
                    <p className="text-sm text-gray-300 leading-relaxed font-normal">{recipe}</p>
                </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{translate('nutrition.plan.benefits_label')}</p>
                    <p className="text-sm text-gray-400 leading-relaxed font-normal italic">{benefits}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-800/50">
                <button 
                  onClick={onSave}
                  className="flex flex-col items-center justify-center py-2 rounded-xl bg-gray-950 border border-gray-800 hover:border-green-500/50 hover:bg-green-950/10 transition-all active:scale-95"
                >
                    <Bookmark className="w-4 h-4 text-green-500 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{translate('nutrition.plan.btn.save')}</span>
                </button>
                <button 
                  onClick={onReplace}
                  className="flex flex-col items-center justify-center py-2 rounded-xl bg-gray-950 border border-gray-800 hover:border-yellow-500/50 hover:bg-yellow-950/10 transition-all active:scale-95"
                >
                    <RefreshCw className="w-4 h-4 text-yellow-500 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{translate('nutrition.plan.btn.replace')}</span>
                </button>
                <button 
                  onClick={onRemind}
                  className="flex flex-col items-center justify-center py-2 rounded-xl bg-gray-950 border border-gray-800 hover:border-blue-500/50 hover:bg-blue-950/10 transition-all active:scale-95"
                >
                    <Bell className="w-4 h-4 text-blue-500 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{translate('nutrition.plan.btn.remind')}</span>
                </button>
            </div>
        </div>
    );
};

const DietAlPlan: React.FC = () => {
    const { translate, profile, dietPlan, setDietPlan, setDailyMacros, language, planId, showStatus } = useApp();
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
                    calories: { goal: plan.macros.calories.goal, current: 0 },
                    protein: { goal: plan.macros.protein.goal, current: 0 },
                    fat: { goal: plan.macros.fat.goal, current: 0 },
                    carbs: { goal: plan.macros.carbs.goal, current: 0 },
                });
            }
        } catch (e) {
            console.error("Failed to generate diet plan:", e);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Use the exact keys from lib/translations.ts for default static plan
    const getStaticDefaultPlan = (): MealPlanSection[] => {
        return [
            { 
                mealType: 'breakfast', 
                title: translate('meal.breakfast.name'), 
                calories: 400, 
                recipe: translate('meal.breakfast.recipe'), 
                benefits: translate('meal.breakfast.benefits'),
                description: ''
            },
            { 
                mealType: 'lunch', 
                title: translate('meal.lunch.name'), 
                calories: 600, 
                recipe: translate('meal.lunch.recipe'), 
                benefits: translate('meal.lunch.benefits'),
                description: ''
            },
            { 
                mealType: 'snacks', 
                title: translate('meal.snacks.name'), 
                calories: 500, 
                recipe: translate('meal.snacks.recipe'), 
                benefits: translate('meal.snacks.benefits'),
                description: ''
            },
            { 
                mealType: 'dinner', 
                title: translate('meal.dinner.name'), 
                calories: 700, 
                recipe: translate('meal.dinner.recipe'), 
                benefits: translate('meal.dinner.benefits'),
                description: ''
            }
        ];
    };

    // React to language changes by refreshing the default static diet plan
    useEffect(() => {
        if (isPremium) {
            const defaultPlan = getStaticDefaultPlan();
            setDietPlan(defaultPlan);
        }
    }, [language]); // Refresh when language toggles

    const activePlan = dietPlan || [];

    return (
        <div className="space-y-6 animate-fadeIn font-['Poppins']">
            <DietAlHeader title={translate('nutrition.plan.title')} subtitle={translate('nutrition.plan.subtitle')} />

            {isLoading ? (
                 <div className="text-center py-20 bg-gray-900/20 rounded-[2.5rem] border border-gray-800 border-dashed">
                    <p className="text-green-500 animate-pulse font-black uppercase tracking-widest text-xs">
                        GENERATING AI PROTOCOL...
                    </p>
                </div>
            ) : (
                <div className="space-y-4 pb-20">
                    {activePlan.map((meal, idx) => (
                        <MealPlanCard 
                            key={idx}
                            mealType={translate(`meal_type.${NORMALIZE_MEAL_TYPE(meal.mealType)}`)}
                            title={meal.title}
                            calories={meal.calories}
                            recipe={meal.recipe}
                            benefits={meal.benefits}
                            onSave={() => showStatus("Meal pattern locked.")}
                            onReplace={() => handleGeneratePlan()}
                            onRemind={() => showStatus("Biological reminder scheduled.")}
                        />
                    ))}
                    
                    {activePlan.length > 0 && (
                        <button 
                            onClick={handleGeneratePlan}
                            className="w-full py-4 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-800 transition-all group"
                        >
                            <RefreshCw size={16} className="text-purple-400 group-hover:rotate-180 transition-transform duration-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Regenerate AI Protocol</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default DietAlPlan;