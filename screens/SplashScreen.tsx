
import React, { useState, useEffect } from 'react';
import Loader from '../components/common/Loader.tsx';
import { useApp } from '../hooks/useApp.ts';

const SplashScreen: React.FC = () => {
  const { translate } = useApp();
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  const loadingMessages = [
    translate('splash.loading.models'),
    translate('splash.loading.languages'),
    translate('splash.loading.exercises')
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 800); // Cycle every 800ms for dynamic feel

    return () => clearInterval(interval);
  }, [loadingMessages.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-sans">
      <div className="text-center animate-fadeIn px-4">
        <h1 
          className="text-5xl md:text-6xl font-bold tracking-tighter"
          style={{ textShadow: '0 0 20px #8A2BE2, 0 0 40px #8A2BE2' }}
        >
          Fit-4rce-X
        </h1>
        <p className="mt-4 text-sm md:text-base text-purple-300 font-bold tracking-[0.3em] uppercase drop-shadow-md">
          {translate('splash.subtitle')}
        </p>
      </div>
      <div className="mt-24 scale-150">
        <Loader />
      </div>
      <p className="mt-12 text-gray-400 text-xs font-semibold tracking-widest uppercase animate-pulse">
        {loadingMessages[loadingTextIndex]}
      </p>
    </div>
  );
};

export default SplashScreen;
