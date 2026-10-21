import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import { ChevronLeft, Play, Pause, Bike, Mountain, X, Check } from 'lucide-react';
import VirtualEnvironment, { EnvironmentType } from '../components/common/VirtualEnvironment.tsx';
import { SPINNING_COACH_MODEL_URL } from '../lib/constants.ts';
import CastButton from '../components/common/CastButton.tsx';
import { DeviceStatusTrigger } from '../components/common/DeviceStatusTrigger.tsx';
import Button from '../components/common/Button.tsx';

import { useGLTF } from '@react-three/drei';
import { preloadWorkoutModels } from '../lib/modelCache.ts';

type SpinningView = 'mode_select' | 'setup' | 'active';

export interface ScenicLandscape {
  id: string;
  nameKey: string;
  countryKey: string;
  durationHint: string;
  thumbnail: string;
  videoUrl: string;
}

export const SCENIC_LANDSCAPES: ScenicLandscape[] = [
  {
    id: 'south-tyrol',
    nameKey: 'spinning.landscape.south_tyrol.name',
    countryKey: 'spinning.landscape.south_tyrol.country',
    durationHint: '45 min',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://my-habibullah-pull-zone.b-cdn.net/45%20minute%20Fat%20Burning%20Indoor%20Cycling%20Workout%20Alps%20Lake%20Tour%20Garmin%204K%20Video%20-%20South%20Tyrol.mp4'
  },
  {
    id: 'italy-alps',
    nameKey: 'spinning.landscape.italy_alps.name',
    countryKey: 'spinning.landscape.italy_alps.country',
    durationHint: '45 min',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://my-habibullah-pull-zone.b-cdn.net/45%20minute%20Indoor%20Cycling%20Fat%20Burning%20Workout%20-%20Telemetry%204K%20Video%20-%20Italy%20Alps.mp4'
  },
  {
    id: 'switzerland',
    nameKey: 'spinning.landscape.switzerland.name',
    countryKey: 'spinning.landscape.switzerland.country',
    durationHint: '90 min',
    thumbnail: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://my-habibullah-pull-zone.b-cdn.net/90%20Minute%20Indoor%20Cycling%20Videos%20With%20Music%20%20Virtual%20Bike%20Ride%20Around%20Switzerland.mp4'
  },
  {
    id: 'german-dutch-border',
    nameKey: 'spinning.landscape.german_dutch.name',
    countryKey: 'spinning.landscape.german_dutch.country',
    durationHint: '60+ min',
    thumbnail: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://my-habibullah-pull-zone.b-cdn.net/Spinning%20Video%20Long%20Ride%20-%20201%20km%20von%20Coesfeld%20zum%20Niederrhein%2C%20NL%20und%20zur%C3%BCck%20Teil.mp4'
  }
];

const SPINNING_VIDEO_URL = "https://fit-4rce-x.s3.eu-north-1.amazonaws.com/Android_spinning-video.mp4";
const SCENIC_COACH_VIDEO_URL = "https://my-habibullah-pull-zone.b-cdn.net/Test%20for%20Scenic%20spinning%20coach%20sequences%20warm%20up%20phase.mp4";

export const SpinningScreen: React.FC = () => {
  const { setScreen, translate, isDeviceConnected, deviceMetrics, openDeviceModal, language } = useApp();
  const [view, setView] = useState<SpinningView>('mode_select');
  
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdown, setCountdown] = useState(10);
  const [isPrepPhase, setIsPrepPhase] = useState(false);
  const [env, setEnv] = useState<EnvironmentType>('studio');
  const [selectedLandscapeId, setSelectedLandscapeId] = useState<string>('south-tyrol');
  const [level, setLevel] = useState<string>('intermediate');
  const [duration, setDuration] = useState<string>('50');
  const [isTVMode, setIsTVMode] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const coachVideoRef = useRef<HTMLVideoElement>(null);

  const activeLandscape = SCENIC_LANDSCAPES.find(l => l.id === selectedLandscapeId) || (env === 'mountains' ? SCENIC_LANDSCAPES[0] : null);
  const targetDurationSeconds = parseInt(duration, 10) * 60;
  const isDurationCompleted = elapsedTime >= targetDurationSeconds;

  // Preload spinning coach 3D model immediately when entering screen
  useEffect(() => {
    preloadWorkoutModels([SPINNING_COACH_MODEL_URL]);
    try {
      useGLTF.preload(SPINNING_COACH_MODEL_URL, '/draco/');
    } catch (e) {
      // Ignore
    }
  }, []);

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

      const coachV = coachVideoRef.current;
      if (coachV) {
          if (isActive && !isPrepPhase) {
              coachV.play().catch(() => {});
          } else {
              coachV.pause();
          }
      }
  }, [isActive, isPrepPhase]);

  const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[2500] h-screen w-screen flex flex-col bg-black overflow-hidden font-['Poppins']">
      {/* 1. Mode Selection View Overlay */}
      {view === 'mode_select' && (
        <div className="absolute inset-0 z-[600] animate-fadeIn min-h-screen h-full bg-black flex flex-col font-['Poppins']">
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
      )}

      {/* 2. Setup View Overlay */}
      {view === 'setup' && (
        <div className="absolute inset-0 z-[600] animate-fadeIn min-h-screen h-full bg-black flex flex-col font-['Poppins'] p-4 sm:p-6 pb-24 overflow-y-auto custom-scrollbar">
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
            {/* Scenic Route Landscape Selector - EXCLUSIVELY FOR SCENIC ROUTE (#scenic) */}
            {env === 'mountains' && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em]">
                    {translate('spinning.setup.landscape')}
                  </h3>
                  <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider">
                    {selectedLandscapeId ? '✓ ' + (translate('done') || 'Sélectionné') : ''}
                  </span>
                </div>

                {/* Horizontal Scrollable Carousel of Landscapes */}
                <div className="flex gap-3 overflow-x-auto pb-2 pt-1 custom-scrollbar snap-x">
                  {SCENIC_LANDSCAPES.map(item => {
                    const isSelected = selectedLandscapeId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedLandscapeId(prev => prev === item.id ? '' : item.id)}
                        className={`flex-none w-44 sm:w-48 text-left rounded-2xl overflow-hidden border transition-all active:scale-95 snap-start group relative ${
                          isSelected
                            ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.35)] scale-[1.02] ring-1 ring-cyan-400 bg-cyan-950/30'
                            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative h-24 sm:h-28 w-full overflow-hidden">
                          <img
                            src={item.thumbnail}
                            alt={translate(item.nameKey)}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                          
                          {/* Checkbox Badge */}
                          <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/50' 
                              : 'bg-black/60 border border-white/30 text-transparent'
                          }`}>
                            <Check size={14} className={isSelected ? 'stroke-[3]' : 'opacity-0'} />
                          </div>

                          {/* Duration Badge */}
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/75 border border-white/10 text-[9px] font-mono font-semibold text-white">
                            {item.durationHint}
                          </div>
                        </div>

                        {/* Title & Country (Translated in all languages) */}
                        <div className="p-2.5 bg-zinc-950/80">
                          <h4 className="text-xs font-bold text-white truncate leading-tight group-hover:text-cyan-400 transition-colors">
                            {translate(item.nameKey)}
                          </h4>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {translate(item.countryKey)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Level / Intensity Selection */}
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

            {/* Duration Selection */}
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

            {/* Start Action Button */}
            <div className="pt-2">
              <Button 
                onClick={() => { setView('active'); setIsActive(true); setIsPrepPhase(true); setCountdown(10); }} 
                className="w-full py-4 text-xs sm:text-sm font-black uppercase tracking-[0.25em] shadow-[0_0_25px_rgba(138,43,226,0.4)] active:scale-[0.98]"
              >
                {translate('start_session')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-0"><VirtualEnvironment type={env} isPaused={!isActive} /></div>
      
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-[500] pointer-events-auto">
        <button onClick={() => setScreen(Screen.Home)} className="p-3 bg-black/60 rounded-full text-white backdrop-blur-xl border border-white/10 shadow-2xl active:scale-90 transition-all"><X size={20} /></button>
        <div className="flex items-center gap-3">
            <DeviceStatusTrigger showLabel />
            <CastButton isTVMode={isTVMode} onToggleTVMode={() => setIsTVMode(!isTVMode)} />
        </div>
      </header>

      <div className="absolute inset-x-4 sm:inset-x-6 top-20 sm:top-24 bottom-36 sm:bottom-40 z-40 rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-purple-500/40 bg-black shadow-[0_0_60px_rgba(138,43,226,0.4)]">
          {env === 'mountains' && activeLandscape ? (
            <>
              {/* Studio plan fallback revealed when duration expires (fade out) */}
              <img 
                src="https://www.dropbox.com/scl/fi/jryp732ar5tl7eqydrcee/spinning-room.jpg?rlkey=i18o66uec35kej86ztaxjx7mg&st=8s9umlh6&raw=1" 
                className="w-full h-full object-cover opacity-40 contrast-125 absolute inset-0 z-0" 
                alt="Spinning Studio"
              />

              {/* Scenic Landscape Video Background */}
              <video 
                ref={videoRef}
                src={activeLandscape.videoUrl} 
                playsInline 
                loop 
                muted
                className={`w-full h-full object-cover absolute inset-0 z-10 transition-opacity duration-1000 ${
                  isDurationCompleted ? 'opacity-0' : 'opacity-95 contrast-105'
                }`}
              />

              {/* Route HUD info badge top-left (No audio controls, strictly visual) */}
              <div className="absolute top-4 left-4 z-30 pointer-events-none">
                <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-cyan-500/30 flex items-center gap-2 shadow-lg max-w-[200px] sm:max-w-xs">
                  <Mountain size={14} className="text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-white uppercase tracking-wider leading-none truncate">
                      {translate(activeLandscape.nameKey)}
                    </p>
                    <p className="text-[8px] text-cyan-300 leading-tight truncate">
                      {translate(activeLandscape.countryKey)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <img 
              src="https://www.dropbox.com/scl/fi/jryp732ar5tl7eqydrcee/spinning-room.jpg?rlkey=i18o66uec35kej86ztaxjx7mg&st=8s9umlh6&raw=1" 
              className="w-full h-full object-cover opacity-40 contrast-125" 
              alt="Spinning Studio"
            />
          )}
          
          {/* COACH CONTAINER: Spinning Coach video tightly framed to exact 9:16 rectangle with luminous LED mauve outline */}
          <div className={`absolute z-30 pointer-events-auto transition-all duration-500 flex items-center ${
            env === 'mountains'
              ? 'right-3 sm:right-6 top-3 sm:top-5 bottom-3 sm:bottom-5 justify-end'
              : 'inset-3 sm:inset-5 justify-center'
          }`}>
              <div className="relative h-full aspect-[9/16] max-h-full max-w-[50vw] rounded-none overflow-hidden border-2 border-purple-400 shadow-[0_0_15px_#c084fc,0_0_30px_#a855f7,0_0_45px_rgba(168,85,247,0.85)] ring-1 ring-purple-300/80 bg-black">
                <video
                  ref={coachVideoRef}
                  src={SCENIC_COACH_VIDEO_URL}
                  playsInline
                  loop
                  className="w-full h-full object-cover rounded-none block"
                />
              </div>
          </div>

          {isPrepPhase && (
             <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center animate-fadeIn p-4 text-center">
                 <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 drop-shadow-[0_0_10px_#00FFFF]">
                    {translate('spinning.engine_init')}
                 </h4>
                 <div className="text-8xl sm:text-[12rem] font-black text-white leading-none drop-shadow-[0_0_40px_rgba(0,255,255,0.7)]">{countdown}</div>
             </div>
          )}
      </div>

      <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 z-50 px-4 sm:px-6">
          <div className="flex justify-between items-center gap-2 sm:gap-4 max-w-xl mx-auto">
                <div className="flex-1 bg-black/70 backdrop-blur-2xl border border-white/10 p-3 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-2xl">
                    <p className="text-[8px] sm:text-[9px] text-[#00FFFF] font-normal uppercase tracking-widest mb-0.5 sm:mb-1">
                        {translate('spinning.elapsed')}
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
                    title={translate(isDeviceConnected ? 'device.status.connected_tooltip' : 'device.status.connect_tooltip')}
                >
                    <p className="text-[8px] sm:text-[9px] text-red-400 font-bold uppercase tracking-widest mb-0.5 sm:mb-1">
                        {isDeviceConnected ? translate('spinning.heart_rate') : translate('spinning.ems_band')}
                    </p>
                    <p className={`text-xl sm:text-3xl font-black font-mono tracking-tighter ${isDeviceConnected ? 'text-white' : 'text-purple-300 text-xs sm:text-sm py-1 font-bold animate-pulse'}`}>
                        {isDeviceConnected ? deviceMetrics.heartRate : translate('spinning.connect')}
                    </p>
                </button>
          </div>
      </div>
    </div>
  );
};