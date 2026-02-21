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
    <div className="relative w-full bg-black min-h-screen">
      {/* BACKGROUND - FIXED */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center opacity-40 pointer-events-none"
        style={{ backgroundImage: `url(${coachImageUrl})` }}
      />
      <div className="fixed inset-0 z-10 bg-gradient-to-t from-black via-black/80 to-black/40 pointer-events-none" />
      
      {/* CONTENT - FLOW */}
      <div className="relative z-20 flex flex-col items-center w-full px-6 pt-16 pb-32">
        <main className="w-full max-w-xl text-center animate-fadeIn mb-12">
          <div className="relative bg-[#8A2BE2]/10 backdrop-blur-xl border border-[#8A2BE2]/40 rounded-[2.5rem] p-8 shadow-2xl mb-12">
              <div className="space-y-4">
                <h1 
                  className="text-2xl font-black text-white tracking-[0.2em] uppercase"
                  style={{ textShadow: '0 0 15px rgba(138, 43, 226, 0.5)' }}
                >
                  Fit-4rce-X
                </h1>
                <p className="text-[10px] text-purple-300 font-bold tracking-[0.5em] uppercase">
                  {translate('intro.header')}
                </p>
              </div>
          </div>
          
          <div className="space-y-10">
              <p className="text-white text-base font-bold leading-relaxed tracking-wide uppercase px-2">
                {translate('intro.welcome')}
              </p>

              <div className="bg-black/60 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-inner">
                  <p className="text-gray-300 whitespace-pre-line leading-relaxed text-sm font-medium">
                    {translate('intro.main_text')}
                  </p>
              </div>

              <div className="pt-8 border-t border-white/10">
                  <p className="text-sm font-black text-white uppercase tracking-[0.3em] mb-4">
                      {translate('intro.tagline')}
                  </p>
                  <p className="text-[11px] font-black text-purple-400 uppercase tracking-[0.2em] animate-pulse">
                      {translate('intro.mentor_awaits')}
                  </p>
              </div>
          </div>
        </main>

        <div className="w-full max-w-md mt-auto">
          <Button onClick={onComplete} className="w-full py-6 text-sm font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(138,43,226,0.3)]">
              {translate('continue')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;