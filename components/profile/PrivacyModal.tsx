
import React from 'react';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import { useApp } from '../../hooks/useApp.ts';
import { X } from 'lucide-react';

interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
    const { translate } = useApp();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
            <Card className="max-w-lg w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-1">
                    <X className="w-6 h-6"/>
                </button>

                <h2 className="text-2xl font-bold text-white text-center mb-6">{translate('privacyModal.title')}</h2>
                
                <div className="max-h-[50vh] overflow-y-auto space-y-6 pr-2">
                    <div>
                        <h3 className="text-lg font-bold text-purple-400 mb-2">{translate('privacyModal.terms.title')}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{translate('privacyModal.terms.content')}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-purple-400 mb-2">{translate('privacyModal.policy.title')}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{translate('privacyModal.policy.content')}</p>
                    </div>
                </div>

                <div className="mt-8">
                    <Button onClick={onClose} className="w-full">
                        {translate('privacyModal.close')}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default PrivacyModal;
