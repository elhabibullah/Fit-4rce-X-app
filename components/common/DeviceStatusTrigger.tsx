import React from 'react';
import { Watch } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';

export const DeviceStatusTrigger: React.FC = () => {
  const { isDeviceConnected, openDeviceModal } = useApp();
  return (
    <button 
      onClick={openDeviceModal}
      className={`p-2 rounded-full border transition-all duration-300 ${isDeviceConnected ? 'bg-green-900/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}
      aria-label="Connect Bracelet"
    >
      <Watch className={`w-5 h-5 ${isDeviceConnected ? 'animate-pulse' : ''}`} />
    </button>
  );
};