import React, { useState } from 'react';
import { Zap, Bot, Dumbbell, Mic, Shield, Lock, Bike, Footprints, Activity, Loader2 } from 'lucide-react';
import Card from '../components/common/Card.tsx';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import Chatbot from '../components/nutrition/Chatbot.tsx';
import { generateWorkoutWithGemini } from '../services/aiService.ts';

const DashboardScreen: React.FC = () => {
  const { setScreen, translate, setIsCoachOpen, planId, showStatus, setNutritionTab, language, setSelectedPlan, profile } = useApp();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isGeneratingWOTD, setIsGeneratingWOTD] = useState(false);

  const isPremium = planId === 'premium';
  const F4X_LOGO_URL = "https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Nutrition_logo.png";
  const ROBOT_IMAGE_URL = "https://ai-webbuilder-prod.s3.us-east-1.amazonaws.com/public/images/ad85aead516242b9b73a5140f6db62a1/1d87d3f1227c4419aca5c972544ab725.Screenshot_20251114-091219_Chrome.jpg";

  const handleCardioClick = (screen: Screen) => {
      if (isPremium) {
          setScreen(screen);
      } else {
          showStatus(translate('premiumFeature.locked'));
      }
  };

  const handleStoreClick = () => {
      if (isPremium) {
          setNutritionTab('store');
          setScreen(Screen.Nutrition);
      } else {
          showStatus(translate('premiumFeature.locked'));
      }
  };

  const handleGenerateWOTD = async () => {
    if (isGeneratingWOTD) return;
    setIsGeneratingWOTD(true);
    try {
      const plan = await generateWorkoutWithGemini("Full Body High Intensity 45m training protocol. Split into dynamic phases.", language);
      if (plan) {
        setSelectedPlan(plan);
        setScreen(Screen.Workout);
      } else {
        showStatus("Neural Link unstable. Try again.");
      }
    } catch (e) {
      showStatus("Connection error.");
    } finally {
      setIsGeneratingWOTD(false);
    }
  };

  // Tactical display name: Force "ABDELW" if profile name matches or is default
  const tacticalName = (profile?.full_name || 'ABDELW').toUpperCase().slice(0, 6);

  return (
    <div className="space-y-6 animate-fadeIn pb-28 font-['Poppins']">
      
      {/* TACTICAL STATUS HEADER */}
      <div className="flex items-center justify-between px-1 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
              <span className="text-[10px] font-light text-gray-400 uppercase tracking-[0.3em]">
                {translate('home.system.active')} <span className="text-white ml-1">11% {translate('home.system.load')}</span>
              </span>
          </div>
          <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-purple-400 tracking-[0.3em]">{tacticalName}</span>
              <Activity size={12} className="text-purple-500" />
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
          {/* AI COACH CARD */}
          <button 
            onClick={() => setIsCoachOpen(true)} 
            className="w-full h-44 relative rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all bg-black group text-center p-4 flex flex-col items-center justify-center gap-2 shadow-xl active:scale-95"
          >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent z-0"></div>
              <div className="relative z-10 w-14 h-14 rounded-full border-2 border-purple-500/40 overflow-hidden shadow-lg mb-1">
                  <img src={ROBOT_IMAGE_URL} alt="Coach" className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none mb-2">{translate('home.coach_card.title')}</h3>
                  <div className="flex items-center justify-center gap-1.5 text-[8px] text-purple-300 font-bold bg-purple-900/30 px-3 py-1 rounded-full border border-purple-500/20">
                      <Mic className="w-2.5 h-2.5" />
                      <span className="uppercase tracking-widest">{translate('home.coach_card.status')}</span>
                  </div>
              </div>
          </button>

          {/* STORE CARD */}
          <button 
            onClick={handleStoreClick}
            className="w-full h-44 relative rounded-2xl overflow-hidden border border-red-600/30 bg-black group text-center p-0 flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
          >
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 to-transparent z-0"></div>
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat z-10 transition-transform duration-500 transform group-hover:scale-105"
                style={{ backgroundImage: `url(${F4X_LOGO_URL})`, backgroundSize: '70%' }}
              ></div>
          </button>

          {/* SPINNING CARD */}
          <button 
              onClick={() => handleCardioClick(Screen.Spinning)} 
              className="w-full h-40 relative overflow-hidden group rounded-2xl border border-[#00FFFF]/20 hover:border-[#00FFFF]/50 transition-all bg-black text-center p-3 flex flex-col items-center justify-center gap-2"
          >
              {!isPremium && <Lock size={10} className="absolute top-3 right-3 z-20 text-yellow-500" />}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-black z-0"></div>
              <Bike className={`w-10 h-10 relative z-10 transition-transform ${isPremium ? 'text-[#00FFFF] group-hover:scale-110' : 'text-gray-600'}`} />
              <div className="relative z-10">
                  <span className={`text-[10px] font-black uppercase tracking-widest block ${isPremium ? 'text-white' : 'text-gray-500'}`}>{translate('home.cardio.spinning')}</span>
                  <span className="text-[8px] text-gray-500 font-light uppercase tracking-tight mt-0.5 block">{translate('home.cardio.spinning.desc')}</span>
              </div>
          </button>

           {/* RUNNING CARD */}
           <button 
              onClick={() => handleCardioClick(Screen.Running)} 
              className="w-full h-40 relative overflow-hidden group rounded-2xl border border-green-500/20 hover:border-green-500/50 transition-all bg-black text-center p-3 flex flex-col items-center justify-center gap-2"
          >
              {!isPremium && <Lock size={10} className="absolute top-3 right-3 z-20 text-yellow-500" />}
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-black z-0"></div>
              <Footprints className={`w-10 h-10 relative z-10 transition-transform ${isPremium ? 'text-green-500 group-hover:scale-110' : 'text-gray-600'}`} />
              <div className="relative z-10">
                  <span className={`text-[10px] font-black uppercase tracking-widest block ${isPremium ? 'text-white' : 'text-gray-500'}`}>{translate('home.cardio.running')}</span>
                  <span className="text-[8px] text-gray-500 font-light uppercase tracking-tight mt-0.5 block">{translate('home.cardio.running.desc')}</span>
              </div>
          </button>
      </div>

      {/* WORKOUT OF THE DAY CARD */}
      <button 
        onClick={handleGenerateWOTD}
        className="w-full text-left transition-transform active:scale-[0.98] disabled:opacity-70 mt-4"
        disabled={isGeneratingWOTD}
      >
        <Card className="py-6 px-6 bg-zinc-900/60 border border-white/5 rounded-3xl relative overflow-hidden group">
            {isGeneratingWOTD && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center"><Loader2 className="w-6 h-6 text-purple-500 animate-spin" /></div>}
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <span className="text-[9px] font-bold uppercase text-purple-400 tracking-[0.3em]">{translate('home.aiGenerated')}</span>
                    <h2 className="text-xl font-black text-white mt-1 uppercase tracking-tight leading-tight">{translate('home.featuredWorkout.title')}</h2>
                    <p className="text-gray-500 text-[10px] font-light mt-1 uppercase tracking-widest">{translate('home.featuredWorkout.details')}</p>
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                  <Dumbbell className="w-6 h-6 text-purple-500" />
                </div>
            </div>
        </Card>
      </button>
      
      <div className="grid grid-cols-2 gap-4 pt-2">
        {/* NEW WORKOUT ACTION */}
        <button 
            onClick={() => setScreen(Screen.Workout)}
            className="bg-zinc-900/40 border border-white/5 hover:border-purple-500/30 rounded-2xl p-5 flex flex-col items-start gap-3 transition-all active:scale-95 group shadow-xl"
        >
            <Zap className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-transform"/>
            <div className="text-left">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">{translate('home.generateNewWorkout')}</h3>
                <p className="text-[9px] text-gray-500 font-light uppercase tracking-tight mt-1">{translate('home.generateNewWorkoutSubtitle')}</p>
            </div>
        </button>

        {/* DEFENSE ACTION */}
        <button 
            onClick={() => isPremium ? setScreen(Screen.SelfDefense) : showStatus(translate('premiumFeature.locked'))}
            className="bg-zinc-900/40 border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col items-start gap-3 transition-all active:scale-95 group shadow-xl"
        >
            <Shield className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform"/>
            <div className="text-left">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">{translate('nav.defense')}</h3>
                <p className="text-[9px] text-gray-500 font-light uppercase tracking-tight mt-1">{translate('home.defense.subtitle')}</p>
            </div>
        </button>
      </div>

      {/* FLOAT BUTTONS */}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-4">
        <button 
          onClick={() => setIsCoachOpen(true)}
          className="w-16 h-16 bg-[#8A2BE2] rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(138,43,226,0.5)] transform transition-all hover:scale-110 active:scale-90 border border-white/20"
          aria-label={translate('home.openAICoach')}
        >
          <Mic className="w-7 h-7 text-white" />
        </button>
        <button 
          onClick={() => setIsChatbotOpen(true)}
          className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center shadow-2xl transform transition-all hover:scale-110 active:scale-90 border border-white/10"
          aria-label={translate('home.openAIAssistant')}
        >
          <Bot className="w-6 h-6 text-purple-400" />
        </button>
      </div>

      <Chatbot isVisible={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </div>
  );
};

export default DashboardScreen;