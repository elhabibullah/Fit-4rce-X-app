
import React, { useState, useEffect } from 'react';
import { Tv, X, Monitor } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import Card from './Card.tsx';

interface CastButtonProps {
    isTVMode: boolean;
    onToggleTVMode: () => void;
}

const CastButton: React.FC<CastButtonProps> = ({ isTVMode, onToggleTVMode }) => {
    const { translate } = useApp();
    const [showInstructions, setShowInstructions] = useState(false);
    const [platform, setPlatform] = useState<'android' | 'ios'>('android');

    // Close on Escape key to prevent any UI trap/freeze
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowInstructions(false);
        };
        if (showInstructions) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showInstructions]);

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
                className={`p-2.5 sm:p-3 rounded-full transition-all duration-300 shadow-lg border border-gray-600 shrink-0 flex items-center justify-center ${isTVMode ? 'bg-purple-600 text-white animate-pulse shadow-[0_0_15px_rgba(138,43,226,0.6)]' : 'bg-black/60 text-gray-400 hover:text-white hover:bg-black/80'}`}
                aria-label={translate('tv.connect')}
                title={translate('tv.connect')}
            >
                <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {showInstructions && (
                <div 
                    onClick={() => setShowInstructions(false)}
                    className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto custom-scrollbar animate-fadeIn font-['Poppins']"
                >
                     <Card 
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className="max-w-md w-full relative border-purple-500/50 shadow-[0_0_40px_rgba(138,43,226,0.3)] bg-neutral-950 p-4 sm:p-6 max-h-[90vh] flex flex-col my-auto"
                     >
                        <button 
                            onClick={() => setShowInstructions(false)} 
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-neutral-800 transition-colors z-10"
                            aria-label="Fermer"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        
                        <div className="flex flex-col flex-1 min-h-0 text-center">
                            <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2.5 border-2 border-purple-500 shadow-[0_0_20px_rgba(138,43,226,0.4)] shrink-0">
                                <Tv className="w-6 h-6 text-purple-400" />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-white mb-1 uppercase tracking-wide shrink-0">
                                {translate('tv.cast.title')}
                            </h2>
                            <p className="text-gray-400 text-[11px] sm:text-xs mb-3 leading-relaxed px-2 shrink-0">
                                {translate('tv.cast.subtitle')}
                            </p>
                            
                            {/* Platform Tabs */}
                            <div className="grid grid-cols-2 bg-gray-900/80 p-1 rounded-xl mb-3 border border-gray-800 shrink-0">
                                <button 
                                    onClick={() => setPlatform('android')}
                                    className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
                                        platform === 'android' 
                                            ? 'bg-purple-600 text-white shadow-md' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {translate('tv.cast.android.label')}
                                </button>
                                <button 
                                    onClick={() => setPlatform('ios')}
                                    className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
                                        platform === 'ios' 
                                            ? 'bg-purple-600 text-white shadow-md' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {translate('tv.cast.ios.label')}
                                </button>
                            </div>

                            {/* Scrollable Instructions List */}
                            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-left mb-3 text-xs text-gray-300 space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
                                {platform === 'android' ? (
                                    <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-[11px] sm:text-xs">
                                        <li>{translate('tv.cast.android.step1')}</li>
                                        <li>{translate('tv.cast.android.step2')}</li>
                                        <li>{translate('tv.cast.android.step3')}</li>
                                        <li>{translate('tv.cast.android.step4')}</li>
                                    </ol>
                                ) : (
                                    <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-[11px] sm:text-xs">
                                        <li>{translate('tv.cast.ios.step1')}</li>
                                        <li>{translate('tv.cast.ios.step2')}</li>
                                        <li>{translate('tv.cast.ios.step3')}</li>
                                        <li>{translate('tv.cast.ios.step4')}</li>
                                    </ol>
                                )}
                            </div>
                            
                            {/* Prominent Action Button - Always visible, never cut off */}
                            <button 
                                onClick={confirmCast}
                                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(138,43,226,0.5)] flex items-center justify-center gap-2 active:scale-95 shrink-0"
                            >
                                <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>{translate('tv.cast.activate')}</span>
                            </button>
                        </div>
                     </Card>
                </div>
            )}
        </>
    );
};

export default CastButton;
