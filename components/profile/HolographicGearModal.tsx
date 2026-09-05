import React, { useState, useEffect } from 'react';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import { useApp } from '../../hooks/useApp.ts';
import { X, Radio, CheckCircle, Zap, Watch } from 'lucide-react';

interface HolographicGearModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HolographicGearModal: React.FC<HolographicGearModalProps> = ({ isOpen, onClose }) => {
    const { translate, connectDevice, disconnectDevice, isDeviceConnected } = useApp();
    const [scanning, setScanning] = useState(false);
    const [found, setFound] = useState(false);
    const [linking, setLinking] = useState(false);

    const handleConnect = async () => {
        setScanning(true);
        // Simulate Scan
        setTimeout(() => {
            setScanning(false);
            setFound(true);
            // Simulate Link
            setTimeout(() => {
                setLinking(true);
                connectDevice().then(() => {
                   setLinking(false);
                   // Keep "found" state to show success message
                });
            }, 1500);
        }, 2000);
    };
    
    const handleDisconnect = () => {
        disconnectDevice();
        setFound(false);
    };

    // Reset state when modal opens if not connected
    useEffect(() => {
        if (isOpen && !isDeviceConnected) {
            setScanning(false);
            setFound(false);
            setLinking(false);
        }
    }, [isOpen, isDeviceConnected]);

    // Close on Escape key to prevent freeze
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;
    
    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto custom-scrollbar animate-fadeIn"
        >
            <Card 
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="max-w-md w-full relative border-[#8A2BE2]/50 shadow-[0_0_50px_rgba(138,43,226,0.2)] max-h-[90vh] flex flex-col my-auto p-4 sm:p-6 overflow-y-auto custom-scrollbar"
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white z-10 p-1.5 rounded-full hover:bg-neutral-800 transition-colors"
                    aria-label="Fermer"
                >
                    <X className="w-5 h-5 sm:w-6 sm:h-6"/>
                </button>

                <h2 className="text-lg sm:text-xl font-bold text-white text-center mb-1 uppercase tracking-widest shrink-0">
                    {translate('device.title')}
                </h2>
                <p className="text-center text-purple-300 text-xs mb-5 tracking-wider shrink-0">
                    {translate('device.subtitle')}
                </p>
                
                <div className="flex flex-col items-center justify-center py-2 flex-1 min-h-[160px]">
                    {isDeviceConnected ? (
                        <div className="text-center animate-fadeIn">
                             <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-green-900/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                                <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-green-400" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{translate('device.status.connected')}</h3>
                            <p className="text-gray-400 text-xs sm:text-sm">Fit-4rce Bracelet X</p>
                            <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center"><Zap className="w-3 h-3 mr-1 text-yellow-500"/> 88%</span>
                                <span>ID: #8X-29A</span>
                            </div>
                        </div>
                    ) : scanning ? (
                         <div className="text-center">
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4">
                                <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-ping"></div>
                                <div className="absolute inset-0 border-4 border-purple-500/50 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Radio className="w-10 h-10 text-purple-400 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-white font-bold text-xs sm:text-sm animate-pulse">{translate('device.scan.title')}</p>
                            <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
                                <span className="flex items-center"><Radio className="w-3 h-3 mr-1"/> {translate('device.scan.nfc')}</span>
                                <span className="flex items-center"><Zap className="w-3 h-3 mr-1"/> {translate('device.scan.bluetooth')}</span>
                            </div>
                        </div>
                    ) : found && linking ? (
                         <div className="text-center">
                             <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-purple-900/20 border-2 border-purple-500 flex items-center justify-center mx-auto mb-4 animate-spin">
                                <Watch className="w-10 h-10 text-purple-400" />
                            </div>
                            <p className="text-purple-300 font-bold text-xs sm:text-sm animate-pulse">{translate('device.scan.linking')}</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-800/50 border-2 border-gray-700 flex items-center justify-center mx-auto mb-4">
                                <Watch className="w-10 h-10 text-gray-500" />
                            </div>
                             <p className="text-gray-400 text-xs sm:text-sm max-w-xs mx-auto leading-relaxed">{translate('device.scan.desc')}</p>
                        </div>
                    )}
                </div>

                <div className="mt-5 shrink-0">
                    {isDeviceConnected ? (
                         <Button onClick={handleDisconnect} variant="secondary" className="w-full py-3.5 border-red-900/50 hover:bg-red-900/20 text-red-400 font-bold text-xs uppercase tracking-wider">
                            {translate('device.disconnect.btn')}
                        </Button>
                    ) : (
                        <Button onClick={handleConnect} disabled={scanning || linking} className="w-full py-3.5 font-bold text-xs uppercase tracking-wider">
                            {scanning ? translate('processing') : translate('device.connect.btn')}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default HolographicGearModal;