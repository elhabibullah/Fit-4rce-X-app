
import React, { useState } from 'react';
import { Tv, X, Smartphone, Monitor } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import Card from './Card.tsx';

interface CastButtonProps {
    isTVMode: boolean;
    onToggleTVMode: () => void;
}

const CastButton: React.FC<CastButtonProps> = ({ isTVMode, onToggleTVMode }) => {
    const { translate } = useApp();
    const [showInstructions, setShowInstructions] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android'>('ios');

    const handleClick = () => {
        if (isTVMode) {
            onToggleTVMode(); // Exit
        } else {
            setShowInstructions(true);
        }
    };

    const confirmCast = () => {
        setShowInstructions(false);
        onToggleTVMode();
        // Trigger fullscreen to help with casting aspect ratio
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((e) => console.log("Fullscreen denied", e));
        }
    };

    return (
        <>
            <button 
                onClick={handleClick}
                className={`p-3 rounded-full transition-all duration-300 shadow-lg border border-gray-600 ${isTVMode ? 'bg-purple-600 text-white animate-pulse' : 'bg-black/60 text-gray-400 hover:text-white hover:bg-black/80'}`}
                aria-label={translate('tv.connect')}
            >
                <Tv className="w-5 h-5" />
            </button>

            {showInstructions && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
                     <Card className="max-w-md w-full relative border-purple-500/50 shadow-[0_0_30px_rgba(138,43,226,0.2)]">
                        <button 
                            onClick={() => setShowInstructions(false)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500">
                                <Tv className="w-8 h-8 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">{translate('tv.cast.title')}</h2>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed px-4">
                                {translate('tv.cast.subtitle')}
                            </p>
                            
                            {/* Platform Tabs */}
                            <div className="flex bg-gray-900 p-1 rounded-lg mb-4">
                                <button 
                                    onClick={() => setPlatform('ios')}
                                    className="flex-1 py-2 text-sm font-bold rounded-md bg-white text-black"
                                >
                                    {translate('tv.cast.ios.label')}
                                </button>
                            </div>

                            {/* Instructions */}
                            <div className="bg-gray-800/50 rounded-lg p-4 text-left mb-6 text-sm text-gray-300 space-y-3">
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>{translate('tv.cast.ios.step1')}</li>
                                    <li>{translate('tv.cast.ios.step2')}</li>
                                    <li>{translate('tv.cast.ios.step3')}</li>
                                    <li>{translate('tv.cast.ios.step4')}</li>
                                </ol>
                            </div>
                            
                            <button 
                                onClick={confirmCast}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(138,43,226,0.4)] flex items-center justify-center gap-2"
                            >
                                <Monitor className="w-5 h-5" />
                                {translate('tv.cast.activate')}
                            </button>
                        </div>
                     </Card>
                </div>
            )}
        </>
    );
};

export default CastButton;
