
import React from 'react';
import { useApp } from '../hooks/useApp.ts';
import Button from '../components/common/Button.tsx';

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
          
          {/* Title Card */}
          <div className="relative bg-[#8A2BE2]/10 backdrop-blur-lg border border-[#8A2BE2] rounded-2xl p-6 shadow-[0_0_30px_rgba(138,43,226,0.3)] mb-8 max-w-xl mx-auto">
              {/* Decorative Pins */}
              <div className="absolute left-6 -top-3 w-1.5 h-6 bg-gray-300 rounded-full border border-gray-900 shadow-md"></div>
              <div className="absolute right-6 -top-3 w-1.5 h-6 bg-gray-300 rounded-full border border-gray-900 shadow-md"></div>
              
              <h1 
                className="text-4xl md:text-5xl font-black text-white tracking-wider"
                style={{ textShadow: '0 0 20px #8A2BE2, 0 2px 4px rgba(0,0,0,0.8)' }}
              >
                Fit-4rce-X
              </h1>
              <p className="mt-2 text-sm md:text-base text-purple-200 tracking-widest font-semibold drop-shadow-md uppercase">
                {translate('intro.header')}
              </p>
          </div>
          
          <p className="text-white mt-6 text-xl md:text-2xl font-bold drop-shadow-lg tracking-wide">
            {translate('intro.welcome')}
          </p>

          {/* Main Text - Restored Typography */}
          <div className="my-8 px-4">
              <p className="text-gray-200 whitespace-pre-line leading-relaxed text-lg font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {translate('intro.main_text')}
              </p>
          </div>

          <p className="text-lg md:text-xl font-bold text-[#8A2BE2] uppercase tracking-widest max-w-md mx-auto drop-shadow-md">
              {translate('intro.tagline')}
          </p>
        </main>

        <div className="mt-auto pt-8 w-full max-w-md">
          <Button onClick={onComplete} className="w-full shadow-[0_0_20px_rgba(138,43,226,0.5)] font-bold text-lg tracking-widest">
              {translate('continue')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;
