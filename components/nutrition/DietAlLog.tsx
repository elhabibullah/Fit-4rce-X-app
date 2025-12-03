
import React, { useState, useRef } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import { Apple, Camera, CheckCircle, Clock } from 'lucide-react';
// FIX: Corrected import path from geminiService to aiService
import { analyzeMealFromText, analyzeMealFromImage } from '../../services/aiService.ts';
import { Meal } from '../../types.ts';

const DietAlHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <Apple className="w-8 h-8 text-green-500" style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }} />
    </div>
    <p className="text-gray-400">{subtitle}</p>
  </div>
);

const HistoryItem: React.FC<{ meal: Meal }> = ({ meal }) => {
    const { translate } = useApp();
    const proteinLabel = translate('nutrition.dashboard.protein_short');
    const carbsLabel = translate('nutrition.dashboard.carbs_short');
    const fatLabel = translate('nutrition.dashboard.fat_short');
    
    return (
        <div className="flex justify-between items-center py-3">
            <div>
                <p className="font-bold text-white">{meal.name}</p>
                <p className="text-xs text-gray-400 flex items-center">
                    <Clock size={12} className="mr-1"/>
                    {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
            <div className="text-right">
                <p className="font-bold text-white">{meal.calories} kcal</p>
                <p className="text-xs text-gray-400">{proteinLabel}:{meal.protein} {carbsLabel}:{meal.carbs} {fatLabel}:{meal.fat}</p>
            </div>
        </div>
    );
}

const TABS = ['Today', 'Yesterday', 'History'] as const;

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
        let result;
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
        setStatus('Failed to analyze meal.');
        setTimeout(() => setStatus(''), 3000);
    } finally {
        setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAnalyze('image', file);
    }
  };
  
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const filterHistory = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    switch(activeTab) {
        case 'Today':
            return nutritionHistory.filter(m => m.timestamp >= todayStart);
        case 'Yesterday':
            return nutritionHistory.filter(m => m.timestamp >= yesterdayStart && m.timestamp < todayStart);
        case 'History':
        default:
            return nutritionHistory.filter(m => m.timestamp < yesterdayStart);
    }
  };

  const displayedHistory = filterHistory();

  return (
    <div className="space-y-6 animate-fadeIn">
      <DietAlHeader title={translate('nutrition.log.title')} subtitle={translate('nutrition.log.subtitle')} />
      
      {status && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg relative flex items-center" role="alert">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span className="block sm:inline">{status}</span>
        </div>
      )}

      <div className="bg-black p-4 rounded-2xl border border-gray-800 shadow-sm">
        <p className="text-sm font-medium text-gray-300 mb-2">{translate('nutrition.log.instructions')}</p>
        <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={translate('nutrition.log.placeholder')}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 h-24 resize-none"
            rows={3}
        />
        <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => handleAnalyze('text', prompt)} disabled={isLoading || !prompt} className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition-opacity">
                {isLoading ? translate('nutrition.log.analyzing') : translate('nutrition.log.analyzeButton')}
            </button>
             <button onClick={handlePhotoClick} disabled={isLoading} className="w-full bg-gray-800 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition-opacity flex items-center justify-center">
                <Camera size={18} className="mr-2"/>
                {translate('nutrition.log.photoButton')}
            </button>
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
      </div>

       <div className="bg-black p-4 rounded-2xl border border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-2">{translate('nutrition.log.historyTitle')}</h3>
            <div className="flex border-b border-gray-700">
                {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-bold -mb-px border-b-2 transition-colors ${activeTab === tab ? 'border-green-500 text-white' : 'border-transparent text-gray-500'}`}>
                        {translate(`nutrition.log.${tab.toLowerCase()}`)}
                    </button>
                ))}
            </div>
            <div className="divide-y divide-gray-700">
                {displayedHistory.length > 0 ? (
                    displayedHistory.map(meal => <HistoryItem key={meal.timestamp} meal={meal} />)
                ) : (
                    <p className="text-center text-gray-400 py-8">{translate('nutrition.log.noEntries')}</p>
                )}
            </div>
       </div>
    </div>
  );
};

export default DietAlLog;
