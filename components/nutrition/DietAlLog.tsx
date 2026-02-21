import React, { useState, useRef } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Apple, Camera, CheckCircle, Clock } from 'lucide-react';
import { analyzeMealFromText, analyzeMealFromImage } from '../../services/aiService.ts';
import { Meal } from '../../types.ts';

const DietAlHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6 font-['Poppins']">
    <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">{title}</h1>
        <Apple className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
    </div>
    <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mt-1">{subtitle}</p>
  </div>
);

const HistoryItem: React.FC<{ meal: Meal }> = ({ meal }) => {
    return (
        <div className="flex justify-between items-center py-4 font-['Poppins']">
            <div>
                <p className="font-bold text-white text-sm uppercase tracking-wide">{meal.name}</p>
                <p className="text-[10px] text-gray-500 flex items-center font-bold uppercase mt-1">
                    <Clock size={12} className="mr-1 text-green-500"/>
                    {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
            <div className="text-right">
                <p className="font-bold text-white text-sm">{meal.calories} kcal</p>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-tighter">P:{meal.protein} C:{meal.carbs} F:{meal.fat}</p>
            </div>
        </div>
    );
}

const DietAlLog: React.FC = () => {
  const { translate, logMeal, nutritionHistory } = useApp();
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
            logMeal(result);
            setPrompt('');
            setStatus(`${result.name} logged successfully!`);
            setTimeout(() => setStatus(''), 3000);
        }
    } catch (error) {
        console.error("Analysis failed:", error);
        setStatus('Analysis Failed');
        setTimeout(() => setStatus(''), 3000);
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

  return (
    <div className="space-y-6 animate-fadeIn font-['Poppins']">
      <DietAlHeader title={translate('nutrition.log.title')} subtitle={translate('nutrition.log.aiName')} />
      
      {status && (
        <div className="bg-green-950/30 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl flex items-center mb-4" role="alert">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span className="text-xs font-bold uppercase tracking-widest">{status}</span>
        </div>
      )}

      <div className="bg-gray-900/40 p-5 rounded-[2rem] border border-gray-800 shadow-xl backdrop-blur-md">
        {/* TEXT SECTION */}
        <section className="mb-6">
            <p className="text-[10px] font-black text-gray-500 mb-4 uppercase tracking-[0.2em]">{translate('nutrition.log.describe')}</p>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={translate('nutrition.log.placeholder')}
                className="w-full bg-black/60 border border-gray-800 rounded-2xl p-4 text-white text-sm focus:ring-1 focus:ring-green-500 focus:outline-none h-28 resize-none mb-4 shadow-inner"
            />
            <button onClick={() => handleAnalyze('text', prompt)} disabled={isLoading || !prompt} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl disabled:opacity-30 transition-all shadow-lg text-[10px] uppercase tracking-widest">
                {isLoading ? translate('processing') : translate('nutrition.log.analyzeButton')}
            </button>
        </section>

        {/* PHOTO SECTION */}
        <section className="pt-6 border-t border-gray-800/50">
             <p className="text-[10px] font-black text-gray-500 mb-4 uppercase tracking-[0.2em]">{translate('nutrition.log.photoSection')}</p>
             <button onClick={handlePhotoClick} disabled={isLoading} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-black py-4 rounded-xl disabled:opacity-30 transition-all border border-gray-700 flex items-center justify-center text-[10px] uppercase tracking-widest">
                <Camera size={18} className="mr-2 text-green-500"/>
                {translate('nutrition.log.photoButton')}
            </button>
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </section>
      </div>

       <div className="bg-gray-900/20 p-5 rounded-[2rem] border border-gray-800 shadow-lg">
            <h3 className="text-xs font-black text-white mb-6 uppercase tracking-[0.3em] text-center">{translate('nutrition.log.historyTitle')}</h3>
            <div className="flex border-b border-gray-800 mb-4">
                {(['Today', 'Yesterday', 'History'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === tab ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-600 border-b-2 border-transparent'}`}>
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