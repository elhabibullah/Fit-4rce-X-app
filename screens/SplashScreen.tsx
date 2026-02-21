import React, { useState, useEffect } from 'react';
import Loader from '../components/common/Loader.tsx';

const SplashScreen: React.FC = () => {
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  // Exact phrases as requested by the user
  const loadingMessages = [
    "Loading systems",
    "Loading exercises",
    "Loading languages"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 800); // Faster cycle for "flash" tactical effect

    return () => clearInterval(interval);
  }, [loadingMessages.length]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-['Poppins'] font-light overflow-hidden">
      <div className="text-center animate-fadeIn px-6 relative z-10">
        <h1 className="text-5xl md:text-7xl font-light tracking-[0.1em] uppercase mb-2">
          Fit 4rce X
        </h1>
        <p className="text-[10px] md:text-xs text-purple-300 font-light tracking-[0.4em] uppercase opacity-80">
          The future of training is here
        </p>
      </div>

      <div className="mt-24 relative">
        <div className="absolute inset-0 bg-purple-600/10 blur-3xl rounded-full animate-pulse"></div>
        <div className="scale-125 relative z-10">
          <Loader />
        </div>
      </div>

      <div className="mt-16 w-full max-w-xs px-4 text-center h-8">
        <p className="text-white text-[11px] font-light uppercase tracking-[0.2em] animate-pulse">
          {loadingMessages[loadingTextIndex]}
        </p>
      </div>

      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(138,43,226,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(138,43,226,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>
    </div>
  );
};

export default SplashScreen;