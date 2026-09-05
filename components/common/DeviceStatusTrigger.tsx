import React from 'react';
import { Watch, Zap } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';

interface DeviceStatusTriggerProps {
  showLabel?: boolean;
  variant?: 'pill' | 'circle';
  className?: string;
}

export const DeviceStatusTrigger: React.FC<DeviceStatusTriggerProps> = ({ 
  showLabel = false, 
  variant = 'pill',
  className = '' 
}) => {
  const { isDeviceConnected, openDeviceModal, language } = useApp();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openDeviceModal();
  };

  if (variant === 'circle' && !showLabel) {
    return (
      <button 
        onClick={handleClick}
        className={`relative p-2 rounded-full border transition-all duration-300 active:scale-95 flex items-center justify-center ${
          isDeviceConnected 
            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]' 
            : 'bg-neutral-900/90 border-purple-500/40 text-purple-300 hover:text-white hover:border-purple-400 shadow-md'
        } ${className}`}
        aria-label="Connecter Bracelet EMS"
        title={isDeviceConnected ? "Bracelet EMS Connecté" : "Connecter le Bracelet EMS"}
      >
        <Watch className={`w-4 h-4 sm:w-5 sm:h-5 ${isDeviceConnected ? 'animate-pulse' : ''}`} />
        <span className={`absolute -top-1 -right-1 text-[7px] font-black px-1 rounded-full uppercase leading-tight font-mono ${
          isDeviceConnected ? 'bg-emerald-500 text-black' : 'bg-purple-600 text-white'
        }`}>
          EMS
        </span>
      </button>
    );
  }

  return (
    <button 
      onClick={handleClick}
      className={`px-3 py-1.5 rounded-full border transition-all duration-300 active:scale-95 flex items-center gap-2 text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
        isDeviceConnected 
          ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:bg-emerald-900/50' 
          : 'bg-purple-950/40 border-purple-500/50 text-purple-200 hover:text-white hover:border-purple-400 hover:bg-purple-900/40 shadow-lg'
      } ${className}`}
      aria-label="Connecter Bracelet EMS"
      title={isDeviceConnected ? "Bracelet EMS Connecté & Synchronisé" : "Cliquez pour connecter vos bandes EMS"}
    >
      <div className="relative flex items-center justify-center">
        <Watch className={`w-4 h-4 ${isDeviceConnected ? 'text-emerald-400 animate-pulse' : 'text-purple-400'}`} />
        <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
          isDeviceConnected ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-amber-400 animate-ping'
        }`} />
      </div>

      <div className="flex items-center gap-1.5 text-[10px]">
        <span className="font-black tracking-widest text-white">EMS</span>
        <span className={`text-[9px] font-mono ${isDeviceConnected ? 'text-emerald-400 font-bold' : 'text-purple-300'}`}>
          {isDeviceConnected 
            ? (language === 'fr' ? 'Actif' : 'Active') 
            : (language === 'fr' ? 'Connecter' : 'Connect')}
        </span>
      </div>
    </button>
  );
};
