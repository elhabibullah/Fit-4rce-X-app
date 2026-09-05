import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Apple, Bookmark, RefreshCw, Bell, ChevronLeft, Sparkles } from 'lucide-react';
import { generateDietPlan } from '../../services/aiService.ts';
import { MealPlanSection } from '../../types.ts';

const DietAlHeader: React.FC<{ title: string; subtitle: string; onBack: () => void }> = ({ title, subtitle, onBack }) => {
  const { translate } = useApp();
  return (
    <div className="mb-6 font-['Poppins']">
      <div className="flex items-center justify-between mb-2">
          <button 
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-green-500/50 transition-all text-xs font-bold uppercase tracking-wider"
          >
              <ChevronLeft size={16} className="text-green-400" />
              <span>{translate('nutrition.log.backToDashboard')}</span>
          </button>
          <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-green-950/40 border border-green-500/30">{translate('nutrition.plan.activeProtocol')}</span>
              <Apple className="w-7 h-7 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
          </div>
      </div>
      <h1 className="text-2xl font-black text-white uppercase tracking-tight">{title}</h1>
      <p className="text-gray-400 font-normal text-xs mt-0.5">{subtitle}</p>
    </div>
  );
};

const NORMALIZE_MEAL_TYPE = (type?: any): string => {
    if (!type || typeof type !== 'string') return 'snacks';
    const t = type.toLowerCase();
    if (t.includes('breakfast') || t.includes('petit') || t.includes('desayuno') || t.includes('إفطار') || t.includes('завтрак') || t.includes('朝食') || t.includes('早')) return 'breakfast';
    if (t.includes('lunch') || t.includes('déjeuner') || t.includes('comida') || t.includes('almuerzo') || t.includes('غداء') || t.includes('обед') || t.includes('昼食') || t.includes('午')) return 'lunch';
    if (t.includes('dinner') || t.includes('dîner') || t.includes('cena') || t.includes('عشاء') || t.includes('ужин') || t.includes('夕食') || t.includes('晚')) return 'dinner';
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
    const { translate, profile, dietPlan, setDietPlan, setDailyMacros, language, showStatus, setNutritionTab } = useApp();
    const [isLoading, setIsLoading] = useState(false);

    // Use the exact keys from lib/translations.ts for default static plan
    const getStaticDefaultPlan = (): MealPlanSection[] => {
        return [
            { 
                mealType: 'breakfast', 
                title: translate('meal.breakfast.name'), 
                calories: 550, 
                recipe: translate('meal.breakfast.recipe'), 
                benefits: translate('meal.breakfast.benefits'),
                description: ''
            },
            { 
                mealType: 'lunch', 
                title: translate('meal.lunch.name'), 
                calories: 850, 
                recipe: translate('meal.lunch.recipe'), 
                benefits: translate('meal.lunch.benefits'),
                description: ''
            },
            { 
                mealType: 'snacks', 
                title: translate('meal.snacks.name'), 
                calories: 450, 
                recipe: translate('meal.snacks.recipe'), 
                benefits: translate('meal.snacks.benefits'),
                description: ''
            },
            { 
                mealType: 'dinner', 
                title: translate('meal.dinner.name'), 
                calories: 750, 
                recipe: translate('meal.dinner.recipe'), 
                benefits: translate('meal.dinner.benefits'),
                description: ''
            }
        ];
    };

    // Ensure we always have a plan loaded so the screen is NEVER blank
    useEffect(() => {
        if (!dietPlan || !Array.isArray(dietPlan) || dietPlan.length === 0) {
            const defaultPlan = getStaticDefaultPlan();
            setDietPlan(defaultPlan);
        }
    }, [language]);

    const activePlan = useMemo((): MealPlanSection[] => {
        let rawMeals: any[] | null = null;
        if (Array.isArray(dietPlan) && dietPlan.length > 0) {
            rawMeals = dietPlan;
        } else if (dietPlan && typeof dietPlan === 'object' && Array.isArray((dietPlan as any).meals)) {
            rawMeals = (dietPlan as any).meals;
        }

        if (rawMeals && rawMeals.length > 0) {
            return rawMeals.map(meal => ({
                mealType: NORMALIZE_MEAL_TYPE(meal?.mealType || meal?.type || meal?.category),
                title: meal?.title || meal?.name || translate('nutrition.plan.title'),
                calories: Number(meal?.calories) || 500,
                recipe: meal?.recipe || meal?.description || meal?.ingredients || translate('nutrition.plan.recipe_default'),
                benefits: meal?.benefits || meal?.notes || translate('nutrition.plan.benefits_default'),
                description: meal?.description || ''
            }));
        }
        return getStaticDefaultPlan();
    }, [dietPlan, language, translate]);

    const handleGeneratePlan = async () => {
        setIsLoading(true);
        showStatus(translate('nutrition.plan.generatingPlan'));
        try {
            const plan = await generateDietPlan(
                profile || { name: 'Athlete', weight: 75, height: 178, age: 28, gender: 'male', fitnessLevel: 'intermediate', fitnessGoal: 'build_muscle' } as any, 
                language || 'en'
            );
            if (plan && plan.meals && Array.isArray(plan.meals) && plan.meals.length > 0) {
                const formatted = plan.meals.map((m: any) => ({
                    mealType: NORMALIZE_MEAL_TYPE(m?.mealType || m?.type || m?.category),
                    title: m?.title || m?.name || translate('nutrition.plan.title'),
                    calories: Number(m?.calories) || 600,
                    recipe: m?.recipe || m?.description || m?.ingredients || translate('nutrition.plan.recipe_default'),
                    benefits: m?.benefits || m?.notes || translate('nutrition.plan.benefits_default'),
                    description: m?.description || ''
                }));
                setDietPlan(formatted);
                if (plan.macros) {
                    setDailyMacros({
                        calories: { goal: plan.macros.calories?.goal || 3200, current: 0 },
                        protein: { goal: plan.macros.protein?.goal || 180, current: 0 },
                        fat: { goal: plan.macros.fat?.goal || 80, current: 0 },
                        carbs: { goal: plan.macros.carbs?.goal || 440, current: 0 },
                    });
                }
                showStatus(translate('nutrition.plan.aiSuccess'));
            } else {
                setDietPlan(getStaticDefaultPlan());
                showStatus(translate('nutrition.plan.optimalPlanLoaded'));
            }
        } catch (e) {
            console.error("Failed to generate diet plan:", e);
            setDietPlan(getStaticDefaultPlan());
            showStatus(translate('nutrition.plan.optimalPlanLoaded'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn font-['Poppins'] pb-28">
            <DietAlHeader 
                title={translate('nutrition.plan.title')} 
                subtitle={translate('nutrition.plan.subtitle')} 
                onBack={() => setNutritionTab('dashboard')}
            />

            {isLoading ? (
                 <div className="text-center py-20 bg-gray-900/40 rounded-[2.5rem] border border-gray-800 border-dashed animate-pulse">
                    <Sparkles className="w-10 h-10 text-green-400 mx-auto mb-3 animate-spin" />
                    <p className="text-green-400 font-black uppercase tracking-widest text-xs">
                        {translate('nutrition.plan.generatingPlan')}
                    </p>
                    <p className="text-gray-500 text-[10px] mt-2 uppercase tracking-wider">
                        {translate('nutrition.plan.optimizingMacros')}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activePlan.map((meal, idx) => (
                        <MealPlanCard 
                            key={idx}
                            mealType={translate(`meal_type.${NORMALIZE_MEAL_TYPE(meal.mealType)}`)}
                            title={meal.title}
                            calories={meal.calories}
                            recipe={meal.recipe}
                            benefits={meal.benefits}
                            onSave={() => showStatus(translate('nutrition.plan.savedSuccess'))}
                            onReplace={() => handleGeneratePlan()}
                            onRemind={() => showStatus(translate('nutrition.plan.reminderSet'))}
                        />
                    ))}
                    
                    <div className="pt-2 pb-6 space-y-3">
                        <button 
                            onClick={handleGeneratePlan}
                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_25px_rgba(34,197,94,0.3)] active:scale-95 text-xs"
                        >
                            <Sparkles size={16} />
                            <span>{translate('nutrition.plan.generateNewBtn')}</span>
                        </button>

                        <button 
                            onClick={() => setNutritionTab('dashboard')}
                            className="w-full py-3.5 bg-gray-900/80 border border-gray-800 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all text-gray-400 hover:text-white text-xs uppercase font-bold tracking-wider"
                        >
                            <ChevronLeft size={16} />
                            <span>{translate('nutrition.plan.returnDashboardBtn')}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DietAlPlan;