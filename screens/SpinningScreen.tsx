import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import { ChevronLeft, Play, Pause, Bike, Mountain, X } from 'lucide-react';
import VirtualEnvironment, { EnvironmentType } from '../components/common/VirtualEnvironment.tsx';
import CastButton from '../components/common/CastButton.tsx';
import { DeviceStatusTrigger } from '../components/common/DeviceStatusTrigger.tsx';
import { HolographicCoach } from '../components/common/HolographicCoach.tsx';
import Button from '../components/common/Button.tsx';

type SpinningView = 'mode_select' | 'setup' | 'active';

const SPINNING_VIDEO_URL = "https://fit-4rce-x.s3.eu-north-1.amazonaws.com/Android_spinning-video.mp4";

export const SpinningScreen: React.FC = () => {
  const { setScreen, translate, isDeviceConnected, deviceMetrics } = useApp();
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
          <div className="animate-fadeIn h-full bg-black flex flex-col overflow-hidden font-['Poppins']">
              <div className="p-4 flex-none flex items-center justify-between border-b border-gray-900">
                  <button onClick={() => setScreen(Screen.Home)} className="flex items-center text-gray-400 hover:text-white font-normal uppercase text-[10px] tracking-widest">
                      <ChevronLeft size={16} className="mr-1" />{translate('back')}
                  </button>
                  <DeviceStatusTrigger />
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <h1 className="text-3xl font-black text-white text-center mb-10 uppercase tracking-tighter pt-8">{translate('spinning.menu.title')}</h1>
                  <div className="flex flex-col gap-6 max-w-md mx-auto w-full pb-10">
                      <button onClick={() => { setEnv('studio'); setView('setup'); }} className="h-44 bg-zinc-900/50 border border-gray-800 rounded-[2rem] flex flex-col items-center justify-center p-4 text-center transition-all active:scale-95">
                          <Bike className="w-10 h-10 text-[#00FFFF] mb-3" />
                          <h2 className="text-lg font-normal text-white uppercase tracking-widest">{translate('spinning.mode.studio')}</h2>
                      </button>
                      <button onClick={() => { setEnv('mountains'); setView('setup'); }} className="h-44 bg-zinc-900/50 border border-gray-800 rounded-[2rem] flex flex-col items-center justify-center p-4 text-center transition-all active:scale-95">
                          <Mountain className="w-10 h-10 text-purple-400 mb-3" />
                          <h2 className="text-lg font-normal text-white uppercase tracking-widest">{translate('spinning.mode.scenic')}</h2>
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'setup') {
      return (
          <div className="animate-fadeIn h-full bg-black flex flex-col overflow-hidden font-['Poppins'] p-4 pt-12 custom-scrollbar overflow-y-auto pb-10">
                <header className="flex justify-between items-center mb-8">
                    <button onClick={() => setView('mode_select')} className="text-gray-500 hover:text-white flex items-center gap-1 uppercase text-[10px] tracking-widest">
                      <ChevronLeft size={20}/> {translate('back')}
                    </button>
                    <h1 className="text-xl font-black text-white uppercase tracking-[0.2em]">{translate('spinning.setup.title')}</h1>
                    <div className="w-8" />
                </header>
                <div className="max-w-md mx-auto w-full space-y-12">
                    <section>
                        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4 text-center">{translate('spinning.setup.level')}</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <button 
                                onClick={() => setLevel('beginner')} 
                                className={`h-16 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${level === 'beginner' ? 'text-[#00FFFF] bg-cyan-950/40 border-2 border-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.2)]' : 'text-gray-500 bg-zinc-900/50 border border-gray-800'}`}
                            >
                                {translate('level.beginner')}
                            </button>
                            <button 
                                onClick={() => setLevel('intermediate')} 
                                className={`h-16 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${level === 'intermediate' ? 'text-[#FFBF00] bg-amber-950/40 border-2 border-[#FFBF00] shadow-[0_0_20px_rgba(255,191,0,0.2)]' : 'text-gray-500 bg-zinc-900/50 border border-gray-800'}`}
                            >
                                {translate('level.intermediate')}
                            </button>
                            <button 
                                onClick={() => setLevel('advanced')} 
                                className={`h-16 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${level === 'advanced' ? 'text-[#FF0000] bg-red-950/40 border-2 border-[#FF0000] shadow-[0_0_20px_rgba(255,0,0,0.2)]' : 'text-gray-500 bg-zinc-900/50 border border-gray-800'}`}
                            >
                                {translate('level.advanced')}
                            </button>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4 text-center">{translate('spinning.setup.duration')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {['30', '50', '60', '90'].map(d => (
                              <button 
                                  key={d}
                                  onClick={() => setDuration(d)} 
                                  className={`h-16 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${duration === d ? 'text-white bg-purple-900/40 border-2 border-purple-500 shadow-[0_0_20px_rgba(138,43,226,0.2)]' : 'text-gray-500 bg-zinc-900/50 border border-gray-800'}`}
                              >
                                  {translate(`spinning.duration.${d}`)}
                              </button>
                            ))}
                        </div>
                    </section>

                    <div className="pt-4">
                        <Button onClick={() => { setView('active'); setIsActive(true); setIsPrepPhase(true); }} className="w-full py-6 text-sm font-black uppercase tracking-[0.4em] shadow-2xl">
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
      
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-[100]">
        <button onClick={() => setScreen(Screen.Home)} className="p-3 bg-black/60 rounded-full text-white backdrop-blur-xl border border-white/10 shadow-2xl active:scale-90 transition-all"><X size={20} /></button>
        <div className="flex items-center gap-4">
            <DeviceStatusTrigger />
            <CastButton isTVMode={isTVMode} onToggleTVMode={() => setIsTVMode(!isTVMode)} />
        </div>
      </header>

      <div className="absolute inset-x-6 top-24 bottom-40 z-40 rounded-[3rem] overflow-hidden border border-purple-500/40 bg-black shadow-[0_0_60px_rgba(138,43,226,0.4)]">
          <video ref={videoRef} src={SPINNING_VIDEO_URL} loop muted autoPlay playsInline className="w-full h-full object-cover opacity-60 contrast-125" />
          
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
              <HolographicCoach isPaused={!isActive || isPrepPhase} modelUrl="https://raw.githubusercontent.com/elhabibullah/3D-model-1/main/Spinning_coach_compressed.glb?v=12350" />
          </div>

          {isPrepPhase && (
             <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center animate-fadeIn">
                 <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.5em] mb-4 drop-shadow-[0_0_10px_#00FFFF]">ENGINE INITIALIZING</h4>
                 <div className="text-[12rem] font-black text-white leading-none drop-shadow-[0_0_40px_rgba(0,255,255,0.7)]">{countdown}</div>
             </div>
          )}
      </div>

      <div className="absolute bottom-10 left-0 right-0 z-50 px-6">
          <div className="flex justify-between items-center gap-4 max-w-xl mx-auto">
                <div className="flex-1 bg-black/60 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl text-center shadow-2xl">
                    <p className="text-[9px] text-[#00FFFF] font-normal uppercase tracking-widest mb-1">ELAPSED</p>
                    <p className="text-3xl font-black text-white font-mono tracking-tighter">{formatTime(elapsedTime)}</p>
                </div>
                <div className="w-24 h-24 bg-[#8A2BE2] rounded-full flex items-center justify-center shadow-[0_0_40px_#8A2BE2] active:scale-90 transition-all">
                    <button onClick={() => setIsActive(!isActive)} className="text-white">
                        {isActive ? <Pause size={40} fill="white" /> : <Play size={40} fill="white" className="ml-1.5" />}
                    </button>
                </div>
                <div className="flex-1 bg-black/60 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl text-center shadow-2xl">
                    <p className="text-[9px] text-red-500 font-normal uppercase tracking-widest mb-1">HEART RATE</p>
                    <p className="text-3xl font-black text-white font-mono tracking-tighter">{isDeviceConnected ? deviceMetrics.heartRate : '--'}</p>
                </div>
          </div>
      </div>
    </div>
  );
};