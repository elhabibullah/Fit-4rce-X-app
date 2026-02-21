import React, { useState } from 'react';
import { useApp } from '../hooks/useApp.ts';
import { Language, Screen } from '../types.ts';
import { ChevronLeft, User } from 'lucide-react';

const LANGUAGE_NAMES: Record<Language, string> = {
    [Language.EN]: 'ENGLISH',
    [Language.FR]: 'FRANÇAIS',
    [Language.AR]: 'العربية',
    [Language.ES]: 'ESPAÑOL',
    [Language.JA]: '日本語',
    [Language.PT]: 'PORTUGUÊS',
    [Language.ZH]: '中文',
    [Language.RU]: 'РУССКИЙ',
};

const LanguageScreen: React.FC<{ fromProfile?: boolean }> = ({ fromProfile = false }) => {
  const { setScreen, translate, constants, setLanguage, setOnboardingStep, setShowSignIn } = useApp();
  const [pendingSelection, setPendingSelection] = useState<Language | null>(null);

  const handleSelect = (langCode: Language) => {
    setPendingSelection(langCode);
    setLanguage(langCode);
    
    setTimeout(() => {
        if (fromProfile) {
          setScreen(Screen.Profile);
        } else {
          setOnboardingStep('intro');
        }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center px-4 pt-16 pb-20 animate-fadeIn font-['Poppins']">
       {fromProfile && (
         <button onClick={() => setScreen(Screen.Profile)} className="fixed top-6 left-6 text-gray-500 hover:text-white p-2.5 z-50 bg-white/5 rounded-full border border-white/10 transition-all active:scale-90">
           <ChevronLeft className="w-5 h-5" />
         </button>
       )}

      <div className="text-center mb-10 w-full max-w-sm">
        <h1 className="text-lg font-light uppercase text-white tracking-[0.4em]">
          Language Selection
        </h1>
        <div className="w-10 h-0.5 bg-[#8A2BE2] mx-auto mt-4 rounded-full shadow-[0_0_10px_#8A2BE2]" />
        
        {!fromProfile && (
            <button onClick={() => setShowSignIn(true)} className="mt-8 inline-flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-[0.3em] hover:text-white transition-all">
                <User className="w-3 h-3" />
                <span>Member Access</span>
            </button>
        )}
      </div>

      <div className="w-full max-w-sm mx-auto grid grid-cols-2 gap-4">
        {constants.LANGUAGES.map((lang) => {
          const isSelected = pendingSelection === lang.code;
          return (
            <div key={lang.code} className={`glow-container h-24 ${isSelected ? 'active' : ''}`}>
              <button
                  onClick={() => handleSelect(lang.code)}
                  className="glow-content w-full h-full flex flex-col items-center justify-center transition-all duration-300"
              >
                  <span className="text-lg font-light tracking-widest text-white">
                      {lang.code.toUpperCase()}
                  </span>
                  <span className="text-[7px] font-light uppercase mt-1.5 tracking-[0.2em] text-white opacity-90">
                      {LANGUAGE_NAMES[lang.code]}
                  </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageScreen;