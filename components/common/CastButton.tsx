import React, { useState } from 'react';
import { Tv, X, Wifi, Loader2, Smartphone, Apple } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import Card from './Card.tsx';
import { launchNativeTVMirroring } from '../../lib/castService.ts';

interface CastButtonProps {
    isTVMode: boolean;
    onToggleTVMode: () => void;
}

export const CastButton: React.FC<CastButtonProps> = ({ isTVMode, onToggleTVMode }) => {
    const { translate } = useApp();
    const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);
    const [isTriggering, setIsTriggering] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleLaunchScreen = async () => {
        setIsTriggering(true);
        setStatusMessage(null);
        try {
            const res = await launchNativeTVMirroring({
                onConnected: () => {
                    if (!isTVMode) onToggleTVMode();
                    setShowOptionsModal(false);
                },
                onDisconnected: () => {
                    if (isTVMode) onToggleTVMode();
                }
            });

            if (res.success) {
                if (!isTVMode) onToggleTVMode();
                setShowOptionsModal(false);
            } else if (res.error && !res.error.includes('annulée') && !res.error.includes('canceled') && !res.error.includes('Annulé')) {
                setStatusMessage(res.error);
            }
        } finally {
            setIsTriggering(false);
        }
    };

    const handleClick = () => {
        if (isTVMode) {
            onToggleTVMode();
        } else {
            setShowOptionsModal(true);
        }
    };

    return (
        <>
            <button 
                type="button"
                onClick={handleClick}
                className={`p-2.5 sm:p-3 rounded-full transition-all duration-300 shadow-lg border border-gray-600 shrink-0 flex items-center justify-center ${
                    isTVMode 
                        ? 'bg-purple-600 text-white animate-pulse shadow-[0_0_15px_rgba(138,43,226,0.6)]' 
                        : 'bg-black/60 text-gray-400 hover:text-white hover:bg-black/80'
                }`}
                aria-label={translate('tv.connect')}
                title={translate('tv.connect')}
            >
                {isTriggering ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-purple-400" />
                ) : (
                    <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
            </button>

            {/* CLEAN WIRELESS TV CAST MODAL */}
            {showOptionsModal && (
                <div 
                    onClick={() => setShowOptionsModal(false)}
                    className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn font-['Poppins'] select-none"
                >
                    <Card 
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className="max-w-md w-full relative border-purple-500/50 shadow-[0_0_60px_rgba(138,43,226,0.4)] bg-neutral-950 p-5 sm:p-6 my-auto rounded-3xl text-left space-y-4"
                    >
                        <button 
                            type="button"
                            onClick={() => setShowOptionsModal(false)} 
                            className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-neutral-800 transition-colors z-10"
                            aria-label={translate('ar.close')}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
                            <div className="w-10 h-10 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/50 shrink-0">
                                <Tv className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                                    {translate('tv.cast.title')}
                                </h2>
                                <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                                    <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>{translate('ar.wireless_tv_desc')}</span>
                                </p>
                            </div>
                        </div>

                        {statusMessage && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                                {statusMessage}
                            </div>
                        )}

                        {/* STEP-BY-STEP GUIDANCE FOR ANDROID AND APPLE */}
                        <div className="space-y-3">
                            {/* ANDROID / SAMSUNG */}
                            <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black uppercase">
                                    <Smartphone className="w-4 h-4 shrink-0" />
                                    <span>{translate('tv.cast.android.label')}</span>
                                </div>
                                <ul className="text-[11px] text-gray-300 space-y-1 pl-1">
                                    <li className="flex items-start gap-1.5">
                                        <span className="text-emerald-400 font-bold">•</span>
                                        <span>{translate('tv.cast.android.step1')}</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <span className="text-emerald-400 font-bold">•</span>
                                        <span>{translate('tv.cast.android.step2')}</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <span className="text-emerald-400 font-bold">•</span>
                                        <span>{translate('tv.cast.android.step3')}</span>
                                    </li>
                                </ul>
                            </div>

                            {/* APPLE (IOS / AIRPLAY) */}
                            <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-black uppercase">
                                    <Apple className="w-4 h-4 shrink-0" />
                                    <span>{translate('tv.cast.ios.label')}</span>
                                </div>
                                <ul className="text-[11px] text-gray-300 space-y-1 pl-1">
                                    <li className="flex items-start gap-1.5">
                                        <span className="text-cyan-400 font-bold">•</span>
                                        <span>{translate('tv.cast.ios.step1')}</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <span className="text-cyan-400 font-bold">•</span>
                                        <span>{translate('tv.cast.ios.step2')}</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <span className="text-cyan-400 font-bold">•</span>
                                        <span>{translate('tv.cast.ios.step3')}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* CLEAN ACTION BUTTONS */}
                        <div className="space-y-2 pt-2">
                            {/* SINGLE PROMINENT LAUNCH BUTTON */}
                            <button
                                type="button"
                                onClick={handleLaunchScreen}
                                disabled={isTriggering}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 transition-transform active:scale-95 border border-purple-400/40"
                            >
                                {isTriggering ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{translate('ar.opening_picker')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Tv className="w-4 h-4" />
                                        <span>{translate('ar.launch_mirroring')}</span>
                                    </>
                                )}
                            </button>

                            {/* SECONDARY FULLSCREEN TOGGLE */}
                            <button
                                type="button"
                                onClick={() => {
                                    onToggleTVMode();
                                    setShowOptionsModal(false);
                                }}
                                className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-gray-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                <span>{isTVMode ? translate('ar.exit_cinema_fullscreen') : translate('tv.cast.activate')}</span>
                            </button>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
};

export default CastButton;
