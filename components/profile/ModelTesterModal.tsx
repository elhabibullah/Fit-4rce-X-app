
import React, { useState, useRef } from 'react';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import { useApp } from '../../hooks/useApp.ts';
import { X, Upload, Info, AlertCircle } from 'lucide-react';
import { HolographicCoach } from '../common/HolographicCoach.tsx';

interface ModelTesterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ModelTesterModal: React.FC<ModelTesterModalProps> = ({ isOpen, onClose }) => {
    const { translate } = useApp();
    const [localModelUrl, setLocalModelUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.glb')) {
                setError("Only .glb files are supported for our holographic engine.");
                return;
            }
            
            // 23MB Check Warning
            if (file.size > 25 * 1024 * 1024) {
                setError("Warning: File is over 25MB. It may lag on mobile devices.");
            } else {
                setError(null);
            }

            const url = URL.createObjectURL(file);
            setLocalModelUrl(url);
        }
    };

    const handleClose = () => {
        if (localModelUrl) URL.revokeObjectURL(localModelUrl);
        setLocalModelUrl(null);
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-4 animate-fadeIn">
            <Card className="max-w-2xl w-full h-[85vh] flex flex-col relative border-purple-500/30 shadow-[0_0_50px_rgba(138,43,226,0.1)]">
                <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-20">
                    <X className="w-8 h-8"/>
                </button>

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-widest">3D Model Sandbox</h2>
                    <p className="text-purple-400 text-xs mt-1 font-mono">DEBUG MODE // LOCAL PREVIEW</p>
                </div>

                <div className="flex-1 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-700 relative overflow-hidden flex flex-col items-center justify-center p-4">
                    {localModelUrl ? (
                        <div className="w-full h-full relative">
                            <HolographicCoach modelUrl={localModelUrl} />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] text-white font-bold uppercase tracking-widest">Model Rendering OK</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <Upload className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-bounce" />
                            <p className="text-gray-400 mb-6 px-8 leading-relaxed">
                                Select your **.glb** Android file to see how it looks in the app. 
                                <br/>If it doesn't appear here, it won't work in the classes!
                            </p>
                            <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                                Select File
                            </Button>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".glb" 
                        className="hidden" 
                    />
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-200">{error}</p>
                    </div>
                )}

                <div className="mt-6 flex gap-3">
                    <Button 
                        onClick={() => {
                            if (localModelUrl) URL.revokeObjectURL(localModelUrl);
                            setLocalModelUrl(null);
                        }} 
                        variant="secondary" 
                        className="flex-1"
                        disabled={!localModelUrl}
                    >
                        Clear
                    </Button>
                    <Button onClick={handleClose} className="flex-1">
                        Finish
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default ModelTesterModal;
