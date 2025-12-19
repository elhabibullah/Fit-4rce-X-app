
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import { ChevronLeft, Play, Pause, Activity, Timer, Bike, Mountain, Zap, Clock, Check } from 'lucide-react';
import Card from '../components/common/Card.tsx';
import { HolographicCoach } from '../components/common/HolographicCoach.tsx';
import { SPINNING_COACH_MODEL_URL } from '../constants.ts';
import VirtualEnvironment, { EnvironmentType, ENVIRONMENT_THUMBNAILS } from '../components/common/VirtualEnvironment.tsx';
import CastButton from '../components/common/CastButton.tsx';
import Button from '../components/common/Button.tsx';
import { DeviceStatusTrigger } from '../components/common/DeviceStatusTrigger.tsx';

type SpinningView = 'mode_select' | 'setup' | 'environment_select' | 'countdown' | 'active';
type Phase = 'warmup' | 'work' | 'cooldown';

export const SpinningScreen: React.FC = () => {
  const { setScreen, translate, isDeviceConnected, deviceMetrics } = useApp();
  const [view, setView] = useState<SpinningView>('mode_select');
  
  // Setup State
  const [selectedMode, setSelectedMode] = useState<'class' | 'scenic' | null>(null);
  const [level, setLevel] = useState<string>('intermediate');
  const [duration, setDuration] = useState<number>(50); // minutes
  const [env, setEnv] = useState<EnvironmentType>('studio');

  // Active Session State
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // seconds
  const [rpm, setRpm] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [isTVMode, setIsTVMode] = useState(false);

  // Derived Phase Logic
  const sessionPhase: Phase = useMemo(() => {
      const warmupDuration = 5 * 60; // 5 mins
      const cooldownDuration = 5 * 60; // 5 mins
      const totalSeconds = duration * 60;
      
      if (elapsedTime < warmupDuration) return 'warmup';
      if (elapsedTime >= totalSeconds - cooldownDuration) return 'cooldown';
      return 'work';
  }, [elapsedTime, duration]);

  useEffect(() => {
    let interval: number;
    if (view === 'active' && isActive) {
      interval = window.setInterval(() => {
        setElapsedTime(t => t + 1);
        // Simulate RPM fluctuation
        setRpm(prev => {
           const target = sessionPhase === 'warmup' || sessionPhase === 'cooldown' ? 70 : 95; 
           const noise = Math.random() * 10 - 5;
           return Math.floor(Math.max(0, Math.min(120, target + noise)));
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, isActive, sessionPhase]);

  useEffect(() => {
      let timer: number;
      if (view === 'countdown') {
          if (countdown > 0) {
              timer = window.setTimeout(() => setCountdown(c => c - 1), 1000);
          } else {
              setView('active');
              setIsActive(true);
          }
      }
      return () => clearTimeout(timer);
  }, [view, countdown]);

  const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec.toString().padStart(2, '0')}`;
  };
  
  const toggleTVMode = () => {
      if (isTVMode) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
      setIsTVMode(!isTVMode);
  };
  
  const handleModeSelect = (mode: 'class' | 'scenic') => {
      setSelectedMode(mode);
      // Determine default env
      if (mode === 'class') {
          setEnv('studio');
      } else {
          setEnv('mountains'); // Default scenic
      }
      setView('setup');
  };

  const handleStartSetup = () => {
      if (selectedMode === 'scenic') {
          setView('environment_select');
      } else {
          setCountdown(5);
          setView('countdown');
      }
  };

  const initiateCountdown = () => {
      setCountdown(5);
      setView('countdown');
  };

  // --- MODE SELECT VIEW ---
  if (view === 'mode_select') {
      return (
          <div className="animate-fadeIn h-full bg-black flex flex-col overflow-hidden">
              <div className="p-4 flex-none flex items-center justify-between border-b border-gray-800">
                  <button onClick={() => setScreen(Screen.Home)} className="flex items-center text-gray-400 hover:text-white">
                      <ChevronLeft className="w-6 h-6 mr-1" />
                      {translate('back')}
                  </button>
                  <DeviceStatusTrigger />
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <h1 className="text-3xl font-bold text-white text-center mb-8 uppercase tracking-widest">{translate('spinning.menu.title')}</h1>
                  
                  <div className="flex flex-col justify-center gap-6 max-w-md mx-auto w-full pb-10">
                      <button onClick={() => handleModeSelect('class')} className="group relative overflow-hidden rounded-2xl border-2 border-purple-500/50 hover:border-purple-500 transition-all duration-300 h-48">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black z-0"></div>
                          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                              <Bike className="w-12 h-12 text-[#00FFFF] mb-3 group-hover:scale-110 transition-transform" />
                              <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{translate('spinning.menu.class')}</h2>
                              <p className="text-gray-400 text-sm mt-1">{translate('spinning.menu.class.desc')}</p>
                          </div>
                      </button>

                      <button onClick={() => handleModeSelect('scenic')} className="group relative overflow-hidden rounded-2xl border-2 border-green-500/50 hover:border-green-500 transition-all duration-300 h-48">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 to-black z-0"></div>
                          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                              <Mountain className="w-12 h-12 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                              <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{translate('spinning.menu.scenic')}</h2>
                              <p className="text-gray-400 text-sm mt-1">{translate('spinning.menu.scenic.desc')}</p>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- SETUP VIEW ---
  if (view === 'setup') {
      return (
          <div className="animate-fadeIn h-full bg-black flex flex-col overflow-hidden">
              <div className="p-4 flex-none flex items-center justify-between border-b border-gray-800">
                  <button onClick={() => setView('mode_select')} className="flex items-center text-gray-400 hover:text-white">
                      <ChevronLeft className="w-6 h-6 mr-1" />
                      {translate('back')}
                  </button>
                  <DeviceStatusTrigger />
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <h1 className="text-2xl font-bold text-white text-center mb-6 uppercase tracking-widest">{translate('spinning.setup.title')}</h1>

                  <div className="max-w-md mx-auto w-full space-y-6 pb-10">
                      {/* Mode Indicator */}
                      <div className="text-center mb-4">
                          <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${selectedMode === 'class' ? 'border-[#00FFFF] text-[#00FFFF]' : 'border-green-500 text-green-500'}`}>
                              {selectedMode === 'class' ? translate('spinning.menu.class') : translate('spinning.menu.scenic')}
                          </span>
                      </div>

                      {/* Level Selection */}
                      <Card>
                          <h3 className="text-lg font-bold text-white mb-3 flex items-center"><Zap className="w-5 h-5 mr-2 text-yellow-500"/>{translate('spinning.setup.level')}</h3>
                          <div className="grid grid-cols-1 gap-2">
                              {['beginner', 'intermediate', 'advanced'].map(l => (
                                  <button 
                                    key={l} 
                                    onClick={() => setLevel(l)}
                                    className={`p-3 rounded-lg text-sm font-bold border transition-all flex justify-between items-center ${level === l ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                                  >
                                      {translate(`level.${l}`)}
                                      {level === l && <Check className="w-4 h-4"/>}
                                  </button>
                              ))}
                          </div>
                      </Card>

                      {/* Duration Selection */}
                      <Card>
                          <h3 className="text-lg font-bold text-white mb-3 flex items-center"><Clock className="w-5 h-5 mr-2 text-blue-500"/>{translate('spinning.setup.duration')}</h3>
                          <div className="grid grid-cols-2 gap-2">
                              {[30, 50, 60, 90].map(d => (
                                  <button 
                                    key={d} 
                                    onClick={() => setDuration(d)}
                                    className={`p-3 rounded-lg text-sm font-bold border transition-all ${duration === d ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                                  >
                                      {translate(`spinning.duration.${d}`)}
                                  </button>
                              ))}
                          </div>
                      </Card>

                      <div className="pt-4">
                          <Button onClick={handleStartSetup} className="w-full text-lg py-4">
                              {selectedMode === 'scenic' ? translate('next') : translate('start_session')}
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- ENVIRONMENT SELECT VIEW (SCENIC ONLY) ---
  if (view === 'environment_select') {
      const scenicEnvs = (['mountains', 'city'] as EnvironmentType[]); 

      return (
          <div className="animate-fadeIn h-full bg-black flex flex-col overflow-hidden">
              <div className="p-4 flex-none flex items-center justify-between border-b border-gray-800">
                  <button onClick={() => setView('setup')} className="flex items-center text-gray-400 hover:text-white">
                      <ChevronLeft className="w-6 h-6 mr-1" />
                      {translate('back')}
                  </button>
                  <DeviceStatusTrigger />
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <h1 className="text-3xl font-bold text-white text-center mb-6 uppercase tracking-widest">{translate('environment.choose')}</h1>
                  
                  <div className="grid grid-cols-2 gap-3 max-w-4xl mx-auto pb-20">
                       {scenicEnvs.map((e) => (
                          <button 
                            key={e}
                            onClick={() => setEnv(e)}
                            className={`relative h-32 rounded-xl overflow-hidden border-2 transition-all duration-300 group ${env === e ? 'border-purple-500 scale-105 shadow-[0_0_20px_rgba(138,43,226,0.5)]' : 'border-gray-800 hover:border-gray-500'}`}
                          >
                              <div 
                                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${env === e ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
                                style={{ backgroundImage: `url(${ENVIRONMENT_THUMBNAILS[e]})` }}
                              ></div>
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>

                              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                  <span className="text-sm font-bold text-white uppercase shadow-black drop-shadow-md">{translate(`environment.${e}`)}</span>
                                  {env === e && <span className="text-purple-400 text-[10px] font-bold mt-1 tracking-widest bg-black/60 px-2 py-0.5 rounded">{translate('env.selected')}</span>}
                              </div>
                          </button>
                      ))}
                  </div>

                  <div className="fixed bottom-8 left-0 right-0 px-4">
                       <div className="max-w-md mx-auto">
                            <Button onClick={initiateCountdown} className="w-full text-lg py-4 shadow-[0_0_30px_rgba(138,43,226,0.4)]">
                                <Play className="w-6 h-6 mr-2 inline-block"/>
                                {translate('start_session')}
                            </Button>
                       </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- ACTIVE & COUNTDOWN VIEW ---
  return (
    <div className="animate-fadeIn h-screen w-screen flex flex-col bg-black overflow-hidden relative">
      
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
         <VirtualEnvironment type={env} />
      </div>

       {/* COUNTDOWN OVERLAY */}
      {view === 'countdown' && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
               <div className="text-[12rem] font-black text-white animate-pulse" style={{ textShadow: '0 0 50px #8A2BE2' }}>
                   {countdown}
               </div>
          </div>
      )}

      {/* Header */}
      {!isTVMode && (
          <header className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-[100] bg-gradient-to-b from-black via-black/60 to-transparent pointer-events-auto">
            <button onClick={() => setView('setup')} className="p-2 bg-gray-900/50 rounded-full text-white backdrop-blur-md hover:bg-gray-800 border border-white/10 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-white uppercase tracking-widest drop-shadow-md">{translate(`environment.${env}`).toUpperCase()}</h1>
            <div className="flex items-center gap-3">
                <DeviceStatusTrigger />
                <CastButton isTVMode={isTVMode} onToggleTVMode={toggleTVMode} />
            </div>
          </header>
      )}
      
      {isTVMode && (
          <button 
            onClick={toggleTVMode}
            className="fixed top-6 right-6 z-[100] bg-black/50 text-white px-6 py-2 rounded-full border border-white/30 hover:bg-black/80 backdrop-blur-md font-bold tracking-wider"
          >
              {translate('tv.cast.exit')}
          </button>
      )}

      {/* COACH OVERLAY */}
      {view === 'active' && (
          <div 
            className={`
                absolute z-40 overflow-hidden rounded-2xl border-2 border-[#00FFFF]/50 bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,255,0.2)]
                transition-all duration-500
                ${isTVMode 
                    ? 'bottom-12 right-12 w-80 h-80 border-4'
                    : 'bottom-24 right-4 w-40 h-48'
                }
            `}
          >
              {/* FIXED: Changed cameraTarget from "0m 0.8m 0m" to "0m 0.4m 0m" to move model HIGHER in frame */}
              <HolographicCoach 
                isPaused={!isActive} 
                state={isActive ? 'active' : 'idle'} 
                modelUrl={SPINNING_COACH_MODEL_URL}
                cameraOrbit="0deg 80deg 4.5m"
                cameraTarget="0m 0.4m 0m" 
              />
              
              <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded animate-pulse z-50">
                  {translate('live.badge')}
              </div>
          </div>
      )}

      {/* PHASE INDICATOR (TOP) */}
      {view === 'active' && (
          <div className="absolute top-20 left-0 right-0 z-30 flex justify-center pointer-events-none">
              <div className={`px-4 py-1 rounded-full border border-white/20 backdrop-blur-md shadow-lg text-xs font-bold uppercase tracking-widest ${
                  sessionPhase === 'warmup' ? 'bg-yellow-500/80 text-black' :
                  sessionPhase === 'cooldown' ? 'bg-blue-500/80 text-white' :
                  'bg-red-500/80 text-white'
              }`}>
                  {translate(`spinning.phase.${sessionPhase}`)}
              </div>
          </div>
      )}

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-30">
            {/* Timer */}
            <div className={`mt-24 flex justify-center transition-all duration-300 ${isTVMode ? 'mt-16 transform scale-150' : ''}`}>
                <div className={`backdrop-blur-md border border-[#00FFFF]/50 px-6 py-2 rounded-full flex items-center gap-3 shadow-lg ${isTVMode ? 'bg-black/40' : 'bg-black/60'}`}>
                    <Timer className="w-5 h-5 text-[#00FFFF]" />
                    <span className="text-2xl font-mono font-bold text-white">{formatTime(elapsedTime)}</span>
                    <span className="text-xs text-gray-400 font-mono self-end mb-1">/ {duration}m</span>
                </div>
            </div>

            {/* Bottom Controls / Stats */}
            <div className={`flex justify-between items-end transition-all duration-300 ${isTVMode ? 'px-16 pb-8 scale-110' : ''}`}>
                 {/* RPM */}
                 <div className={`backdrop-blur-md border border-[#00FFFF]/30 p-4 rounded-2xl min-w-[100px] ${isTVMode ? 'bg-black/40' : 'bg-black/60'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold text-[#00FFFF]">{translate('spinning.rpm')}</span>
                    </div>
                    <span className="text-3xl font-bold text-white font-mono">{rpm}</span>
                 </div>

                 {/* HR */}
                 <div className={`backdrop-blur-md border border-purple-500/30 p-4 rounded-2xl min-w-[100px] text-right ${isTVMode ? 'bg-black/40' : 'bg-black/60'}`}>
                    <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">{translate('device.hud.hr')}</span>
                        <Activity className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-3xl font-bold text-white font-mono">
                        {isDeviceConnected ? deviceMetrics.heartRate : '--'}
                    </span>
                 </div>
            </div>
      </div>

      {/* Control Deck */}
      {!isTVMode && (
          <div className="px-4 relative z-50 bottom-4">
            <Card className="border-[#00FFFF]/30 shadow-[0_0_20px_rgba(0,255,255,0.1)] bg-black/90 backdrop-blur-xl">
                <div className="flex justify-center items-center px-4 py-2">
                     <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-lg transform transition-transform active:scale-95 ${isActive ? 'border-red-500 bg-red-900/20' : 'border-green-500 bg-green-900/20'}`}>
                         <button onClick={() => setIsActive(!isActive)} className="w-full h-full flex items-center justify-center">
                            {isActive ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
                         </button>
                     </div>
                </div>
            </Card>
          </div>
      )}
    </div>
  );
};
