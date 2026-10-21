import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import { ChevronLeft, Play, Pause, Bike, Mountain, X, Check, Volume2, VolumeX } from 'lucide-react';
import { EnvironmentType } from '../components/common/VirtualEnvironment.tsx';
import CastButton from '../components/common/CastButton.tsx';
import { DeviceStatusTrigger } from '../components/common/DeviceStatusTrigger.tsx';
import Button from '../components/common/Button.tsx';

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

const STUDIO_BG_URL = "/assets/spinning-room.jpg";
const SCENIC_COACH_VIDEO_URL = "https://my-habibullah-pull-zone.b-cdn.net/Test%20for%20Scenic%20spinning%20coach%20sequences%20warm%20up%20phase.mp4";

export const SpinningScreen: React.FC = () => {
  const { setScreen, translate, isDeviceConnected, deviceMetrics, openDeviceModal } = useApp();
  const [view, setView] = useState<SpinningView>('mode_select');
  
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdown, setCountdown] = useState(10);
  const [isPrepPhase, setIsPrepPhase] = useState(false);
  const [env, setEnv] = useState<EnvironmentType>('studio');
  const [selectedLandscapeId, setSelectedLandscapeId] = useState<string>('south-tyrol');
  const [duration, setDuration] = useState<string>('50');
  const [isTVMode, setIsTVMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const coachVideoRef = useRef<HTMLVideoElement>(null);

  const activeLandscape = SCENIC_LANDSCAPES.find(l => l.id === selectedLandscapeId) || (env === 'mountains' ? SCENIC_LANDSCAPES[0] : null);
  const targetDurationSeconds = parseInt(duration, 10) * 60;
  const isDurationCompleted = elapsedTime >= targetDurationSeconds;

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
          v.muted = isMuted;
          if (isActive && !isPrepPhase) {
              v.play().catch(() => {});
          } else {
              v.pause();
          }
      }

      const coachV = coachVideoRef.current;
      if (coachV) {
          coachV.muted = isMuted;
          if (isActive && !isPrepPhase) {
              coachV.play().catch(() => {});
          } else {
              coachV.pause();
          }
      }
  }, [isActive, isPrepPhase, isMuted]);

  const formatTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[2500] h-screen h-[100dvh] w-screen flex flex-col bg-black overflow-hidden font-['Poppins']">
      
      {/* BACKGROUND IMAGE: Studio photo in Studio mode, Scenic landscape thumbnail in Mountains mode */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-black">
        <img 
          src={env === 'mountains' && activeLandscape ? activeLandscape.thumbnail : STUDIO_BG_URL} 
          className="w-full h-full object-cover opacity-85 contrast-110" 
          alt="Spinning Backdrop"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/75 pointer-events-none" />
      </div>

      {/* 1. Mode Selection View Overlay */}
      {view === 'mode_select' && (
        <div className="absolute inset-0 z-[600] min-h-screen h-full flex flex-col font-['Poppins']">
          <div className="p-4 flex-none flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
            <button 
              onClick={() => setScreen(Screen.Home)} 
              className="flex items-center text-gray-300 hover:text-white font-normal uppercase text-[10px] tracking-widest transition-colors"
            >
              <ChevronLeft size={16} className="mr-1" />{translate('back')}
            </button>
            <div className="flex items-center gap-2">
              <DeviceStatusTrigger />
              <CastButton isTVMode={isTVMode} onToggleTVMode={() => setIsTVMode(!isTVMode)} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar flex flex-col items-center justify-center">
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-8 uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {translate('spinning.menu.title')}
            </h1>
            <div className="flex flex-col gap-4 max-w-md mx-auto w-full pb-10">
              <button 
                onClick={() => { setEnv('studio'); setView('setup'); }} 
                className="h-36 sm:h-40 bg-black/65 border border-purple-500/40 hover:border-cyan-400 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center p-4 text-center transition-all active:scale-95 shadow-2xl group backdrop-blur-xl"
              >
                <Bike className="w-9 h-9 text-[#00FFFF] mb-2.5 transition-transform group-hover:scale-110" />
                <h2 className="text-base font-semibold text-white uppercase tracking-wider">{translate('spinning.mode.studio')}</h2>
              </button>
              <button 
                onClick={() => { setEnv('mountains'); setView('setup'); }} 
                className="h-36 sm:h-40 bg-black/65 border border-purple-500/40 hover:border-purple-400 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center p-4 text-center transition-all active:scale-95 shadow-2xl group backdrop-blur-xl"
              >
                <Mountain className="w-9 h-9 text-purple-400 mb-2.5 transition-transform group-hover:scale-110" />
                <h2 className="text-base font-semibold text-white uppercase tracking-wider">{translate('spinning.mode.scenic')}</h2>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Setup View Overlay (Centered modal, studio/landscape photo visible in background) */}
      {view === 'setup' && (
        <div className="absolute inset-0 z-[600] min-h-screen h-full flex flex-col font-['Poppins'] p-4 sm:p-6 pb-24 overflow-y-auto custom-scrollbar">
          <header className="flex-none flex items-center justify-between gap-2 mb-6 pb-3 border-b border-white/10 bg-black/40 backdrop-blur-md px-3 py-2 rounded-2xl">
            <button 
              onClick={() => setView('mode_select')} 
              className="text-gray-300 hover:text-white flex items-center gap-1 uppercase text-[10px] tracking-widest transition-colors shrink-0 py-1"
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

          <div className="max-w-md mx-auto w-full space-y-6 sm:space-y-8 my-auto bg-black/75 backdrop-blur-xl border border-purple-500/30 p-5 sm:p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.85)]">
            {/* Scenic Route Landscape Selector - Only for Mountains / Scenic mode */}
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

                {/* Compact Horizontal Scrollable Carousel of Landscapes */}
                <div className="flex gap-3 overflow-x-auto pb-2 pt-1 custom-scrollbar snap-x">
                  {SCENIC_LANDSCAPES.map(item => {
                    const isSelected = selectedLandscapeId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedLandscapeId(item.id)}
                        className={`flex-none w-44 sm:w-48 text-left rounded-2xl overflow-hidden border transition-all active:scale-95 snap-start group relative ${
                          isSelected
                            ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.35)] scale-[1.02] ring-1 ring-cyan-400 bg-cyan-950/40'
                            : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="relative h-24 sm:h-28 w-full overflow-hidden">
                          <img
                            src={item.thumbnail}
                            alt={translate(item.nameKey)}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                          
                          <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/50' 
                              : 'bg-black/60 border border-white/30 text-transparent'
                          }`}>
                            <Check size={14} className={isSelected ? 'stroke-[3]' : 'opacity-0'} />
                          </div>

                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/75 border border-white/10 text-[9px] font-mono font-semibold text-white">
                            {item.durationHint}
                          </div>
                        </div>

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

            {/* Target Duration Selector (Original rounded-xl buttons) */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.25em] mb-3 text-center">
                {translate('spinning.setup.duration')}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {['30', '50', '60', '90'].map(d => (
                  <button 
                    key={d}
                    onClick={() => setDuration(d)} 
                    className={`py-3 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center ${
                      duration === d 
                        ? 'text-white bg-purple-900/60 border-2 border-purple-500 shadow-[0_0_15px_rgba(138,43,226,0.4)] scale-[1.02]' 
                        : 'text-gray-400 bg-zinc-900/80 border border-gray-800 hover:border-gray-700'
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
                onClick={() => { 
                  setView('active'); 
                  setIsActive(true); 
                  setIsPrepPhase(true); 
                  setCountdown(10); 
                  setIsMuted(false);
                }} 
                className="w-full py-4 text-xs sm:text-sm font-black uppercase tracking-[0.25em] rounded-2xl shadow-[0_0_25px_rgba(138,43,226,0.4)] active:scale-[0.98]"
              >
                {translate('start_session')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACTIVE SESSION VIEW */}
      {view === 'active' && (
        <div className="absolute inset-0 z-10 flex flex-col h-full w-full">
          {/* TOP HEADER */}
          <header className="flex-none h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between z-30 pointer-events-auto">
            <button 
              onClick={() => { setView('mode_select'); setIsActive(false); }} 
              className="p-2.5 sm:p-3 bg-black/70 rounded-full text-white backdrop-blur-xl border border-white/10 shadow-2xl active:scale-90 transition-all"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsMuted(m => !m)}
                  className={`p-2.5 sm:p-3 rounded-full backdrop-blur-xl border transition-all active:scale-90 ${
                    !isMuted 
                      ? 'bg-purple-900/60 border-purple-500/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                      : 'bg-black/70 border-white/10 text-gray-400'
                  }`}
                  title={isMuted ? "Activer le son" : "Couper le son"}
                  aria-label={isMuted ? "Activer le son" : "Couper le son"}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <DeviceStatusTrigger showLabel />
                <CastButton isTVMode={isTVMode} onToggleTVMode={() => setIsTVMode(!isTVMode)} />
            </div>
          </header>

          {/* MAIN MEDIA STAGE */}
          <div className="flex-1 min-h-0 relative w-full overflow-hidden flex items-center justify-center p-2">
              {env === 'mountains' && activeLandscape ? (
                <>
                  {/* Backdrop scenic thumbnail: prevents any studio room flash while video connects */}
                  <img 
                    src={activeLandscape.thumbnail} 
                    className="w-full h-full object-cover absolute inset-0 z-0" 
                    alt={translate(activeLandscape.nameKey)}
                  />

                  {/* Scenic Landscape Video Background (Fills whole stage with full sound) */}
                  <video 
                    ref={videoRef}
                    src={activeLandscape.videoUrl} 
                    playsInline 
                    loop 
                    muted={isMuted}
                    className={`w-full h-full object-cover absolute inset-0 z-10 transition-opacity duration-700 ${
                      isDurationCompleted ? 'opacity-0' : 'opacity-95 contrast-105'
                    }`}
                  />

                  {/* Route HUD info badge top-left */}
                  <div className="absolute top-3 left-3 z-30 pointer-events-none">
                    <div className="px-2.5 py-1 rounded-none bg-black/80 backdrop-blur-md border border-cyan-500/40 flex items-center gap-2 shadow-lg max-w-[200px] sm:max-w-xs">
                      <Mountain size={13} className="text-cyan-400 shrink-0" />
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

                  {/* SCENIC COACH: Compact PIP widget anchored on the right - strictly rectangular (no rounded frames), glowing mauve LED outline directly on the video */}
                  <div className={`absolute right-3 sm:right-6 bottom-3 sm:bottom-4 z-30 pointer-events-auto transition-opacity duration-300 ${isPrepPhase ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="relative w-24 sm:w-32 md:w-36 aspect-[9/16] rounded-none overflow-hidden border-2 border-[#b026ff] shadow-[0_0_15px_#b026ff,0_0_25px_rgba(176,38,255,0.4)] ring-1 ring-purple-300/70 bg-black flex items-center justify-center">
                      <video
                        ref={coachVideoRef}
                        src={SCENIC_COACH_VIDEO_URL}
                        playsInline
                        loop
                        muted={isMuted}
                        className="w-full h-full object-cover rounded-none block"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* STUDIO MODE: Fit-4rce-X Studio Room background */}
                  <img 
                    src={STUDIO_BG_URL} 
                    className="w-full h-full object-cover opacity-90 contrast-110 absolute inset-0 z-0" 
                    alt="Fit-4rce-X Spinning Studio"
                  />

                  {/* Centered studio coach video: bounded height so bottom controls never get pushed off, strictly rectangular rounded-none with purple LED border */}
                  <div className={`relative flex items-center justify-center h-full max-h-full z-30 pointer-events-auto transition-opacity duration-300 ${isPrepPhase ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="relative aspect-[9/16] h-full max-h-[calc(100dvh-200px)] max-w-[calc((100dvh-200px)*9/16)] sm:max-w-xs w-auto rounded-none overflow-hidden border-2 border-[#b026ff] shadow-[0_0_18px_#b026ff,0_0_30px_#8a2be2] ring-1 ring-purple-300/80 bg-black flex items-center justify-center">
                      <video
                        ref={coachVideoRef}
                        src={SCENIC_COACH_VIDEO_URL}
                        playsInline
                        loop
                        muted={isMuted}
                        className="w-full h-full object-cover rounded-none block"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 10s Prep Countdown Overlay: Solid opaque to prevent any flash of video during prep countdown */}
              {isPrepPhase && (
                 <div className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 text-center">
                     <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 drop-shadow-[0_0_10px_#00FFFF]">
                        {translate('spinning.engine_init')}
                     </h4>
                     <div className="text-7xl sm:text-[10rem] font-black text-white leading-none drop-shadow-[0_0_40px_rgba(0,255,255,0.7)]">{countdown}</div>
                 </div>
              )}
          </div>

          {/* BOTTOM CONTROLS (Original rounded aesthetic: rounded-xl cards, rounded-full play/pause button) */}
          <div className="flex-none px-3 sm:px-6 py-2 sm:py-3.5 z-30 pointer-events-auto">
              <div className="flex justify-between items-center gap-2 sm:gap-4 max-w-xl mx-auto">
                    <div className="flex-1 bg-black/80 backdrop-blur-2xl border border-white/10 p-2 sm:p-3.5 rounded-xl text-center shadow-2xl">
                        <p className="text-[8px] sm:text-[9px] text-[#00FFFF] font-normal uppercase tracking-widest mb-0.5">
                            {translate('spinning.elapsed')}
                        </p>
                        <p className="text-lg sm:text-2xl font-black text-white font-mono tracking-tighter">{formatTime(elapsedTime)}</p>
                    </div>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#8A2BE2] rounded-full flex items-center justify-center shadow-[0_0_25px_#8A2BE2] active:scale-90 transition-all shrink-0">
                        <button onClick={() => setIsActive(!isActive)} className="text-white flex items-center justify-center" aria-label={isActive ? "Pause" : "Play"}>
                            {isActive ? <Pause className="w-6 h-6 sm:w-8 sm:h-8" fill="white" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-0.5" fill="white" />}
                        </button>
                    </div>
                    <button 
                        onClick={openDeviceModal}
                        className="flex-1 bg-black/80 backdrop-blur-2xl border border-white/10 p-2 sm:p-3.5 rounded-xl text-center shadow-2xl transition-all active:scale-95 hover:border-purple-500/50"
                        title={translate(isDeviceConnected ? 'device.status.connected_tooltip' : 'device.status.connect_tooltip')}
                    >
                        <p className="text-[8px] sm:text-[9px] text-red-400 font-bold uppercase tracking-widest mb-0.5">
                            {isDeviceConnected ? translate('spinning.heart_rate') : translate('spinning.ems_band')}
                        </p>
                        <p className={`text-lg sm:text-2xl font-black font-mono tracking-tighter ${isDeviceConnected ? 'text-white' : 'text-purple-300 text-[10px] sm:text-xs py-0.5 font-bold animate-pulse'}`}>
                            {isDeviceConnected ? deviceMetrics.heartRate : translate('spinning.connect')}
                        </p>
                    </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};