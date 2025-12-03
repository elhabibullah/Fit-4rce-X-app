
import React from 'react';
import { useApp } from './hooks/useApp.ts';
import Button from './components/common/Button.tsx';

interface IntroScreenProps {
  onComplete: () => void;
}

const coachImageUrl = "https://ai-webbuilder-prod.s3.us-east-1.amazonaws.com/public/images/ad85aead516242b9b73a5140f6db62a1/1d87d3f1227c4419aca5c972544ab725.Screenshot_20251114-091219_Chrome.jpg";

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const { translate } = useApp();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Layer 1: Static Coach Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${coachImageUrl})` }}
      />

      {/* Layer 2: Darkening overlay for text readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/60 to-black/30"></div>
      
      {/* Layer 3: The content */}
      <div className="relative z-20 flex flex-col items-center justify-between h-full px-6 pt-16 pb-12 overflow-y-auto">
        <main className="w-full max-w-3xl text-center animate-fadeIn">
          <div className="relative bg-[#8A2BE2]/10 backdrop-blur-lg border border-[#8A2BE2] rounded-2xl p-6 shadow-lg">
              {/* Left Pin */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-8 bg-gray-900/80 rounded-sm border-2 border-gray-600"></div>
              
              <div>
                <h1 
                  className="text-2xl md:text-3xl font-bold text-white tracking-wider"
                  style={{ textShadow: '0 0 15px #8A2BE2' }}
                >
                  Fit-4rce-X
                </h1>
                <p className="mt-2 text-sm md:text-base text-purple-200 tracking-widest">
                  {translate('intro.header')}
                </p>
              </div>

              {/* Right Pin */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-8 bg-gray-900/80 rounded-sm border-2 border-gray-600"></div>
          </div>
          
          <p className="text-gray-300 mt-6 md:text-lg font-medium">
            {translate('intro.welcome')}
          </p>

          <div className="my-8 border-t border-b border-gray-700/50 py-6 bg-black/20 backdrop-blur-sm rounded-lg px-4">
              <p className="text-gray-300 whitespace-pre-line leading-relaxed md:text-lg font-medium">
                {translate('intro.main_text')}
              </p>
          </div>

          <p className="text-sm md:text-base font-medium text-white uppercase tracking-widest max-w-md mx-auto opacity-90">
              {translate('intro.tagline')}
          </p>
        </main>

        <div className="mt-auto pt-8 w-full max-w-md">
          <Button onClick={onComplete} className="w-full">
              {translate('continue')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;
