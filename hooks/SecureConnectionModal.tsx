
import React, { useState, useEffect } from 'react';
import { Shield, Camera, Lock, CheckCircle, Wifi, UserCheck, AlertTriangle } from 'lucide-react';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import { useApp } from './useApp.ts';

interface SecureConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnected: () => void;
    trainerName: string;
}

const SecureConnectionModal: React.FC<SecureConnectionModalProps> = ({ isOpen, onClose, onConnected, trainerName }) => {
    const { translate } = useApp();
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
            const timers = [
                setTimeout(() => setStep(1), 1500), // Bio-Link
                setTimeout(() => setStep(2), 3500), // Verify Identity
                setTimeout(() => setStep(3), 6000), // Waiting for Cam
                setTimeout(() => setStep(4), 8500), // Secured
            ];
            return () => timers.forEach(clearTimeout);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.1)] relative overflow-hidden bg-black">
                {/* Background Grid Animation */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                
                <div className="relative z-10 text-center space-y-8 py-8">
                    <div className="w-24 h-24 mx-auto relative">
                        <div className={`absolute inset-0 rounded-full border-4 border-green-900/50 ${step < 4 ? 'animate-ping' : ''}`}></div>
                        <div className="absolute inset-0 rounded-full border-2 border-green-500 flex items-center justify-center bg-black">
                            {step === 0 && <Wifi className="w-10 h-10 text-green-500 animate-pulse"/>}
                            {step === 1 && <Lock className="w-10 h-10 text-green-500 animate-bounce"/>}
                            {step === 2 && <UserCheck className="w-10 h-10 text-green-500"/>}
                            {step === 3 && <Camera className="w-10 h-10 text-yellow-500 animate-pulse"/>}
                            {step === 4 && <Shield className="w-10 h-10 text-green-400"/>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-green-500 uppercase tracking-widest">
                            {step === 0 && translate('connect.step0')}
                            {step === 1 && translate('connect.step1')}
                            {step === 2 && translate('connect.step2')}
                            {step === 3 && translate('connect.step3')}
                            {step === 4 && translate('connect.step4')}
                        </h2>
                        <p className="text-xs font-mono text-gray-400">
                            {step === 0 && translate('connect.protocol.start')}
                            {step === 1 && translate('connect.protocol.enc')}
                            {step === 2 && translate('connect.protocol.coach', { name: trainerName.toUpperCase() })}
                            {step === 3 && translate('connect.protocol.video')}
                            {step === 4 && translate('connect.protocol.qa')}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-900 h-1 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500 transition-all duration-500 ease-out" 
                            style={{ width: `${(step + 1) * 20}%` }}
                        ></div>
                    </div>

                    {/* Legal Disclaimer Box */}
                    <div className="bg-green-900/10 border border-green-900/50 p-3 rounded text-left flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-green-600 flex-shrink-0"/>
                        <p className="text-[10px] text-green-400/80 leading-tight">
                            {translate('connect.legal')}
                        </p>
                    </div>

                    {step === 4 && (
                        <Button onClick={onConnected} className="w-full bg-green-600 hover:bg-green-700 border-green-500 text-white animate-fadeIn">
                            {translate('connect.button')}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default SecureConnectionModal;
