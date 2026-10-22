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
  const { setScreen, translate, isDeviceConnected, openDeviceModal } = useApp();
  const [view, setView] = useState<SpinningView>('mode_select');
  
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [env, setEnv] = useState<EnvironmentType>('studio');
  const [selectedLandscapeId, setSelectedLandscapeId] = useState<string>('south-tyrol');
  const [duration, setDuration] = useState<string>('50');
  const [isTVMode, setIsTVMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const coachVideoRef = useRef<HTMLVideoElement>(null);

  const activeLandscape = SCENIC_LANDSCAPES.find(l => l.id === selectedLandscapeId) || SCENIC_LANDSCAPES[0];
  const targetDurationSeconds = parseInt(duration, 10) * 60;
  const isDurationCompleted = elapsedTime >= targetDurationSeconds;

  // Session timer
  useEffect(() => {
    let interval: number;
    if (view === 'active' && isActive) {
      interval = window.setInterval(() => setElapsedTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [view, isActive]);

  // Strict Silence Watchdog: Ensure audio and playback are COMPLETELY STOPPED when in menus or setup
  useEffect(() => {
    if (view !== 'active' || !isActive) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.muted = true;
      }
      if (coachVideoRef.current) {
        coachVideoRef.current.pause();
        coachVideoRef.current.muted = true;
      }
    }
  }, [view, isActive]);

  // Continuous playback watchdog: ensures coach and landscape videos keep playing during active session with proper sound
  useEffect(() => {
    if (view === 'active' && isActive) {
      const v = videoRef.current;
      if (v && v.paused && env === 'mountains') {
        v.muted = isMuted;
        v.volume = 1.0;
        v.play().catch(e => console.warn('Landscape video play notice:', e));
      }
      const cv = coachVideoRef.current;
      if (cv && cv.paused) {
        cv.muted = isMuted;
        cv.volume = 1.0;
        cv.play().catch(e => console.warn('Coach video play notice:', e));
      }
    }
  }, [view, isActive, isMuted, env]);

  // Synchronous user click action: launches video + audio immediately inside gesture token
  const handleStartSession = () => {
    setIsMuted(false);
    setView('active');
    setIsActive(true);
    setElapsedTime(0);

    // Direct synchronous start of scenic video with sound
    const v = videoRef.current;
    if (v && env === 'mountains') {
      v.muted = false;
      v.volume = 1.0;
      v.currentTime = 0;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn('Video direct play notice:', e);
        });
      }
    }

    // Direct synchronous start of coach video with sound in active session
    const cv = coachVideoRef.current;
    if (cv) {
      cv.muted = false;
      cv.volume = 1.0;
      cv.currentTime = 0;
      const coachPromise = cv.play();
      if (coachPromise !== undefined) {
        coachPromise.catch(e => {
          console.warn('Coach direct play notice:', e);
        });
      }
    }
  };

  const handleExitActiveSession = () => {
    setView('mode_select');
    setIsActive(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.muted = true;
      videoRef.current.currentTime = 0;
    }
    if (coachVideoRef.current) {
      coachVideoRef.current.pause();
      coachVideoRef.current.muted = true;
      coachVideoRef.current.currentTime = 0;
    }
  };

  const handleExitToHome = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.muted = true;
    }
    if (coachVideoRef.current) {
      coachVideoRef.current.pause();
      coachVideoRef.current.muted = true;
    }
    setScreen(Screen.Home);
  };

  const handleTogglePlay = () => {
    const next = !isActive;
    setIsActive(next);
    const v = videoRef.current;
    const cv = coachVideoRef.current;
    if (next) {
      if (v && env === 'mountains') {
        v.muted = isMuted;
        v.volume = 1.0;
        v.play().catch(() => {});
      }
      if (cv) {
        cv.muted = isMuted;
        cv.volume = 1.0;
        cv.play().catch(() => {});
      }
    } else {
      v?.pause();
      cv?.pause();
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
      if (!next) {
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    }
    if (coachVideoRef.current) {
      coachVideoRef.current.muted = next;
      if (!next) {
        coachVideoRef.current.volume = 1.0;
        coachVideoRef.current.play().catch(() => {});
      }
    }
  };

  // Direct user tap anywhere on media stage ensures audio and video are active and playing with sound
  const handleStageInteract = () => {
    const v = videoRef.current;
    if (v && env === 'mountains') {
      if (v.paused && isActive) {
        v.muted = isMuted;
        v.volume = 1.0;
        v.play().catch(() => {});
      } else if (v.muted && !isMuted) {
        v.muted = false;
        v.volume = 1.0;
      }
    }
    const cv = coachVideoRef.current;
    if (cv) {
      if (cv.paused && isActive) {
        cv.muted = isMuted;
        cv.volume = 1.0;
        cv.play().catch(() => {});
      } else if (cv.muted && !isMuted) {
        cv.muted = false;
        cv.volume = 1.0;
      }
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Safe localized text fallbacks to ensure ZERO raw meta keys can ever appear on screen
  const titleText = translate('spinning.title') || translate('spinning.menu.title') || 'Studio de Spinning';
  const studioTitle = translate('spinning.mode.studio.title') || translate('spinning.mode.studio') || 'Studio Virtuel';
  const studioDesc = translate('spinning.mode.studio.desc') || 'Pédalez avec le coach haute énergie dans le studio Fit-4rce-X';
  const scenicTitle = translate('spinning.mode.scenic.title') || translate('spinning.mode.scenic') || 'Paysages Panoramiques';
  const scenicDesc = translate('spinning.mode.scenic.desc') || 'Immersion dans les cols alpins avec le coach et bande-son 4K';
  const routeText = translate('spinning.setup.choose_route') || 'Choisissez votre itinéraire';
  const durationText = translate('spinning.setup.duration') || 'Durée de la séance';

  return (
    <div className="fixed inset-0 z-[2500] h-screen h-[100dvh] w-screen flex flex-col bg-black overflow-hidden font-['Poppins'] select-none">
      
      {/* 1. MEDIA STAGE: Always mounted in background to ensure zero delay and instant gesture play */}
      <div 
        onClick={handleStageInteract}
        className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center bg-black cursor-pointer"
      >
        {env === 'mountains' ? (
          <>
            {/* Backdrop thumbnail to prevent black flash */}
            <img 
              src={activeLandscape.thumbnail} 
              className="w-full h-full object-cover absolute inset-0 z-0" 
              alt={translate(activeLandscape.nameKey)}
            />

            {/* Scenic Landscape Video: Full sound, auto looping only in active session */}
            <video 
              ref={videoRef}
              src={activeLandscape.videoUrl} 
              playsInline 
              webkit-playsinline="true"
              x5-playsinline="true"
              loop 
              controls={false}
              disablePictureInPicture
              muted={view !== 'active' || isMuted}
              preload="auto"
              crossOrigin="anonymous"
              className={`w-full h-full object-cover absolute inset-0 z-10 transition-opacity duration-700 pointer-events-none ${
                view === 'active' && !isDurationCompleted ? 'opacity-95 contrast-105' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <>
            {/* STUDIO MODE: Fit-4rce-X Studio Room background */}
            <img 
              src={STUDIO_BG_URL} 
              className="w-full h-full object-cover opacity-90 contrast-110 absolute inset-0 z-0" 
              alt="Fit-4rce-X Spinning Studio"
            />
          </>
        )}

        {/* 2. PERSISTENT SPINNING COACH VIDEO (Single instance: never unmounts, plays only in active session) */}
        <div className={`transition-all duration-300 pointer-events-auto ${
          view === 'active' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${
          env === 'mountains'
            ? 'absolute right-3 sm:right-6 bottom-24 sm:bottom-28 z-30 w-24 sm:w-32 md:w-36 aspect-[9/16] rounded-none overflow-hidden border-2 border-[#b026ff] shadow-[0_0_15px_#b026ff,0_0_25px_rgba(176,38,255,0.4)] ring-1 ring-purple-300/70 bg-black flex items-center justify-center'
            : 'relative z-30 aspect-[9/16] h-full max-h-[calc(100dvh-200px)] max-w-[calc((100dvh-200px)*9/16)] sm:max-w-xs w-auto rounded-none overflow-hidden border-2 border-[#b026ff] shadow-[0_0_18px_#b026ff,0_0_30px_#8a2be2] ring-1 ring-purple-300/80 bg-black flex items-center justify-center mb-16'
        }`}>
          <video
            ref={coachVideoRef}
            src={SCENIC_COACH_VIDEO_URL}
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
            loop
            muted={view !== 'active' || isMuted}
            controls={false}
            disablePictureInPicture
            preload="auto"
            crossOrigin="anonymous"
            className="w-full h-full object-cover rounded-none block pointer-events-none"
          />
        </div>
      </div>

      {/* 3. MODE SELECT VIEW OVERLAY */}
      {view === 'mode_select' && (
        <div className="absolute inset-0 z-[600] min-h-screen h-full flex flex-col font-['Poppins'] bg-black/60 backdrop-blur-md">
          <div className="p-4 flex-none flex items-center justify-between border-b border-white/10 bg-black/40">
            <button 
              onClick={handleExitToHome} 
              className="flex items-center text-gray-300 hover:text-white font-normal uppercase text-[10px] tracking-widest transition-colors"
            >
              <ChevronLeft size={16} className="mr-1" />{translate('back')}
            </button>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-white">
              {titleText}
            </h2>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-md mx-auto w-full space-y-4">
            {/* Card 1: Virtual Studio (3D Coach) */}
            <div 
              onClick={() => { setEnv('studio'); setView('setup'); }}
              className="w-full bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-700/80 hover:border-purple-500 rounded-2xl p-5 cursor-pointer transition-all active:scale-[0.98] shadow-2xl flex items-center gap-4 group"
            >
              <div className="w-14 h-14 rounded-xl bg-purple-900/40 border border-purple-500/50 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Bike size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-purple-400 transition-colors">
                  {studioTitle}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                  {studioDesc}
                </p>
              </div>
            </div>

            {/* Card 2: Scenic Landscapes (Video 4K with audio) */}
            <div 
              onClick={() => { setEnv('mountains'); setView('setup'); }}
              className="w-full bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-700/80 hover:border-cyan-400 rounded-2xl p-5 cursor-pointer transition-all active:scale-[0.98] shadow-2xl flex items-center gap-4 group"
            >
              <div className="w-14 h-14 rounded-xl bg-cyan-900/40 border border-cyan-400/50 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                <Mountain size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-cyan-400 transition-colors">
                  {scenicTitle}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                  {scenicDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SETUP VIEW OVERLAY */}
      {view === 'setup' && (
        <div className="absolute inset-0 z-[600] min-h-screen h-full flex flex-col font-['Poppins'] bg-black/60 backdrop-blur-md">
          <div className="p-4 flex-none flex items-center justify-between border-b border-white/10 bg-black/40">
            <button 
              onClick={() => setView('mode_select')} 
              className="flex items-center text-gray-300 hover:text-white font-normal uppercase text-[10px] tracking-widest transition-colors"
            >
              <ChevronLeft size={16} className="mr-1" />{translate('back')}
            </button>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-white">
              {env === 'mountains' ? scenicTitle : studioTitle}
            </h2>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-lg mx-auto w-full space-y-5 custom-scrollbar">
            {/* Route Selection (Scenic Mode) */}
            {env === 'mountains' && (
              <section className="space-y-3">
                <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.25em] flex items-center gap-1.5">
                  <Mountain size={14} />
                  <span>{routeText}</span>
                </h3>

                <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar snap-x">
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

            {/* Target Duration Selector */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.25em] mb-3 text-center">
                {durationText}
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

            {/* Start Action Button: Initiates video audio synchronously inside direct click gesture */}
            <div className="pt-2">
              <Button 
                onClick={handleStartSession} 
                className="w-full py-4 text-xs sm:text-sm font-black uppercase tracking-[0.25em] rounded-2xl shadow-[0_0_25px_rgba(138,43,226,0.4)] active:scale-[0.98]"
              >
                {translate('start_session')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ACTIVE SESSION VIEW HUD OVERLAYS */}
      {view === 'active' && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between h-full w-full pointer-events-none">
          {/* TOP HEADER */}
          <header className="flex-none h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between z-30 pointer-events-auto">
            <button 
              onClick={handleExitActiveSession} 
              className="p-2.5 sm:p-3 bg-black/70 rounded-full text-white backdrop-blur-xl border border-white/10 shadow-2xl active:scale-90 transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Audio Mute/Unmute Toggle Button */}
              <button
                type="button"
                onClick={handleToggleMute}
                className={`p-2.5 sm:p-3 rounded-full backdrop-blur-xl border transition-all active:scale-90 ${
                  !isMuted 
                    ? 'bg-purple-900/70 border-purple-500/70 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
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

          {/* Route info badge top-left (Scenic Mode) */}
          {env === 'mountains' && (
            <div className="absolute top-16 left-3 sm:left-6 z-30 pointer-events-none">
              <div className="px-2.5 py-1 bg-black/80 backdrop-blur-md border border-cyan-500/40 flex items-center gap-2 shadow-lg max-w-[200px] sm:max-w-xs">
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
          )}

          {/* BOTTOM CONTROLS */}
          <div className="flex-none px-3 sm:px-6 py-2 sm:py-3.5 z-30 pointer-events-auto">
            <div className="flex justify-between items-center gap-2 sm:gap-4 max-w-xl mx-auto">
              <div className="flex-1 bg-black/80 backdrop-blur-2xl border border-white/10 p-2 sm:p-3.5 rounded-xl text-center shadow-2xl">
                <p className="text-[8px] sm:text-[9px] text-[#00FFFF] font-normal uppercase tracking-widest mb-0.5">
                  {translate('spinning.elapsed')}
                </p>
                <p className="text-lg sm:text-2xl font-black text-white font-mono tracking-tighter">{formatTime(elapsedTime)}</p>
              </div>

              {/* Play / Pause Toggle Button */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#8A2BE2] rounded-full flex items-center justify-center shadow-[0_0_25px_#8A2BE2] active:scale-90 transition-all shrink-0">
                <button onClick={handleTogglePlay} className="text-white flex items-center justify-center" aria-label={isActive ? "Pause" : "Play"}>
                  {isActive ? <Pause className="w-6 h-6 sm:w-8 sm:h-8" fill="white" /> : <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-0.5" fill="white" />}
                </button>
              </div>

              <button 
                onClick={openDeviceModal}
                className="flex-1 bg-black/80 backdrop-blur-2xl border border-white/10 p-2 sm:p-3.5 rounded-xl text-center shadow-2xl transition-all active:scale-95 hover:border-purple-500/50"
                title={translate(isDeviceConnected ? 'device.status.connected_tooltip' : 'device.status.connect_tooltip')}
              >
                <p className="text-[8px] sm:text-[9px] text-[#8A2BE2] font-normal uppercase tracking-widest mb-0.5">
                  {translate('spinning.ems_band')}
                </p>
                <p className="text-xs sm:text-sm font-bold text-white tracking-wider flex items-center justify-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isDeviceConnected ? 'bg-emerald-400 animate-pulse' : 'bg-purple-500'}`} />
                  {translate(isDeviceConnected ? 'device.status.connected' : 'device.status.connect')}
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinningScreen;