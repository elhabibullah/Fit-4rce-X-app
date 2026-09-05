import React, { useState, useRef } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Apple, Camera, CheckCircle, Clock, ChevronLeft, Sparkles } from 'lucide-react';
import { analyzeMealFromText, analyzeMealFromImage } from '../../services/aiService.ts';
import { Meal, MealType } from '../../types.ts';

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
          <Apple className="w-7 h-7 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
      </div>
      <h1 className="text-2xl font-black text-white uppercase tracking-tight">{title}</h1>
      <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mt-0.5">{subtitle}</p>
    </div>
  );
};

const HistoryItem: React.FC<{ meal: Meal }> = ({ meal }) => {
    const { translate } = useApp();
    return (
        <div className="flex justify-between items-center py-4 font-['Poppins']">
            <div>
                <p className="font-bold text-white text-sm uppercase tracking-wide">{meal.name}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                        {meal.mealType ? translate(`meal_type.${meal.mealType}`) : translate('meal_type.snacks')}
                    </span>
                    <p className="text-[10px] text-gray-500 flex items-center font-bold uppercase">
                        <Clock size={12} className="mr-1 text-green-500"/>
                        {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-bold text-white text-sm">{meal.calories} kcal</p>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-tighter">P:{meal.protein} C:{meal.carbs} F:{meal.fat}</p>
            </div>
        </div>
    );
};

const DietAlLog: React.FC = () => {
  const { translate, logMeal, nutritionHistory, setNutritionTab } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<MealType>('breakfast');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'Today' | 'Yesterday' | 'History'>('Today');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async (type: 'text' | 'image', data?: string | File) => {
    setIsLoading(true);
    setStatus('');
    try {
        let result: Meal | undefined | null;
        if (type === 'text' && typeof data === 'string') {
            result = await analyzeMealFromText(data);
        } else if (type === 'image' && data instanceof File) {
            const reader = new FileReader();
            reader.readAsDataURL(data);
            await new Promise<void>((resolve) => {
                reader.onload = async () => {
                    if (typeof reader.result === 'string') {
                        const base64 = reader.result.split(',')[1];
                        result = await analyzeMealFromImage(base64, data.type);
                    }
                    resolve();
                };
            });
        }
        
        if(result) {
            result.mealType = selectedCategory;
            logMeal(result);
            setPrompt('');
            setStatus(`${result.name} (${result.calories} kcal) ${translate('nutrition.log.loggedSuccess')} ${translate(`meal_type.${selectedCategory}`)} !`);
            setTimeout(() => setStatus(''), 4000);
        }
    } catch (error) {
        console.error("Analysis failed:", error);
        setStatus(translate('nutrition.log.analysisError'));
        setTimeout(() => setStatus(''), 4000);
    } finally {
        setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleAnalyze('image', file);
  };
  
  const handlePhotoClick = () => fileInputRef.current?.click();

  const filterHistory = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    switch(activeTab) {
        case 'Today': return nutritionHistory.filter(m => m.timestamp >= todayStart);
        case 'Yesterday': return nutritionHistory.filter(m => m.timestamp >= yesterdayStart && m.timestamp < todayStart);
        case 'History':
        default: return nutritionHistory.filter(m => m.timestamp < yesterdayStart);
    }
  };

  const displayedHistory = filterHistory();

  const categories: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

  return (
    <div className="space-y-6 animate-fadeIn font-['Poppins'] pb-28">
      <DietAlHeader 
        title={translate('nutrition.log.title')} 
        subtitle={translate('nutrition.log.aiName')} 
        onBack={() => setNutritionTab('dashboard')}
      />
      
      {status && (
        <div className="bg-green-950/50 border border-green-500 text-green-400 px-4 py-3 rounded-2xl flex items-center mb-4 shadow-lg animate-fadeIn" role="alert">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">{status}</span>
        </div>
      )}

      {/* MEAL CATEGORY SELECTOR */}
      <div className="bg-gray-900/40 p-4 rounded-2xl border border-gray-800 shadow-md">
        <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">{translate('nutrition.log.chooseCategory')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map((cat) => (
                <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`py-2 px-1 rounded-xl text-center font-bold text-xs uppercase tracking-wider transition-all truncate ${
                        selectedCategory === cat
                            ? 'bg-green-600 text-black shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                            : 'bg-black/60 border border-gray-800 text-gray-400 hover:text-white'
                    }`}
                >
                    {translate(`meal_type.${cat}`)}
                </button>
            ))}
        </div>
      </div>

      <div className="bg-gray-900/40 p-5 rounded-[2rem] border border-gray-800 shadow-xl backdrop-blur-md">
        {/* TEXT SECTION */}
        <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{translate('nutrition.log.describe')}</p>
                <span className="text-[9px] font-bold text-green-400 flex items-center gap-1">
                    <Sparkles size={11} />
                    IA Gemini Vision/Text
                </span>
            </div>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={translate('nutrition.log.placeholder')}
                className="w-full bg-black/60 border border-gray-800 rounded-2xl p-4 text-white text-sm focus:ring-1 focus:ring-green-500 focus:outline-none h-28 resize-none mb-4 shadow-inner placeholder:text-gray-600"
            />
            <button 
                onClick={() => handleAnalyze('text', prompt)} 
                disabled={isLoading || !prompt.trim()} 
                className="w-full bg-green-600 hover:bg-green-500 text-black font-black py-4 rounded-xl disabled:opacity-30 transition-all shadow-lg text-xs uppercase tracking-widest active:scale-95"
            >
                {isLoading ? translate('processing') : `${translate('nutrition.log.analyzeAndLog')} (${translate(`meal_type.${selectedCategory}`)})`}
            </button>
        </section>

        {/* PHOTO SECTION */}
        <section className="pt-6 border-t border-gray-800/50">
             <p className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-[0.2em]">{translate('nutrition.log.photoSection')}</p>
             <button 
                onClick={handlePhotoClick} 
                disabled={isLoading} 
                className="w-full bg-gray-950 hover:bg-gray-800 text-white font-black py-4 rounded-xl disabled:opacity-30 transition-all border border-gray-800 hover:border-green-500/50 flex items-center justify-center text-xs uppercase tracking-widest active:scale-95"
             >
                <Camera size={18} className="mr-2 text-green-500"/>
                {translate('nutrition.log.photoButton')}
            </button>
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </section>
      </div>

       <div className="bg-gray-900/20 p-5 rounded-[2rem] border border-gray-800 shadow-lg">
            <h3 className="text-xs font-black text-white mb-6 uppercase tracking-[0.3em] text-center">{translate('nutrition.log.historyTitle')}</h3>
            <div className="flex border-b border-gray-800 mb-4 overflow-x-auto no-scrollbar gap-1">
                {(['Today', 'Yesterday', 'History'] as const).map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        className={`flex-1 min-w-[70px] pb-3 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap text-center ${activeTab === tab ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-500 border-b-2 border-transparent hover:text-gray-300'}`}
                    >
                        {translate(`nutrition.log.${tab.toLowerCase()}`)}
                    </button>
                ))}
            </div>
            <div className="divide-y divide-gray-800/50">
                {displayedHistory.length > 0 ? (
                    displayedHistory.map((meal, idx) => <HistoryItem key={idx} meal={meal} />)
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">{translate('nutrition.log.noEntries')}</p>
                    </div>
                )}
            </div>
       </div>
    </div>
  );
};

export default DietAlLog;