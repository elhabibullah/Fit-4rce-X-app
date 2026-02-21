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

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fadeIn">
            <Card className="max-w-md w-full relative border-[#8A2BE2]/50 shadow-[0_0_50px_rgba(138,43,226,0.2)]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-1">
                    <X className="w-6 h-6"/>
                </button>

                <h2 className="text-2xl font-bold text-white text-center mb-2 uppercase tracking-widest">{translate('device.title')}</h2>
                <p className="text-center text-purple-300 text-xs mb-8 tracking-wider">{translate('device.subtitle')}</p>
                
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                    {isDeviceConnected ? (
                        <div className="text-center animate-fadeIn">
                             <div className="w-32 h-32 rounded-full bg-green-900/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                                <CheckCircle className="w-16 h-16 text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{translate('device.status.connected')}</h3>
                            <p className="text-gray-400 text-sm">Fit-4rce Bracelet X</p>
                            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center"><Zap className="w-3 h-3 mr-1 text-yellow-500"/> 88%</span>
                                <span>ID: #8X-29A</span>
                            </div>
                        </div>
                    ) : scanning ? (
                         <div className="text-center">
                            <div className="relative w-32 h-32 mx-auto mb-6">
                                <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-ping"></div>
                                <div className="absolute inset-0 border-4 border-purple-500/50 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Radio className="w-12 h-12 text-purple-400 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-white font-bold animate-pulse">{translate('device.scan.title')}</p>
                            <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
                                <span className="flex items-center"><Radio className="w-3 h-3 mr-1"/> {translate('device.scan.nfc')}</span>
                                <span className="flex items-center"><Zap className="w-3 h-3 mr-1"/> {translate('device.scan.bluetooth')}</span>
                            </div>
                        </div>
                    ) : found && linking ? (
                         <div className="text-center">
                             <div className="w-32 h-32 rounded-full bg-purple-900/20 border-2 border-purple-500 flex items-center justify-center mx-auto mb-6 animate-spin">
                                <Watch className="w-12 h-12 text-purple-400" />
                            </div>
                            <p className="text-purple-300 font-bold animate-pulse">{translate('device.scan.linking')}</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-32 h-32 rounded-full bg-gray-800/50 border-2 border-gray-700 flex items-center justify-center mx-auto mb-6">
                                <Watch className="w-12 h-12 text-gray-500" />
                            </div>
                             <p className="text-gray-400 text-sm max-w-xs mx-auto">{translate('device.scan.desc')}</p>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    {isDeviceConnected ? (
                         <Button onClick={handleDisconnect} variant="secondary" className="w-full border-red-900/50 hover:bg-red-900/20 text-red-400">
                            {translate('device.disconnect.btn')}
                        </Button>
                    ) : (
                        <Button onClick={handleConnect} disabled={scanning || linking} className="w-full">
                            {scanning ? translate('processing') : translate('device.connect.btn')}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default HolographicGearModal;