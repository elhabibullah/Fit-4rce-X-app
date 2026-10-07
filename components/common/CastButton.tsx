import React, { useState } from 'react';
import { Tv, Loader2 } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import { launchNativeTVMirroring } from '../../lib/castService.ts';

interface CastButtonProps {
    isTVMode: boolean;
    onToggleTVMode: () => void;
}

export const CastButton: React.FC<CastButtonProps> = ({ isTVMode, onToggleTVMode }) => {
    const { translate } = useApp();
    const [isTriggering, setIsTriggering] = useState<boolean>(false);

    const handleClick = async () => {
        if (isTVMode) {
            onToggleTVMode();
        } else {
            onToggleTVMode();
            setIsTriggering(true);
            try {
                await launchNativeTVMirroring();
            } catch (e) {
                console.debug('Native casting prompt:', e);
            } finally {
                setIsTriggering(false);
            }
        }
    };

    return (
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
    );
};

export default CastButton;
