
import React, { useState } from 'react';
import { Zap, Bot, Dumbbell, Mic, Shield, Lock, Bike, Footprints } from 'lucide-react';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import Chatbot from '../components/common/Chatbot.tsx';

// Renamed to DashboardScreen to force a fresh component mount
const DashboardScreen: React.FC = () => {
  const { setScreen, translate, setIsCoachOpen, planId, showStatus, setNutritionTab } = useApp();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const isPremium = planId === 'premium';
  const ROBOT_IMAGE_URL = "https://ai-webbuilder-prod.s3.us-east-1.amazonaws.com/public/images/ad85aead516242b9b73a5140f6db62a1/1d87d3f1227c4419aca5c972544ab725.Screenshot_20251114-091219_Chrome.jpg";
  const F4X_LOGO_URL = "https://fit-4rce-x.s3.eu-north-1.amazonaws.com/F4X_Nutrition_logo.png";

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

  // Unique key forces re-render
  return (
    <div className="space-y-6 animate-fadeIn pb-28" key={`dashboard-${Date.now()}`}>
      {/* HEADER - No Bell */}
      <header className="flex justify-between items-center px-1 py-2">
        <div>
          <h1 
            className="text-2xl font-bold text-white tracking-wide"
            style={{ textShadow: '0 0 10px #8A2BE2' }}
          >
            {translate('home.welcome')}
          </h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest">{translate('home.subtitle')}</p>
        </div>
      </header>

      {/* --- UNIFIED 4-BUTTON GRID SYSTEM (2x2) --- */}
      <div className="grid grid-cols-2 gap-4">
          
          {/* 1. AI COACH (Top Left) */}
          <button 
            onClick={() => setIsCoachOpen(true)} 
            className="w-full h-40 relative rounded-2xl overflow-hidden border border-purple-500/30 hover:border-purple-500 transition-all bg-black group text-center p-3 flex flex-col items-center justify-center gap-2 shadow-[0_0_20px_rgba(138,43,226,0.2)]"
          >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black z-0"></div>
              
              <div className="relative z-10 w-12 h-12 rounded-full border-2 border-purple-500 overflow-hidden shadow-[0_0_15px_rgba(138,43,226,0.6)]">
                  <img src={ROBOT_IMAGE_URL} alt="Coach" className="w-full h-full object-cover" />
              </div>
              
              <div className="relative z-10">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider leading-none mb-1">{translate('home.coach_card.title')}</h3>
                  <div className="flex items-center justify-center gap-1 text-[9px] text-purple-300 font-bold bg-purple-900/50 px-2 py-0.5 rounded-full border border-purple-500/30">
                      <Mic className="w-3 h-3" />
                      <span>{translate('home.coach_card.status')}</span>
                  </div>
              </div>
          </button>

          {/* 2. F4X NUTRITION (Top Right) */}
          <button 
            onClick={handleStoreClick}
            className="w-full h-40 relative rounded-2xl overflow-hidden border border-red-600/50 hover:border-red-500 transition-all bg-gradient-to-br from-red-950 to-red-900 group text-center p-0 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.2)]"
          >
              <div 
                className="absolute inset-0 bg-contain bg-center bg-no-repeat z-10 transition-transform duration-500 transform group-hover:scale-105"
                style={{ backgroundImage: `url(${F4X_LOGO_URL})` }}
              ></div>
              {/* No text overlay as requested */}
          </button>

          {/* 3. CYBER CYCLE (Bottom Left) */}
          <button 
              onClick={() => handleCardioClick(Screen.Spinning)} 
              className="w-full h-40 relative overflow-hidden group rounded-2xl border border-[#00FFFF]/30 hover:border-[#00FFFF] transition-all bg-black text-center p-3 flex flex-col items-center justify-center gap-2"
          >
              {!isPremium && (
                  <div className="absolute top-2 right-2 z-20 bg-black/60 rounded-full p-1">
                      <Lock className="w-3 h-3 text-yellow-400" />
                  </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-black z-0"></div>
              
              <Bike className={`w-10 h-10 relative z-10 transition-transform ${isPremium ? 'text-[#00FFFF] group-hover:scale-110' : 'text-gray-500'}`} />
              <div className="relative z-10">
                  <span className={`text-xs font-bold uppercase tracking-wider block ${isPremium ? 'text-white' : 'text-gray-400'}`}>{translate('home.cardio.spinning')}</span>
                  <span className="text-[9px] text-gray-400">{translate('home.cardio.spinning.desc')}</span>
              </div>
          </button>

           {/* 4. VELOCITY RUN (Bottom Right) */}
           <button 
              onClick={() => handleCardioClick(Screen.Running)} 
              className="w-full h-40 relative overflow-hidden group rounded-2xl border border-green-500/30 hover:border-green-500 transition-all bg-black text-center p-3 flex flex-col items-center justify-center gap-2"
          >
              {!isPremium && (
                  <div className="absolute top-2 right-2 z-20 bg-black/60 rounded-full p-1">
                      <Lock className="w-3 h-3 text-yellow-400" />
                  </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 to-black z-0"></div>
              
              <Footprints className={`w-10 h-10 relative z-10 transition-transform ${isPremium ? 'text-green-500 group-hover:scale-110' : 'text-gray-500'}`} />
              <div className="relative z-10">
                  <span className={`text-xs font-bold uppercase tracking-wider block ${isPremium ? 'text-white' : 'text-gray-400'}`}>{translate('home.cardio.running')}</span>
                  <span className="text-[9px] text-gray-400">{translate('home.cardio.running.desc')}</span>
              </div>
          </button>
      </div>

      {/* FEATURED WORKOUT */}
      <Card className="py-4 px-5 bg-gray-900/40 border-gray-800 rounded-xl mt-6">
        <div className="flex justify-between items-center">
            <div>
                <span className="text-[10px] font-bold uppercase text-purple-400 tracking-widest">{translate('home.aiGenerated')}</span>
                <h2 className="text-sm font-bold text-white mt-1">{translate('home.featuredWorkout.title')}</h2>
                <p className="text-gray-500 text-[10px] mt-1">{translate('home.featuredWorkout.details')}</p>
            </div>
            <button 
                onClick={() => setScreen(Screen.Workout)}
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 hover:border-purple-500 hover:bg-black transition-all"
            >
              <Dumbbell className="w-5 h-5 text-[#8A2BE2]" />
            </button>
        </div>
      </Card>
      
      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-2 gap-4">
        <button 
            onClick={() => setScreen(Screen.Workout)}
            className="bg-gray-900/60 border border-gray-700 hover:border-white rounded-xl p-4 text-left transition-all"
        >
            <Zap className="w-5 h-5 text-yellow-400 mb-2"/>
            <h3 className="text-sm font-bold text-white">{translate('home.generateNewWorkout')}</h3>
            <p className="text-[10px] text-gray-500 mt-1">{translate('home.generateNewWorkoutSubtitle')}</p>
        </button>

        <button 
            onClick={() => isPremium ? setScreen(Screen.SelfDefense) : showStatus(translate('premiumFeature.locked'))}
            className="bg-gray-900/60 border border-gray-700 hover:border-white rounded-xl p-4 text-left transition-all relative"
        >
            {!isPremium && <Lock className="absolute top-3 right-3 w-3 h-3 text-yellow-400" />}
            <Shield className="w-5 h-5 text-blue-400 mb-2"/>
            <h3 className="text-sm font-bold text-white">{translate('nav.defense')}</h3>
            <p className="text-[10px] text-gray-500 mt-1">{translate('home.defense.subtitle')}</p>
        </button>
      </div>

      {/* FLOATING ACTION BUTTONS */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3">
        <button 
          onClick={() => setIsCoachOpen(true)}
          className="w-14 h-14 bg-black border border-gray-700 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95"
          aria-label={translate('home.openAICoach')}
        >
          <Mic className="w-6 h-6 text-[#8A2BE2]" />
        </button>
        <button 
          onClick={() => setIsChatbotOpen(true)}
          className="w-14 h-14 bg-black border border-gray-700 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95"
          aria-label={translate('home.openAIAssistant')}
        >
          <Bot className="w-6 h-6 text-[#8A2BE2]" />
        </button>
      </div>

      <Chatbot isVisible={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

    </div>
  );
};

export default DashboardScreen;
