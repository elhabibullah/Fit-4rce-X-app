import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import { ChevronLeft, Play, Pause, X, Map as MapIcon, Activity, Zap } from 'lucide-react';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import VirtualEnvironment, { EnvironmentType, ENVIRONMENT_THUMBNAILS } from '../components/common/VirtualEnvironment.tsx';
import CastButton from '../components/common/CastButton.tsx';
import { generateWorkoutWithGemini } from '../services/aiService.ts';
import Loader from '../components/common/Loader.tsx';
import RunnerMap from '../components/common/RunnerMap.tsx';
import { DeviceStatusTrigger } from '../components/common/DeviceStatusTrigger.tsx';
import { HolographicCoach } from '../components/common/HolographicCoach.tsx';

type RunningView = 'config' | 'generating' | 'briefing' | 'environment_select' | 'active';

const RunningScreen: React.FC = () => {
  const { translate, isDeviceConnected, deviceMetrics, language, setScreen, setIsGeneratingWorkout, setSelectedPlan, showStatus } = useApp();
  const [view, setView] = useState<RunningView>('config');
  const [event, setEvent] = useState<string>('5km');
  const [level, setLevel] = useState<string>('intermediate');
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isPrepPhase, setIsPrepPhase] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [time, setTime] = useState(0);
  const [env, setEnv] = useState<EnvironmentType>('track');
  const [isTVMode, setIsTVMode] = useState(false);
  const [showMap, setShowMap] = useState(true);

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
          interval = window.setInterval(() => setTime(t => t + 1), 1000);
      }
    }
    return () => clearInterval(interval);
  }, [view, isActive, isPrepPhase]);

  const handleGenerateRun = async () => {
      setView('generating');
      setIsGeneratingWorkout(true);
      try {
          const prompt = `Generate a comprehensive high-performance running protocol for a ${level} level athlete targeting a ${event} run. 
          The output must be in ${language}. 
          Return a JSON object with sections: 'briefing', 'warmup', 'drills', and 'main'. 
          Each section should contain a summary of the plan for that phase.`;
          
          const plan = await generateWorkoutWithGemini(prompt, language);
          if (plan) {
            setGeneratedPlan(plan);
            setSelectedPlan(plan);
            setView('briefing');
          } else throw new Error();
      } catch { 
          setView('config'); 
          showStatus("Neural sequence fail.");
      } finally {
          setIsGeneratingWorkout(false);
      }
  };

  if (view === 'config') {
      return (
          <div className="animate-fadeIn h-full flex flex-col bg-black overflow-hidden font-['Poppins']">
              <div className="p-4 flex-none flex items-center justify-between border-b border-gray-900">
                  <button onClick={() => setScreen(Screen.Home)} className="flex items-center text-gray-400 hover:text-white font-normal uppercase text-[10px] tracking-widest">
                      <ChevronLeft className="w-5 h-5 mr-1" />{translate('back')}
                  </button>
                  <DeviceStatusTrigger />
              </div>
              <div className="flex-1 overflow-y-auto p-4 pb-24 custom-scrollbar">
                  <h1 className="text-3xl font-black text-white text-center mb-8 uppercase tracking-tighter pt-4">{translate('running.track.title')}</h1>
                  <div className="max-w-md mx-auto space-y-10">
                      
                      <section>
                          <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 px-1 text-center">{translate('running.track.distance')}</h3>
                          <div className="grid grid-cols-2 gap-3">
                              {['100m', '200m', '400m', '5km', '10km'].map(d => (
                                  <button 
                                    key={d} 
                                    onClick={() => setEvent(d)} 
                                    className={`p-4 rounded-xl text-[10px] font-bold uppercase border transition-all ${event === d ? 'bg-purple-900/20 border-purple-500 text-white shadow-[0_0_15px_rgba(138,43,226,0.2)]' : 'bg-gray-900 border-gray-800 text-gray-500'}`}
                                  >
                                    {translate(`running.dist.${d}`)}
                                  </button>
                              ))}
                          </div>
                      </section>

                      <section>
                        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 px-1 text-center">{translate('running.track.skill_level')}</h3>
                        <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => setLevel('beginner')} className={`p-4 rounded-xl text-[10px] font-bold uppercase border transition-all ${level === 'beginner' ? 'bg-cyan-950/20 border-[#00FFFF] text-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'bg-gray-950 border-gray-800 text-gray-600'}`}>{translate('level.beginner')}</button>
                             <button onClick={() => setLevel('intermediate')} className={`p-4 rounded-xl text-[10px] font-bold uppercase border transition-all ${level === 'intermediate' ? 'bg-amber-950/20 border-[#FFBF00] text-[#FFBF00] shadow-[0_0_15px_rgba(255,191,0,0.2)]' : 'bg-gray-950 border-gray-800 text-gray-600'}`}>{translate('level.intermediate')}</button>
                             <button onClick={() => setLevel('advanced')} className={`p-4 rounded-xl text-[10px] font-bold uppercase border transition-all ${level === 'advanced' ? 'bg-red-950/20 border-[#FF0000] text-[#FF0000] shadow-[0_0_15px_rgba(255,0,0,0.2)]' : 'bg-gray-950 border-gray-800 text-gray-600'}`}>{translate('level.advanced')}</button>
                             <button onClick={() => setLevel('elite')} className={`p-4 rounded-xl text-[10px] font-bold uppercase border transition-all ${level === 'elite' ? 'bg-purple-950/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(138,43,226,0.2)]' : 'bg-gray-950 border-gray-800 text-gray-600'}`}>{translate('level.elite')}</button>
                        </div>
                      </section>

                      <div className="pt-6">
                          <Button onClick={handleGenerateRun} className="w-full py-6 text-sm font-black uppercase tracking-[0.2em] shadow-2xl">
                              {translate('running.track.generate')}
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'generating') return <div className="flex flex-col items-center justify-center min-h-screen bg-black text-purple-500"><Loader /><p className="mt-8 animate-pulse text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Neural Network...</p></div>;

  if (view === 'briefing') {
      return (
          <div className="animate-fadeIn h-full flex flex-col bg-black p-6 font-['Poppins'] pb-12">
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{translate('running.briefing.title')}</h1>
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-6">Distance: {translate(`running.dist.${event}`)} // Level: {translate(`level.${level}`)}</p>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                  <div className="bg-zinc-900/40 p-8 rounded-[2rem] border border-white/10 shadow-2xl space-y-8">
                    
                    {typeof generatedPlan?.description === 'string' ? (
                        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line font-medium">
                            {generatedPlan.description}
                        </p>
                    ) : (
                        <div className="space-y-6">
                            <section>
                                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">{translate('running.briefing.label.briefing')}</h4>
                                <p className="text-gray-300 text-sm">{generatedPlan?.briefing || generatedPlan?.description}</p>
                            </section>
                            <section>
                                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">{translate('running.briefing.label.warmup')}</h4>
                                <p className="text-gray-300 text-sm">{generatedPlan?.warmup}</p>
                            </section>
                            <section>
                                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">{translate('running.briefing.label.drills')}</h4>
                                <p className="text-gray-300 text-sm">{generatedPlan?.drills}</p>
                            </section>
                            <section>
                                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">{translate('running.briefing.label.main')}</h4>
                                <p className="text-gray-300 text-sm">{generatedPlan?.main}</p>
                            </section>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">Biometric Targets</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                <p className="text-[8px] text-gray-500 uppercase font-bold">Target Zone</p>
                                <p className="text-xs text-white font-bold">AEROBIC {level === 'elite' ? 'ELITE' : 'STABLE'}</p>
                            </div>
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                <p className="text-[8px] text-gray-500 uppercase font-bold">Estimated Burn</p>
                                <p className="text-xs text-white font-bold">{['100m', '200m', '400m'].includes(event) ? '50-100' : '450+'} KCAL</p>
                            </div>
                        </div>
                    </div>
                  </div>
              </div>
              <div className="mt-8 shrink-0">
                <Button onClick={() => setView('environment_select')} className="w-full py-6 font-black uppercase tracking-widest shadow-[0_0_30px_rgba(138,43,226,0.2)]">
                    INITIALIZE ENVIRONMENT
                </Button>
              </div>
          </div>
      );
  }

  if (view === 'environment_select') {
      const availableEnvs: { type: EnvironmentType; labelKey: string }[] = [
          { type: 'mountains_run', labelKey: 'running.env.mountain' },
          { type: 'city', labelKey: 'running.env.city' }
      ];

      return (
          <div className="animate-fadeIn h-full bg-black p-6 font-['Poppins'] pb-12 flex flex-col overflow-y-auto custom-scrollbar">
               <header className="flex-none p-2 flex items-center mb-8 pt-4">
                  <button onClick={() => setView('briefing')} className="flex items-center text-gray-400 hover:text-white font-normal uppercase text-[10px] tracking-widest">
                      <ChevronLeft className="w-5 h-5 mr-1" />{translate('back')}
                  </button>
               </header>
               <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-12 text-center"># {translate('running.env.title')}</h1>
               <div className="flex-1 grid grid-cols-1 gap-6 max-w-md mx-auto w-full mb-12">
                    {availableEnvs.map((envItem) => (
                        <button key={envItem.type} onClick={() => { setEnv(envItem.type); setView('active'); setIsActive(true); setIsPrepPhase(true); }} className="h-44 relative overflow-hidden rounded-[2.5rem] border border-white/5 group active:scale-95 transition-all shadow-2xl">
                            <img src={ENVIRONMENT_THUMBNAILS[envItem.type as keyof typeof ENVIRONMENT_THUMBNAILS]} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                            <h2 className="absolute bottom-8 left-10 font-normal uppercase tracking-[0.2em] text-white text-2xl">## {translate(envItem.labelKey)}</h2>
                        </button>
                    ))}
               </div>
               <div className="mt-auto px-4 max-w-md mx-auto w-full">
                    <Button onClick={() => { setEnv('mountains_run'); setView('active'); setIsActive(true); setIsPrepPhase(true); }} className="w-full py-6 font-black uppercase tracking-widest shadow-2xl">
                        {translate('start_session')}
                    </Button>
               </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[2500] h-screen w-screen flex flex-col bg-black overflow-hidden font-['Poppins']">
        <div className="absolute inset-0 z-0">
            {showMap ? (
                <div className="h-full w-full opacity-60 contrast-125 saturate-150 grayscale-[0.5]">
                    <RunnerMap />
                </div>
            ) : (
                <VirtualEnvironment type={env} isPaused={!isActive || isPrepPhase} />
            )}
        </div>
        
        <header className="flex-none p-6 flex items-center justify-between z-[100] bg-gradient-to-b from-black/90 to-transparent">
            <button onClick={() => setScreen(Screen.Home)} className="p-3 bg-black/60 backdrop-blur-xl rounded-full text-white border border-white/10 shadow-2xl active:scale-90 transition-all"><X size={20}/></button>
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setShowMap(!showMap)} 
                    className={`p-3 rounded-full border transition-all ${showMap ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'bg-black/60 border-white/10 text-gray-400'}`}
                >
                    <MapIcon size={20} />
                </button>
                <DeviceStatusTrigger />
                <CastButton isTVMode={isTVMode} onToggleTVMode={() => setIsTVMode(!isTVMode)} />
            </div>
        </header>

        <div className="flex-1 relative z-10 flex flex-col justify-center px-6">
             <div className={`transition-all duration-700 h-[50vh] w-full rounded-[4rem] border ${showMap ? 'border-cyan-500/40 bg-black/30' : 'border-orange-500/40 bg-black/40'} overflow-hidden backdrop-blur-md relative shadow-[0_0_60px_rgba(255,140,0,0.1)]`}>
                 <div className="absolute inset-0 z-20 pointer-events-none">
                    <HolographicCoach isPaused={!isActive || isPrepPhase} modelUrl="https://fit-4rce-x.s3.eu-north-1.amazonaws.com/Android_coach.glb" />
                 </div>
                 
                 {isPrepPhase && (
                    <div className="absolute inset-0 z-[120] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center animate-fadeIn">
                        <h4 className="text-[10px] font-black text-[#FFBF00] uppercase tracking-[0.5em] mb-4 drop-shadow-[0_0_10px_#FFBF00]">BIO-SYNC START</h4>
                        <div className="text-[12rem] font-black text-white leading-none drop-shadow-[0_0_40px_rgba(255,191,0,0.6)]">{countdown}</div>
                    </div>
                 )}

                 {/* TOP HUD OVERLAY */}
                 <div className="absolute top-8 inset-x-8 flex justify-between z-30 pointer-events-none">
                    <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md">
                        <Activity size={14} className="text-red-500 animate-pulse" />
                        <span className="text-xl font-black text-white font-mono">{isDeviceConnected ? deviceMetrics.heartRate : '72'}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md">
                        <Zap size={14} className="text-yellow-400" />
                        <span className="text-xl font-black text-white font-mono">{isDeviceConnected ? Math.floor(deviceMetrics.caloriesBurned) : '0'}</span>
                    </div>
                 </div>
             </div>
        </div>

        <div className="flex-none px-6 pb-12 z-20">
            <div className="max-w-xl mx-auto bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-2xl">
                <div className="flex justify-between items-center px-4">
                    <div className="text-center">
                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">ELAPSED</p>
                        <span className="text-3xl font-black text-white font-mono tracking-tighter">{Math.floor(time/60)}:{String(time%60).padStart(2,'0')}</span>
                    </div>
                    
                    <button 
                        onClick={() => setIsActive(!isActive)} 
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-[0_0_40px_rgba(0,0,0,0.5)] active:scale-90 ${isActive ? 'bg-red-600' : 'bg-green-600'}`}
                    >
                        {isActive ? <Pause size={40} fill="white" /> : <Play size={40} fill="white" className="ml-1.5" />}
                    </button>

                    <div className="text-center">
                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Pace</p>
                        <span className="text-3xl font-black text-cyan-400 font-mono tracking-tighter">05:20</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default RunningScreen;