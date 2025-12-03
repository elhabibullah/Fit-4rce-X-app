
import React, { useState, useMemo } from 'react';
import { Bell, Zap, Bot, Dumbbell, Mic, Shield, Lock, Bike, Footprints } from 'lucide-react';
import Card from './components/common/Card.tsx';
import Button from './components/common/Button.tsx';
import { useApp } from './hooks/useApp.ts';
import { Screen } from './types.ts';
import Chatbot from './components/common/Chatbot.tsx';

const HomeScreen: React.FC = () => {
  const { setScreen, translate, setIsCoachOpen, profile, planId, showStatus } = useApp();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const isPremium = planId === 'premium';
  
  const ROBOT_IMAGE_URL = "https://ai-webbuilder-prod.s3.us-east-1.amazonaws.com/public/images/ad85aead516242b9b73a5140f6db62a1/1d87d3f1227c4419aca5c972544ab725.Screenshot_20251114-091219_Chrome.jpg";

  const handleCardioClick = (screen: Screen) => {
      if (isPremium) {
          setScreen(screen);
      } else {
          showStatus(translate('premiumFeature.locked'));
      }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-medium text-white tracking-wide">{translate('home.welcome')}</h1>
          <p className="text-gray-400">{translate('home.subtitle')}</p>
        </div>
        <div className="relative">
          <Bell className="w-7 h-7 text-gray-400" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#8A2BE2] rounded-full border-2 border-black" style={{ filter: 'drop-shadow(0 0 4px #8A2BE2)'}}></div>
        </div>
      </header>

      <button onClick={() => setIsCoachOpen(true)} className="w-full text-left">
        <Card className="mb-6 flex items-center gap-4 bg-gradient-to-r from-purple-900/40 to-black border-purple-500/30 hover:border-purple-500/60 transition-all duration-300">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500 flex-shrink-0">
                <img src={ROBOT_IMAGE_URL} alt="AI Coach" className="w-full h-full object-cover" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-white">{translate('home.coach_card.title')}</h3>
                <p className="text-xs text-gray-300">{translate('home.coach_card.desc')}</p>
            </div>
        </Card>
      </button>

      {/* NEW: Cardio Zone Section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00FFFF]" /> 
            {translate('home.cardio.title')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
            <button 
                onClick={() => handleCardioClick(Screen.Spinning)} 
                className="relative overflow-hidden group rounded-2xl h-32 border border-[#00FFFF]/30 hover:border-[#00FFFF] transition-all bg-black"
            >
                {!isPremium && (
                    <div className="absolute top-2 right-2 z-20 p-1 bg-black/60 rounded-full">
                        <Lock className="w-4 h-4 text-yellow-400" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-black z-0"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <Bike className={`w-8 h-8 mb-2 transition-transform ${isPremium ? 'text-[#00FFFF] group-hover:scale-110' : 'text-gray-500'}`} />
                    <span className={`text-sm font-bold uppercase tracking-wider ${isPremium ? 'text-white' : 'text-gray-400'}`}>{translate('home.cardio.spinning')}</span>
                    <span className="text-[10px] text-gray-400">{translate('home.cardio.spinning.desc')}</span>
                </div>
            </button>
             <button 
                onClick={() => handleCardioClick(Screen.Running)} 
                className="relative overflow-hidden group rounded-2xl h-32 border border-green-500/30 hover:border-green-500 transition-all bg-black"
            >
                {!isPremium && (
                    <div className="absolute top-2 right-2 z-20 p-1 bg-black/60 rounded-full">
                        <Lock className="w-4 h-4 text-yellow-400" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 to-black z-0"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <Footprints className={`w-8 h-8 mb-2 transition-transform ${isPremium ? 'text-green-500 group-hover:scale-110' : 'text-gray-500'}`} />
                    <span className={`text-sm font-bold uppercase tracking-wider ${isPremium ? 'text-white' : 'text-gray-400'}`}>{translate('home.cardio.running')}</span>
                    <span className="text-[10px] text-gray-400">{translate('home.cardio.running.desc')}</span>
                </div>
            </button>
        </div>
      </div>


      <Card>
        <div className="flex justify-between items-start">
            <div>
                <span className="text-xs font-bold uppercase text-purple-400 tracking-widest">{translate('home.aiGenerated')}</span>
                <h2 className="text-2xl font-medium text-white mt-1">{translate('home.featuredWorkout.title')}</h2>
                <p className="text-gray-400 mt-2 text-sm">{translate('home.featuredWorkout.details')}</p>
            </div>
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center shadow-lg border-2 border-gray-700">
              <Dumbbell className="w-8 h-8 text-[#8A2BE2]" />
            </div>
        </div>
        <Button className="w-full mt-6" onClick={() => setScreen(Screen.Workout)}>{translate('home.startWorkout')}</Button>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-medium text-white">{translate('home.generateNewWorkout')}</h3>
            <p className="text-gray-400 mt-2 text-sm">{translate('home.generateNewWorkoutSubtitle')}</p>
          </div>
          <Button className="w-full mt-4" variant="secondary" onClick={() => setScreen(Screen.Workout)}>
            <Zap className="w-4 h-4 mr-2 inline-block"/>
            {translate('home.generateButton')}
          </Button>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-medium text-white">{translate('nav.defense')}</h3>
            <p className="text-gray-400 mt-2 text-sm">{translate('selfDefense.selectYourPath')}</p>
          </div>
          <Button 
            className="w-full mt-4" 
            variant="secondary" 
            onClick={() => setScreen(Screen.SelfDefense)}
            disabled={!isPremium}
          >
            {isPremium ? (
              <>
                <Shield className="w-4 h-4 mr-2 inline-block"/>
                {translate('selfDefense.explorePaths')}
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2 inline-block text-yellow-400 !opacity-100"/>
                {translate('premiumFeature.locked')}
              </>
            )}
          </Button>
        </Card>
      </div>

      <div className="fixed bottom-28 right-4 z-40 flex flex-col gap-4">
        <button 
          onClick={() => setIsCoachOpen(true)}
          className="w-16 h-16 bg-black border-2 border-gray-700 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95"
          aria-label={translate('home.openAICoach')}
        >
          <Mic className="w-8 h-8 text-[#8A2BE2]" />
        </button>
        <button 
          onClick={() => setIsChatbotOpen(true)}
          className="w-16 h-16 bg-black border-2 border-gray-700 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 active:scale-95"
          aria-label={translate('home.openAIAssistant')}
        >
          <Bot className="w-8 h-8 text-[#8A2BE2]" />
        </button>
      </div>

      <Chatbot isVisible={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

    </div>
  );
};

export default HomeScreen;
