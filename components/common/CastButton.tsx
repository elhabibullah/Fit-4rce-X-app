import React, { useState, useEffect } from 'react';
import { Tv, X, Monitor, Cast, Wifi, Check, Laptop, Sparkles } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import Card from './Card.tsx';

interface CastButtonProps {
    isTVMode: boolean;
    onToggleTVMode: () => void;
}

export const CastButton: React.FC<CastButtonProps> = ({ isTVMode, onToggleTVMode }) => {
    const { translate, language } = useApp();
    const [showInstructions, setShowInstructions] = useState(false);
    const [activeTab, setActiveTab] = useState<'laptop' | 'tvs' | 'mobile'>('laptop');
    const [selectedBrand, setSelectedBrand] = useState<'samsung' | 'lg' | 'google' | 'apple' | 'sony'>('samsung');
    const [scanState, setScanState] = useState<'idle' | 'searching' | 'ready'>('idle');

    // Close on Escape key
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
            onToggleTVMode();
        } else {
            setShowInstructions(true);
        }
    };

    // Native TV Cast / Screen Mirroring trigger
    const launchNativeCast = async () => {
        setScanState('searching');
        try {
            // 1. Try Presentation API (Chrome/Edge Cast picker)
            if ('PresentationRequest' in window) {
                try {
                    const request = new (window as any).PresentationRequest([window.location.href]);
                    const connection = await request.start();
                    if (connection) {
                        setScanState('ready');
                        onToggleTVMode();
                        setShowInstructions(false);
                        return;
                    }
                } catch {
                    // fall through to getDisplayMedia
                }
            }

            // 2. Try DisplayMedia (Native Windows / macOS Screen & TV Picker)
            if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
                try {
                    await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
                    setScanState('ready');
                    onToggleTVMode();
                    setShowInstructions(false);
                    return;
                } catch (dispErr) {
                    console.log('Display picker closed:', dispErr);
                }
            }

            // 3. Fallback: activate fullscreen TV theater mode
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen().catch(() => {});
            }
            onToggleTVMode();
            setShowInstructions(false);
        } catch {
            onToggleTVMode();
            setShowInstructions(false);
        } finally {
            setScanState('idle');
        }
    };

    const isFr = language === 'fr';

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
                        className="max-w-lg w-full relative border-purple-500/50 shadow-[0_0_50px_rgba(138,43,226,0.35)] bg-neutral-950 p-4 sm:p-6 max-h-[92vh] flex flex-col my-auto rounded-3xl"
                     >
                        <button 
                            onClick={() => setShowInstructions(false)} 
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-neutral-800 transition-colors z-10"
                            aria-label="Fermer"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        
                        <div className="flex flex-col flex-1 min-h-0 text-left">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-11 h-11 bg-purple-900/40 rounded-2xl flex items-center justify-center border-2 border-purple-500 shadow-[0_0_20px_rgba(138,43,226,0.4)] shrink-0">
                                    <Tv className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                                        {isFr ? 'Connexion TV du Salon (Wi-Fi)' : 'Living Room TV Connection'}
                                    </h2>
                                    <p className="text-[10px] sm:text-xs text-purple-300/80">
                                        {isFr ? 'Diffusez votre séance sur grand écran sans fil' : 'Mirror your workout wirelessly to your TV'}
                                    </p>
                                </div>
                            </div>

                            {/* PROMINENT LAPTOP SHORTCUT CARD (WINDOWS + K) */}
                            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-purple-950/60 border border-purple-500/50 text-[11px] text-purple-200 leading-relaxed mb-3">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <strong className="text-white text-xs font-black uppercase tracking-wider">
                                        {isFr ? 'Sur Ordinateur Portable (Windows)' : 'On Laptop (Windows)'}
                                    </strong>
                                </div>
                                <p className="text-gray-300 text-[11px] leading-snug mb-2">
                                    {isFr
                                        ? 'Pour afficher directement la liste de tous vos écrans et Smart TVs connectés au Wi-Fi, utilisez le raccourci natif Windows :'
                                        : 'To open the native list of all smart TVs connected to your Wi-Fi network, press:'
                                    }
                                </p>
                                <div className="flex items-center gap-2 bg-black/70 p-2 rounded-xl border border-purple-500/40">
                                    <span className="px-2 py-1 bg-purple-600 text-white font-mono font-black text-xs rounded-lg shadow-sm">
                                        ⊞ Win + K
                                    </span>
                                    <span className="text-[10px] text-purple-300 font-bold">
                                        {isFr ? 'Recherche automatique et connexion en 1 clic' : 'Auto-searches and connects in 1 click'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* NAVIGATION TABS */}
                            <div className="grid grid-cols-3 bg-gray-900/80 p-1 rounded-2xl mb-3 border border-gray-800 shrink-0 text-center">
                                <button 
                                    onClick={() => setActiveTab('laptop')}
                                    className={`py-1.5 px-2 text-[10px] sm:text-xs font-black uppercase rounded-xl transition-all ${
                                        activeTab === 'laptop' 
                                            ? 'bg-purple-600 text-white shadow-md' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {isFr ? '1. PC Portable' : '1. Laptop'}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('tvs')}
                                    className={`py-1.5 px-2 text-[10px] sm:text-xs font-black uppercase rounded-xl transition-all ${
                                        activeTab === 'tvs' 
                                            ? 'bg-purple-600 text-white shadow-md' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {isFr ? '2. Marques TV' : '2. TV Brands'}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('mobile')}
                                    className={`py-1.5 px-2 text-[10px] sm:text-xs font-black uppercase rounded-xl transition-all ${
                                        activeTab === 'mobile' 
                                            ? 'bg-purple-600 text-white shadow-md' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {isFr ? '3. Smartphone' : '3. Mobile'}
                                </button>
                            </div>

                            {/* TAB 1: PC PORTABLE / DIRECT SCREEN MIRRORING */}
                            {activeTab === 'laptop' && (
                                <div className="space-y-2.5 overflow-y-auto max-h-60 custom-scrollbar pr-1">
                                    <div className="p-3 bg-neutral-900/90 border border-gray-800 rounded-2xl space-y-2 text-[11px] text-gray-300">
                                        <p className="font-bold text-white flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                                            {isFr ? 'Méthode Express 100% Automatique :' : 'Instant Express Method:'}
                                        </p>
                                        <ol className="list-decimal list-inside space-y-1.5 text-[10.5px] leading-relaxed">
                                            <li>
                                                {isFr 
                                                    ? 'Appuyez simultanément sur la touche Windows et la touche K de votre clavier (Win + K).'
                                                    : 'Press the Windows key and K on your keyboard (Win + K).'
                                                }
                                            </li>
                                            <li>
                                                {isFr
                                                    ? 'Le volet « Projeter / Écrans sans fil » s\'ouvre immédiatement à droite de votre écran.'
                                                    : 'The "Cast / Wireless Displays" panel immediately opens on the right.'
                                                }
                                            </li>
                                            <li>
                                                {isFr
                                                    ? 'Windows recherche et affiche tous les téléviseurs allumés et visibles sur votre réseau Wi-Fi.'
                                                    : 'Windows scans and shows all smart TVs visible on your Wi-Fi network.'
                                                }
                                            </li>
                                            <li>
                                                {isFr
                                                    ? 'Cliquez simplement sur le nom de votre TV dans la liste pour lancer la diffusion en plein écran !'
                                                    : 'Click your TV in the list to mirror your workout in full screen!'
                                                }
                                            </li>
                                        </ol>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: TV BRANDS GUIDE */}
                            {activeTab === 'tvs' && (
                                <div className="space-y-2.5 overflow-y-auto max-h-60 custom-scrollbar pr-1">
                                    <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                                        {[
                                            { id: 'samsung', label: 'Samsung' },
                                            { id: 'lg', label: 'LG webOS' },
                                            { id: 'google', label: 'Google TV' },
                                            { id: 'sony', label: 'Sony Bravia' },
                                            { id: 'apple', label: 'Apple TV' },
                                        ].map((b) => (
                                            <button
                                                key={b.id}
                                                onClick={() => setSelectedBrand(b.id as any)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                                                    selectedBrand === b.id 
                                                        ? 'bg-purple-600 text-white shadow-md' 
                                                        : 'bg-neutral-900 text-gray-400 border border-gray-800 hover:text-white'
                                                }`}
                                            >
                                                {b.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-3 bg-neutral-900 border border-gray-800 rounded-2xl text-[11px] text-gray-300 space-y-2">
                                        {selectedBrand === 'samsung' && (
                                            <p className="leading-relaxed">
                                                {isFr 
                                                    ? 'Sur votre PC : appuyez sur Win + K et sélectionnez votre TV Samsung. Sur smartphone Samsung : faites glisser le volet rapide vers le bas et appuyez sur « Smart View ».'
                                                    : 'On PC: Press Win + K and choose your Samsung TV. On Samsung phone: Swipe down to Quick Settings and tap "Smart View".'
                                                }
                                            </p>
                                        )}
                                        {selectedBrand === 'lg' && (
                                            <p className="leading-relaxed">
                                                {isFr
                                                    ? 'Allumez votre TV LG (webOS). Sur votre PC : appuyez sur Win + K et choisissez votre TV LG. Acceptez la connexion sur l\'écran du téléviseur avec la télécommande.'
                                                    : 'Turn on your LG TV. On PC: Press Win + K and choose your LG TV. Accept the prompt on your TV with the remote.'
                                                }
                                            </p>
                                        )}
                                        {selectedBrand === 'google' && (
                                            <p className="leading-relaxed">
                                                {isFr
                                                    ? 'Sur Chrome ou Edge : cliquez sur les trois petits points en haut à droite > « Caster / Transmettre » > sélectionnez votre Chromecast ou TV Philips / TCL / Sony.'
                                                    : 'In Chrome/Edge: Click top-right 3 dots > "Cast" > choose your Chromecast or Google TV.'
                                                }
                                            </p>
                                        )}
                                        {selectedBrand === 'sony' && (
                                            <p className="leading-relaxed">
                                                {isFr
                                                    ? 'Les TV Sony Bravia intègrent Google Cast et AirPlay. Utilisez Win + K sur PC ou l\'icône Caster du navigateur.'
                                                    : 'Sony Bravia TVs include Google Cast and AirPlay. Use Win + K on PC or the Cast browser button.'
                                                }
                                            </p>
                                        )}
                                        {selectedBrand === 'apple' && (
                                            <p className="leading-relaxed">
                                                {isFr
                                                    ? 'Sur iPhone, iPad ou Mac : ouvrez le Centre de contrôle > touchez « Recopie de l\'écran » > sélectionnez votre Apple TV 4K.'
                                                    : 'On iPhone, iPad or Mac: Open Control Center > tap "Screen Mirroring" > select your Apple TV.'
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: SMARTPHONE */}
                            {activeTab === 'mobile' && (
                                <div className="space-y-2.5 overflow-y-auto max-h-60 custom-scrollbar pr-1">
                                    <div className="p-3 bg-neutral-900 border border-gray-800 rounded-2xl text-[11px] text-gray-300 space-y-2">
                                        <p className="font-bold text-white">
                                            {isFr ? 'Si vous utilisez un smartphone :' : 'If using a mobile phone:'}
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-[10.5px]">
                                            <li><strong className="text-purple-300">Samsung :</strong> {isFr ? 'Bouton « Smart View » dans le volet déroulant' : '"Smart View" in drop-down menu'}</li>
                                            <li><strong className="text-purple-300">iPhone :</strong> {isFr ? 'Centre de contrôle > « Recopie de l\'écran »' : 'Control Center > "Screen Mirroring"'}</li>
                                            <li><strong className="text-purple-300">Android :</strong> {isFr ? 'Paramètres rapides > « Diffuser » ou « Cast »' : 'Quick settings > "Cast" or "Screen Cast"'}</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                            
                            {/* ACTION BUTTON: DIRECT LAUNCH SCREEN SHARE / CAST PICKER */}
                            <div className="pt-3 border-t border-gray-900 mt-2 shrink-0">
                                <button 
                                    onClick={launchNativeCast}
                                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_25px_rgba(138,43,226,0.5)] flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Cast className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                                    <span>
                                        {scanState === 'searching' 
                                            ? (isFr ? 'Ouverture du sélecteur d\'écran...' : 'Opening screen picker...') 
                                            : (isFr ? 'Lancer le Partage d\'Écran TV' : 'Launch TV Screen Sharing')
                                        }
                                    </span>
                                </button>
                            </div>
                        </div>
                     </Card>
                </div>
            )}
        </>
    );
};

export default CastButton;
