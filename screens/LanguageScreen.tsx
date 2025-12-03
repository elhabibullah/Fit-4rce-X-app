
import React from 'react';
import { useApp } from '../hooks/useApp.ts';
import { Language, Screen } from '../types.ts';
import { ChevronLeft } from 'lucide-react';

const LanguageScreen: React.FC<{ fromProfile?: boolean }> = ({ fromProfile = false }) => {
  const { setScreen, translate, constants, language, updateUserProfile } = useApp();

  const handleSelect = (langCode: Language) => {
    if (fromProfile) {
      // For profile changes, a single update is fine.
      updateUserProfile({ language: langCode });
      setScreen(Screen.Profile);
    } else {
      // For onboarding, combine the two state updates into one atomic operation.
      // This is the CRITICAL FIX for the infinite loop.
      updateUserProfile({ language: langCode, onboarding_step: 'intro' });
    }
  };

  const wrapperClass = fromProfile 
    ? "fixed inset-0 bg-black z-50 flex flex-col justify-center items-center p-4 animate-fadeIn" 
    : "min-h-screen flex flex-col justify-center items-center px-4 pt-20 pb-4 animate-fadeIn bg-black";

  return (
    <div className={wrapperClass}>
       {fromProfile && (
         <button onClick={() => setScreen(Screen.Profile)} className="absolute top-5 left-5 text-gray-400 hover:text-white p-2 z-10">
           <ChevronLeft className="w-8 h-8" />
         </button>
       )}
      <div className="text-center mb-10 w-full max-w-lg">
        <h1 
          className="text-2xl md:text-4xl font-bold uppercase text-white px-4"
          style={{ textShadow: '0 0 10px #8A2BE2' }}
        >
          {translate('language.title')}
        </h1>
        <p className="text-gray-400 mt-2 text-sm">{translate('language.subtitle')}</p>
      </div>

      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {constants.LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="glow-container w-full"
              >
                <div className={`glow-content p-3 flex flex-col items-center justify-center space-y-1 transition-colors duration-300 ${isSelected ? 'bg-[#8A2BE2]/40' : ''}`}>
                    <span className="text-base font-bold uppercase text-white">{lang.code}</span>
                    <span className="font-medium text-gray-300 text-xs text-center">{lang.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LanguageScreen;
