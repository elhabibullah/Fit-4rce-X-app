import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import { ChevronLeft, Play, Pause, Bike, Mountain, X } from 'lucide-react';
import VirtualEnvironment, { EnvironmentType } from '../components/common/VirtualEnvironment.tsx';
import { SPINNING_COACH_MODEL_URL } from '../lib/constants.ts';
import CastButton from '../components/common/CastButton.tsx';
import { DeviceStatusTrigger } from '../components/common/DeviceStatusTrigger.tsx';
import { HolographicCoach } from '../components/common/HolographicCoach.tsx';
import Button from '../components/common/Button.tsx';

type SpinningView = 'mode_select' | 'setup' | 'active';

const SPINNING_VIDEO_URL = "https://fit-4rce-x.s3.eu-north-1.amazonaws.com/Android_spinning-video.mp4";

export const SpinningScreen: React.FC = () => {
  const { setScreen, translate, isDeviceConnected, deviceMetrics, openDeviceModal, language } = useApp();
  const [view, setView] = useState<SpinningView>('mode_select');
  
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdown, setCountdown] = useState(10);
  const [isPrepPhase, setIsPrepPhase] = useState(false);
  const [env, setEnv] = useState<EnvironmentType>('studio');
  const [level, setLevel] = useState<string>('intermediate');
  const [duration, setDuration] = useState<string>('50');
  const [isTVMode, setIsTVMode] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let interval: number;
    if (view === 'active' && isActive) {
      if (isPrepPhase) {
          interval = window.setInterval(() => {
              setCountdown(c => {
                  if (c <= 1) {
                      setIsPrepPhase(false);
                      return 10;
                  }
                  return c - 1;
              });
          }, 1000);
      } else {
          interval = window.setInterval(() => setElapsedTime(t => t + 1), 1000);
      }
    }
    return () => clearInterval(interval);
  }, [view, isActive, isPrepPhase]);

  useEffect(() => {
      const v = videoRef.current;
      if (v) {
          if (isActive && !isPrepPhase) v.play().catch(() => {});
          else v.pause();
      }
  }, [isActive, isPrepPhase]);

  const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (view === 'mode_select') {
      return (
          <div className="animate-fadeIn min-h-screen h-full bg-black flex flex-col font-['Poppins']">
              <div className="p-4 flex-none flex items-center justify-between border-b border-gray-900">
                  <button onClick={() => setScreen(Screen.Home)} className="flex items-center text-gray-400 hover:text-white font-normal uppercase text-[10px] tracking-widest transition-colors">
                      <ChevronLeft size={16} className="mr-1" />{translate('back')}
                  </button>
                  <div className="flex items-center gap-2">
                      <DeviceStatusTrigger />
                      <CastButton isTVMode={isTVMode} onToggleTVMode={() => setIsTVMode(!isTVMode)} />
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar flex flex-col items-center justify-center">
                  <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-8 uppercase tracking-widest">{translate('spinning.menu.title')}</h1>
                  <div className="flex flex-col gap-4 max-w-md mx-auto w-full pb-10">
                      <button onClick={() => { setEnv('studio'); setView('setup'); }} className="h-36 sm:h-40 bg-zinc-900/50 border border-gray-800 hover:border-cyan-500/50 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center p-4 text-center transition-all active:scale-95 shadow-lg group">
                          <Bike className="w-9 h-9 text-[#00FFFF] mb-2.5 transition-transform group-hover:scale-110" />
                          <h2 className="text-base font-semibold text-white uppercase tracking-wider">{translate('spinning.mode.studio')}</h2>
                      </button>
                      <button onClick={() => { setEnv('mountains'); setView('setup'); }} className="h-36 sm:h-40 bg-zinc-900/50 border border-gray-800 hover:border-purple-500/50 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center p-4 text-center transition-all active:scale-95 shadow-lg group">
                          <Mountain className="w-9 h-9 text-purple-400 mb-2.5 transition-transform group-hover:scale-110" />
                          <h2 className="text-base font-semibold text-white uppercase tracking-wider">{translate('spinning.mode.scenic')}</h2>
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'setup') {
      return (
          <div className="animate-fadeIn min-h-screen h-full bg-black flex flex-col font-['Poppins'] p-4 sm:p-6 pb-24 overflow-y-auto custom-scrollbar">
                {/* Refined Mobile-Ready Header */}
                <header className="flex-none flex items-center justify-between gap-2 mb-6 pb-3 border-b border-gray-900 px-0.5">
                    <button 
                      onClick={() => setView('mode_select')} 
                      className="text-gray-400 hover:text-white flex items-center gap-1 uppercase text-[10px] tracking-widest transition-colors shrink-0 py-1"
                    >
                      <ChevronLeft size={18} />
                      <span>{translate('back')}</span>
                    </button>
                    
                    <div className="text-center px-1 min-w-0 flex-1">
                      <h1 className="text-xs sm:text-sm font-semibold text-gray-200 uppercase tracking-widest truncate">
                        {translate('spinning.setup.title')}
                      </h1>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <DeviceStatusTrigger />
                      <CastButton isTVMode={isTVMode} onToggleTVMode={() => setIsTVMode(!isTVMode)} />
                    </div>
                </header>

                <div className="max-w-md mx-auto w-full space-y-6 sm:space-y-8 my-auto">
                    {/* Level / Intensity Selection - Responsive 3-Column Grid */}
                    <section>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-3 text-center">
                            {translate('spinning.setup.level')}
                        </h3>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <button 
                                onClick={() => setLevel('beginner')} 
                                className={`py-3.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center text-center ${
                                    level === 'beginner' 
                                        ? 'text-[#00FFFF] bg-cyan-950/50 border-2 border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.25)] scale-[1.02]' 
                                        : 'text-gray-400 bg-zinc-900/60 border border-gray-800 hover:border-gray-700'
                                }`}
                            >
                                <span className="truncate w-full">{translate('level.beginner')}</span>
                            </button>
                            <button 
                                onClick={() => setLevel('intermediate')} 
                                className={`py-3.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center text-center ${
                                    level === 'intermediate' 
                                        ? 'text-[#FFBF00] bg-amber-950/50 border-2 border-[#FFBF00] shadow-[0_0_15px_rgba(255,191,0,0.25)] scale-[1.02]' 
                                        : 'text-gray-400 bg-zinc-900/60 border border-gray-800 hover:border-gray-700'
                                }`}
                            >
                                <span className="truncate w-full">{translate('level.intermediate')}</span>
                            </button>
                            <button 
                                onClick={() => setLevel('advanced')} 
                                className={`py-3.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center text-center ${
                                    level === 'advanced' 
                                        ? 'text-[#FF0000] bg-red-950/50 border-2 border-[#FF0000] shadow-[0_0_15px_rgba(255,0,0,0.25)] scale-[1.02]' 
                                        : 'text-gray-400 bg-zinc-900/60 border border-gray-800 hover:border-gray-700'
                                }`}
                            >
                                <span className="truncate w-full">{translate('level.advanced')}</span>
                            </button>
                        </div>
                    </section>

                    {/* Duration Selection - Compact 4-Column Grid */}
                    <section>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-3 text-center">
                            {translate('spinning.setup.duration')}
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                            {['30', '50', '60', '90'].map(d => (
                              <button 
                                  key={d}
                                  onClick={() => setDuration(d)} 
                                  className={`py-3 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center ${
                                      duration === d 
                                          ? 'text-white bg-purple-900/50 border-2 border-purple-500 shadow-[0_0_15px_rgba(138,43,226,0.3)] scale-[1.02]' 
                                          : 'text-gray-400 bg-zinc-900/60 border border-gray-800 hover:border-gray-700'
                                  }`}
                              >
                                  <span className="text-xs sm:text-sm font-mono font-bold text-white">{d}</span>
                                  <span className="text-[8px] text-gray-400 uppercase">min</span>
                              </button>
                            ))}
                        </div>
                    </section>

                    {/* Start Action Button - Guaranteed Visible, Never Offscreen */}
                    <div className="pt-2">
                        <Button 
                            onClick={() => { setView('active'); setIsActive(true); setIsPrepPhase(true); }} 
                            className="w-full py-4 text-xs sm:text-sm font-black uppercase tracking-[0.25em] shadow-[0_0_25px_rgba(138,43,226,0.4)] active:scale-[0.98]"
                        >
                            {translate('start_session')}
                        </Button>
                    </div>
                </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[2500] h-screen w-screen flex flex-col bg-black overflow-hidden font-['Poppins']">
      <div className="absolute inset-0 z-0"><VirtualEnvironment type={env} isPaused={!isActive} /></div>
      
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-[500] pointer-events-auto">
        <button onClick={() => setScreen(Screen.Home)} className="p-3 bg-black/60 rounded-full text-white backdrop-blur-xl border border-white/10 shadow-2xl active:scale-90 transition-all"><X size={20} /></button>
        <div className="flex items-center gap-3">
            <DeviceStatusTrigger showLabel />
            <CastButton isTVMode={isTVMode} onToggleTVMode={() => setIsTVMode(!isTVMode)} />
        </div>
      </header>

      <div className="absolute inset-x-4 sm:inset-x-6 top-20 sm:top-24 bottom-36 sm:bottom-40 z-40 rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-purple-500/40 bg-black shadow-[0_0_60px_rgba(138,43,226,0.4)]">
          <img 
            src="https://www.dropbox.com/scl/fi/jryp732ar5tl7eqydrcee/spinning-room.jpg?rlkey=i18o66uec35kej86ztaxjx7mg&st=8s9umlh6&raw=1" 
            className="w-full h-full object-cover opacity-40 contrast-125" 
            alt="Spinning Studio"
          />
          
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
              <HolographicCoach isPaused={!isActive || isPrepPhase} modelUrl={SPINNING_COACH_MODEL_URL} background="transparent" />
          </div>

          {isPrepPhase && (
             <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center animate-fadeIn p-4 text-center">
                 <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 drop-shadow-[0_0_10px_#00FFFF]">
                    {language === 'fr' ? 'INITIALISATION DU MOTEUR' : 'ENGINE INITIALIZING'}
                 </h4>
                 <div className="text-8xl sm:text-[12rem] font-black text-white leading-none drop-shadow-[0_0_40px_rgba(0,255,255,0.7)]">{countdown}</div>
             </div>
          )}
      </div>

      <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 z-50 px-4 sm:px-6">
          <div className="flex justify-between items-center gap-2 sm:gap-4 max-w-xl mx-auto">
                <div className="flex-1 bg-black/70 backdrop-blur-2xl border border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-2xl">
                    <p className="text-[8px] sm:text-[9px] text-[#00FFFF] font-normal uppercase tracking-widest mb-0.5 sm:mb-1">
                        {language === 'fr' ? 'TEMPS' : 'ELAPSED'}
                    </p>
                    <p className="text-xl sm:text-3xl font-black text-white font-mono tracking-tighter">{formatTime(elapsedTime)}</p>
                </div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#8A2BE2] rounded-full flex items-center justify-center shadow-[0_0_30px_#8A2BE2] active:scale-90 transition-all shrink-0">
                    <button onClick={() => setIsActive(!isActive)} className="text-white" aria-label={isActive ? "Pause" : "Play"}>
                        {isActive ? <Pause className="w-7 h-7 sm:w-9 sm:h-9" fill="white" /> : <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1" fill="white" />}
                    </button>
                </div>
                <button 
                    onClick={openDeviceModal}
                    className="flex-1 bg-black/70 backdrop-blur-2xl border border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-2xl transition-all active:scale-95 hover:border-purple-500/50"
                    title={isDeviceConnected ? "Bracelet EMS Synchronisé" : "Cliquez pour connecter la bande EMS"}
                >
                    <p className="text-[8px] sm:text-[9px] text-red-400 font-bold uppercase tracking-widest mb-0.5 sm:mb-1">
                        {isDeviceConnected ? (language === 'fr' ? 'POULS' : 'HEART RATE') : (language === 'fr' ? 'BANDE EMS' : 'EMS BAND')}
                    </p>
                    <p className={`text-xl sm:text-3xl font-black font-mono tracking-tighter ${isDeviceConnected ? 'text-white' : 'text-purple-300 text-xs sm:text-sm py-1 font-bold animate-pulse'}`}>
                        {isDeviceConnected ? deviceMetrics.heartRate : (language === 'fr' ? '+ CONNECTER' : '+ CONNECT')}
                    </p>
                </button>
          </div>
      </div>
    </div>
  );
};