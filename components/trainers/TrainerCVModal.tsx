
import React, { useState, useEffect } from 'react';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import { useApp } from '../../hooks/useApp.ts';
import { X, Award, FileText, Loader } from 'lucide-react';
import { generateTrainerCV } from '../../services/aiService.ts';
import { TrainerProfile } from '../../types.ts';

interface TrainerCVModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainer: TrainerProfile;
}

const TrainerCVModal: React.FC<TrainerCVModalProps> = ({ isOpen, onClose, trainer }) => {
    const { translate, language } = useApp();
    const [cvContent, setCvContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            generateTrainerCV(trainer.name, trainer.bio, language)
                .then(content => {
                    setCvContent(content);
                    setLoading(false);
                })
                .catch(() => {
                    setCvContent(translate('cv.error'));
                    setLoading(false);
                });
        }
    }, [isOpen, trainer, language, translate]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fadeIn">
            <Card className="max-w-2xl w-full h-[80vh] flex flex-col relative border-[#DAA520]/30 shadow-[0_0_50px_rgba(218,165,32,0.1)]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-1">
                    <X className="w-6 h-6"/>
                </button>

                <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-gray-900 border-2 border-[#DAA520] mx-auto mb-4 overflow-hidden">
                        <img src={trainer.photoUrl} alt={trainer.name} className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-widest">{trainer.name}</h2>
                    <p className="text-[#DAA520] text-sm tracking-wide">{translate('cv.header')}</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <Loader className="w-8 h-8 text-[#DAA520] animate-spin" />
                            <p className="text-gray-400 animate-pulse text-sm">{translate('cv.loading.access')}</p>
                            <p className="text-xs text-gray-600">{translate('cv.loading.translate', { lang: language.toUpperCase() })}</p>
                        </div>
                    ) : (
                        <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed">
                            <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                                <div className="flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
                                    <FileText className="w-5 h-5 text-[#DAA520]" />
                                    <h3 className="font-bold text-white">{translate('cv.summary')}</h3>
                                </div>
                                <p className="whitespace-pre-wrap">{cvContent}</p>
                            </div>
                            
                            <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                                <div className="min-w-[150px] p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                    <Award className="w-6 h-6 text-purple-500 mb-2" />
                                    <p className="text-xs text-gray-400">{translate('cv.certs')}</p>
                                    <p className="font-bold text-white">ISSA / NASM</p>
                                </div>
                                <div className="min-w-[150px] p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                    <Award className="w-6 h-6 text-blue-500 mb-2" />
                                    <p className="text-xs text-gray-400">{translate('cv.specialty')}</p>
                                    <p className="font-bold text-white">{trainer.specializations[0]}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800">
                    <Button onClick={onClose} variant="secondary" className="w-full">
                        {translate('done')}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default TrainerCVModal;
