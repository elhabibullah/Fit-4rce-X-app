
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp.ts';
import { Screen, WorkoutPlan } from '../types.ts';
import { ChevronLeft, Play, Pause, Footprints, Timer, Zap, Activity, Mic, Settings, List, Map as MapIcon, PlayCircle } from 'lucide-react';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import { COACH_MODEL_URL } from '../constants.ts'; 
import VirtualEnvironment, { EnvironmentType, ENVIRONMENT_THUMBNAILS } from '../components/common/VirtualEnvironment.tsx';
import CastButton from '../components/common/CastButton.tsx';
import { generateWorkoutWithGemini } from '../services/aiService.ts';
import Loader from '../components/common/Loader.tsx';
import RunnerMap from '../components/common/RunnerMap.tsx';
import { DeviceStatusTrigger } from '../components/common/DeviceStatusTrigger.tsx';
import { HolographicCoach } from '../components/common/HolographicCoach.tsx';

type RunningView = 'config' | 'generating' | 'briefing' | 'environment_select' | 'countdown' | 'active';

const RunningScreen: React.FC = () => {
  const { setScreen, translate, isDeviceConnected, deviceMetrics, setIsCoachOpen, language } = useApp();
  
  // View State
  const [view, setView] = useState<RunningView>('config');

  // Configuration State
  const [event, setEvent] = useState<string>('100m');
  const [level, setLevel] = useState<string>('intermediate');
  const [focus, setFocus] = useState<string>('technique');
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);

  // Run State
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [distance, setDistance] = useState(0); // km
  const [pace, setPace] = useState(0); // min/km
  const [vo2Max, setVo2Max] = useState(45); // simulated
  
  // Environment & TV State
  const [env, setEnv] = useState<EnvironmentType>('track');
  const [isTVMode, setIsTVMode] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // GPS State
  const lastPositionRef = useRef<{ lat: number; lon: number; time: number } | null>(null);

  // Constants for Focus Logic
  const ENDURANCE_EVENTS = ['5k', '10k', 'half_marathon', 'marathon'];
  const SPRINT_EVENTS = ['100m', '200m', '400m', '800m', '1500m'];

  // Haversine Formula to calculate distance between two points
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    // Default environment based on event type
    if (event.includes('m') && !event.includes('k')) { // 100m, 200m, etc.
        setEnv('track');
    } else {
        setEnv('city');
    }
    
    // Reset focus to a safe default when event changes, based on type
    const isEndurance = ENDURANCE_EVENTS.includes(event);
    setFocus(isEndurance ? 'just_run' : 'technique');

  }, [event]);

  // Real GPS Tracking Logic with Drift Filter
  useEffect(() => {
    let watchId: number;

    if (view === 'active' && isActive) {
        if (!navigator.geolocation) {
            console.warn("Geolocation is not supported by this browser.");
            return;
        }

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, speed, accuracy } = pos.coords;
                const now = Date.now();

                if (accuracy > 20) return;

                if (lastPositionRef.current) {
                    const distKm = getDistanceFromLatLonInKm(lastPositionRef.current.lat, lastPositionRef.current.lon, latitude, longitude);
                    const timeDiffSeconds = (now - lastPositionRef.current.time) / 1000;
                    
                    const calculatedSpeedMPS = timeDiffSeconds > 0 ? (distKm * 1000) / timeDiffSeconds : 0;
                    const effectiveSpeed = speed !== null ? speed : calculatedSpeedMPS;

                    if (effectiveSpeed > 0.5) {
                        setDistance(d => d + distKm);
                        
                        if (effectiveSpeed > 0) {
                            const speedKmph = effectiveSpeed * 3.6;
                            const currentPace = 60 / speedKmph;
                            setPace(prev => (prev === 0 ? currentPace : (prev * 0.7 + currentPace * 0.3)));
                        }
                        
                        setVo2Max(prev => Math.min(85, Math.max(30, prev + (Math.random() * 0.1 - 0.05))));
                    }
                }
                
                lastPositionRef.current = { lat: latitude, lon: longitude, time: now };
            },
            (err) => console.error("GPS Tracking Error:", err),
            { enableHighAccuracy: true, maximumAge: 0 }
        );
    }

    return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [view, isActive]);

  useEffect(() => {
    let interval: number;
    if (view === 'active' && isActive) {
      interval = window.setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, isActive]);

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

  const handleGenerateRun = async () => {
      // Direct jump for "Just Run" option
      if (focus === 'just_run') {
          setGeneratedPlan({ 
              title: "Free Run", 
              description: `Targeting ${event} at ${level} level.`, 
              exercises: [] 
          });
          setView('briefing');
          return;
      }

      setView('generating');
      const prompt = `Generate a specialized running workout plan for a ${level} level athlete. 
      The event target is ${event}. 
      The specific focus of this session is ${focus}. 
      Structure the response with detailed paragraphs for Warmup, Main Set, and Cooldown.`;
      
      try {
          const plan = await generateWorkoutWithGemini(prompt, language);
          if (plan) {
              setGeneratedPlan(plan);
              setView('briefing');
          } else {
              setGeneratedPlan({ title: "Run", description: "Standard Run", exercises: [] });
              setView('briefing');
          }
      } catch (e) {
          console.error(e);
          setView('config'); 
      }
  };
  
  const startSessionFlow = () => {
      setView('environment_select');
  };

  const initiateCountdown = () => {
      setCountdown(5);
      setView('countdown');
  };

  if (view === 'config') {
      const isEndurance = ENDURANCE_EVENTS.includes(event);
      // Logic: If Endurance, show distance/pacing focus. If Sprint, show technique/power focus.
      const availableFocusOptions = isEndurance 
        ? ['just_run', 'pacing', 'distance', 'tempo', 'recovery'] 
        : ['technique', 'block_starts', 'plyometrics', 'speed_endurance', 'intervals'];

      return (
          // Fixed height container with scrolling
          <div className="animate-fadeIn h-full flex flex-col bg-black">
              <div className="p-4 flex-none flex items-center justify-between border-b border-gray-800">
                  <button onClick={() => setScreen(Screen.Home)} className="flex items-center text-gray-400 hover:text-white">
                      <ChevronLeft className="w-6 h-6 mr-1" />
                      {translate('back')}
                  </button>
                  <DeviceStatusTrigger />
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 pb-20 custom-scrollbar">
                  <h1 className="text-3xl font-bold text-white text-center mb-2 uppercase tracking-widest">{translate('running.title')}</h1>
                  <p className="text-center text-gray-400 mb-8">{translate('running.mode.select')}</p>

                  <div className="max-w-md mx-auto space-y-6">
                      <Card>
                          <h3 className="text-lg font-bold text-white mb-3 flex items-center"><Activity className="w-5 h-5 mr-2 text-orange-500"/>{translate('running.setup.event')}</h3>
                          <div className="grid grid-cols-3 gap-2">
                              {[...SPRINT_EVENTS, ...ENDURANCE_EVENTS].map(e => (
                                  <button 
                                    key={e} 
                                    onClick={() => setEvent(e)}
                                    className={`p-2 rounded-lg text-xs font-bold border transition-all ${event === e ? 'bg-orange-600 border-orange-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                                  >
                                      {translate(`event.${e}`) || e}
                                  </button>
                              ))}
                          </div>
                      </Card>

                      <Card>
                          <h3 className="text-lg font-bold text-white mb-3 flex items-center"><Zap className="w-5 h-5 mr-2 text-yellow-500"/>{translate('running.setup.level')}</h3>
                          <div className="grid grid-cols-2 gap-2">
                              {['beginner', 'intermediate', 'advanced', 'elite'].map(l => (
                                  <button 
                                    key={l} 
                                    onClick={() => setLevel(l)}
                                    className={`p-2 rounded-lg text-sm font-bold border transition-all ${level === l ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                                  >
                                      {translate(`level.${l}`)}
                                  </button>
                              ))}
                          </div>
                      </Card>

                       <Card>
                          <h3 className="text-lg font-bold text-white mb-3 flex items-center"><Settings className="w-5 h-5 mr-2 text-blue-500"/>{translate('running.setup.focus')}</h3>
                          <div className="grid grid-cols-2 gap-2">
                              {availableFocusOptions.map(f => (
                                  <button 
                                    key={f} 
                                    onClick={() => setFocus(f)}
                                    className={`p-2 rounded-lg text-sm font-bold border transition-all ${focus === f ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                                  >
                                      {translate(`focus.${f}`) || f}
                                  </button>
                              ))}
                          </div>
                      </Card>

                      <div className="pt-4 space-y-4">
                          <Button onClick={handleGenerateRun} className="w-full text-lg py-4">
                              {translate('running.setup.generate')}
                          </Button>
                          
                          <Button onClick={() => setIsCoachOpen(true)} variant="secondary" className="w-full flex items-center justify-center">
                              <Mic className="w-5 h-5 mr-2" />
                              {translate('running.setup.talkToCoach')}
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'generating') {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-black">
              <Loader />
              <p className="mt-4 text-orange-400 animate-pulse">{translate('workout.generating')}</p>
          </div>
      );
  }

  if (view === 'briefing' && generatedPlan) {
      return (
          <div className="animate-fadeIn h-full flex flex-col bg-black">
              <div className="p-4 flex-none flex items-center justify-between border-b border-gray-800">
                  <button onClick={() => setView('config')} className="flex items-center text-gray-400 hover:text-white">
                      <ChevronLeft className="w-6 h-6 mr-1" />
                      {translate('back')}
                  </button>
                  <DeviceStatusTrigger />
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 pb-20 custom-scrollbar">
                  <h1 className="text-2xl font-bold text-white text-center mb-6">{translate('running.plan.briefing')}</h1>
                  
                  <div className="max-w-md mx-auto space-y-4">
                      <Card className="border-orange-500/50">
                          <h2 className="text-xl font-bold text-white">{generatedPlan.title}</h2>
                          <p className="text-gray-400 text-sm mt-1">{generatedPlan.description}</p>
                      </Card>

                      <div className="space-y-4">
                          {generatedPlan.warmup && generatedPlan.warmup.length > 0 && (
                              <Card className="bg-gray-900/50">
                                  <h3 className="text-orange-400 font-bold uppercase text-xs mb-3 border-b border-orange-500/30 pb-1">{translate('spinning.phase.warmup')}</h3>
                                  <ul className="text-gray-300 text-sm space-y-4">
                                      {generatedPlan.warmup.map((ex, i) => (
                                          <li key={i} className="flex flex-col">
                                              <span className="font-bold text-white text-base mb-1">{ex.name}</span>
                                              <span className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{ex.description}</span>
                                          </li>
                                      ))}
                                  </ul>
                              </Card>
                          )}

                          <Card className="bg-gray-900/80 border-l-4 border-orange-500">
                               <h3 className="text-orange-400 font-bold uppercase text-xs mb-3 border-b border-orange-500/30 pb-1">{translate('spinning.phase.work')}</h3>
                                <ul className="text-white text-sm space-y-4">
                                      {generatedPlan.exercises.map((ex, i) => (
                                          <li key={i} className="flex flex-col">
                                              <span className="font-bold text-lg text-orange-100 mb-1">{ex.name}</span>
                                              <span className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{ex.description}</span>
                                          </li>
                                      ))}
                                </ul>
                          </Card>
                          
                           {generatedPlan.cooldown && generatedPlan.cooldown.length > 0 && (
                              <Card className="bg-gray-900/50">
                                  <h3 className="text-blue-400 font-bold uppercase text-xs mb-3 border-b border-blue-500/30 pb-1">{translate('spinning.phase.cooldown')}</h3>
                                  <ul className="text-gray-300 text-sm space-y-4">
                                      {generatedPlan.cooldown.map((ex, i) => (
                                          <li key={i} className="flex flex-col">
                                              <span className="font-bold text-white text-base mb-1">{ex.name}</span>
                                              <span className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{ex.description}</span>
                                          </li>
                                      ))}
                                  </ul>
                              </Card>
                          )}
                      </div>

                      <Button onClick={startSessionFlow} className="w-full text-lg py-4 mt-6 shadow-[0_0_30px_rgba(249,115,22,0.4)]">
                          <PlayCircle className="w-6 h-6 mr-2 inline-block"/>
                          {translate('running.plan.start')}
                      </Button>
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'environment_select') {
      return (
          // Fixed container with proper scrolling
          <div className="animate-fadeIn h-full flex flex-col bg-black">
              <div className="p-4 flex-none flex items-center justify-between border-b border-gray-800">
                  <button onClick={() => setView('briefing')} className="flex items-center text-gray-400 hover:text-white">
                      <ChevronLeft className="w-6 h-6 mr-1" />
                      {translate('back')}
                  </button>
                  <DeviceStatusTrigger />
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 pb-20 custom-scrollbar">
                  <h1 className="text-3xl font-bold text-white text-center mb-6 uppercase tracking-widest">{translate('environment.choose')}</h1>
                  
                  <div className="grid grid-cols-2 gap-3 max-w-4xl mx-auto">
                       {[
                           { id: 'track', label: translate('environment.track') },
                           { id: 'city', label: translate('environment.city') },
                           { id: 'trail', label: translate('environment.trail') },
                           { id: 'mountains_run', label: translate('environment.mountains_run') }
                       ].map((e) => (
                          <button 
                            key={e.id}
                            onClick={() => setEnv(e.id as EnvironmentType)}
                            className={`relative h-32 rounded-xl overflow-hidden border-2 transition-all duration-300 group ${env === e.id ? 'border-orange-500 scale-105 shadow-[0_0_20px_rgba(249,115,22,0.5)]' : 'border-gray-800 hover:border-gray-500'}`}
                          >
                              <div 
                                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${env === e.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
                                style={{ backgroundImage: `url(${ENVIRONMENT_THUMBNAILS[e.id as keyof typeof ENVIRONMENT_THUMBNAILS]})` }}
                              ></div>
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                              
                              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                  <span className="text-sm font-bold text-white uppercase shadow-black drop-shadow-md text-center px-1">{e.label}</span>
                                  {env === e.id && <span className="text-orange-400 text-[10px] font-bold mt-1 tracking-widest bg-black/60 px-2 py-0.5 rounded">{translate('env.selected')}</span>}
                              </div>
                          </button>
                      ))}
                  </div>

                  <div className="mt-8 px-4">
                       <div className="max-w-md mx-auto">
                            <Button onClick={initiateCountdown} className="w-full text-lg py-4 shadow-[0_0_30px_rgba(249,115,22,0.4)]">
                                <Play className="w-6 h-6 mr-2 inline-block"/>
                                {translate('start_session')}
                            </Button>
                       </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- ACTIVE VIEW (FLEXBOX LAYOUT REFACTOR) ---
  return (
    <div className="animate-fadeIn h-screen w-screen flex flex-col bg-black overflow-hidden relative">
      
      {/* 1. BACKGROUND LAYER (Absolute, Full Screen) */}
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

      {/* 2. HEADER (Fixed at Top) */}
      {!isTVMode && (
          <header className="flex-none p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black via-black/60 to-transparent">
            <button onClick={() => setView('environment_select')} className="p-2 bg-gray-900/50 rounded-full text-white backdrop-blur-md hover:bg-gray-800 border border-white/10 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-white uppercase tracking-widest drop-shadow-md">
                {translate(`environment.${env}`).toUpperCase()}
            </h1>
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

      {/* 3. MAIN VIEWPORT (Flexible Space) */}
      <div className="flex-1 relative z-10 flex flex-col justify-center">
        {/* HUD Overlay */}
        <div className="w-full flex flex-col justify-between h-full p-6">
            {/* Top Center Timer */}
            <div className={`mt-10 flex justify-center transition-all duration-300 ${isTVMode ? 'mt-20 transform scale-150' : ''}`}>
                <div className={`backdrop-blur-md border border-orange-500/50 px-6 py-2 rounded-full flex items-center gap-3 shadow-lg ${isTVMode ? 'bg-black/40' : 'bg-black/60'}`}>
                    <Timer className="w-5 h-5 text-orange-500" />
                    <span className="text-2xl font-mono font-bold text-white">{formatTime(time)}</span>
                </div>
            </div>

            {/* Middle Stats (TV Mode) */}
            {isTVMode && (
                <div className="flex justify-between px-12 items-center flex-1">
                     <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl text-center">
                         <Footprints className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                         <p className="text-4xl font-bold text-white font-mono">{pace.toFixed(1)}</p>
                         <p className="text-xs text-gray-300">{translate('running.pace')}</p>
                     </div>
                     <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl text-center">
                         <MapIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                         <p className="text-4xl font-bold text-white font-mono">{distance.toFixed(2)}</p>
                         <p className="text-xs text-gray-300">km</p>
                     </div>
                </div>
            )}

            {/* Floating Stats */}
            <div className={`flex justify-between items-end transition-all duration-300 ${isTVMode ? 'px-16 pb-8 scale-110' : 'mt-auto'}`}>
                 <div className={`backdrop-blur-md border border-blue-500/30 p-4 rounded-2xl min-w-[120px] ${isTVMode ? 'bg-black/40' : 'bg-black/60'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <Footprints className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-gray-400 uppercase tracking-wider">{translate('running.pace')}</span>
                    </div>
                    <span className="text-3xl font-bold text-white font-mono">{pace.toFixed(1)}</span>
                 </div>

                 <div className={`backdrop-blur-md border border-purple-500/30 p-4 rounded-2xl min-w-[120px] text-right ${isTVMode ? 'bg-black/40' : 'bg-black/60'}`}>
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
      </div>

      {/* COACH OVERLAY */}
      {view === 'active' && (
          <div 
            className={`
                absolute z-40 overflow-hidden rounded-2xl border-2 border-orange-500/50 bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(249,115,22,0.2)]
                transition-all duration-500
                ${isTVMode 
                    ? 'bottom-12 right-12 w-80 h-80 border-4'
                    : 'bottom-24 right-4 w-40 h-48'
                }
            `}
          >
              <HolographicCoach 
                isPaused={!isActive} 
                state={isActive ? 'active' : 'idle'} 
                modelUrl={COACH_MODEL_URL}
                cameraOrbit="0deg 85deg 3m"
                cameraTarget="0m 0.9m 0m"
              />
              
              <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded animate-pulse z-50">
                  {translate('live.badge')}
              </div>
          </div>
      )}

      {/* 4. CONTROL DECK (Fixed at Bottom, always visible) */}
      {!isTVMode && (
          <div className="flex-none px-4 pb-6 pt-2 z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
            <div className="h-40 w-full rounded-2xl overflow-hidden border border-gray-700 shadow-lg mb-4 relative bg-black/70">
                 <RunnerMap />
                 <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm p-2 rounded-lg z-[400]">
                     <p className="text-[10px] text-gray-400 uppercase font-bold">{translate('gps.distance')}</p>
                     <p className="text-xl font-mono font-bold text-white">{distance.toFixed(2)} <span className="text-xs font-normal text-gray-400">km</span></p>
                 </div>
            </div>

            <Card className="border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)] bg-black/90 backdrop-blur-xl">
                <div className="flex justify-between items-center px-4">
                     <div className="text-center">
                         <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">{translate('run.vo2')}</p>
                         <span className="text-xl font-bold text-white">{Math.floor(vo2Max)}</span>
                     </div>

                     <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-lg transform transition-transform active:scale-95 ${isActive ? 'border-red-500 bg-red-900/20' : 'border-green-500 bg-green-900/20'}`}>
                         <button onClick={() => setIsActive(!isActive)} className="w-full h-full flex items-center justify-center">
                            {isActive ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
                         </button>
                     </div>

                      <div className="text-center">
                         <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">{translate('run.zone')}</p>
                         <span className="text-xl font-bold text-green-400">2.4</span>
                     </div>
                </div>
            </Card>
          </div>
      )}
    </div>
  );
};

export default RunningScreen;
