import React from 'react';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import { useApp } from './useApp.ts';
import { X, Share, MoreVertical } from 'lucide-react';

interface PwaInstallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TextWithIcon: React.FC<{ textKey: string; Icon: React.ElementType }> = ({ textKey, Icon }) => {
    const { translate } = useApp();
    const text = translate(textKey);
    const parts = text.split('{{icon}}') as string[];
    const IconComp = Icon as any;

    return (
        <span>
            {parts[0]}
            <IconComp className="w-4 h-4 mx-1 inline-block align-middle" />
            {parts[1]}
        </span>
    );
};

const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
    const { translate } = useApp();

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
            <Card className="max-w-lg w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-1">
                    <X className="w-6 h-6"/>
                </button>

                <h2 className="text-2xl font-bold text-white text-center mb-6">{translate('pwa.modal.title')}</h2>
                
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-purple-400 mb-2">{translate('pwa.modal.ios.title')}</h3>
                        <ol className="list-decimal list-inside text-gray-300 space-y-2 text-sm">
                            <li>
                                <TextWithIcon textKey="pwa.modal.ios.step1" Icon={Share} />
                            </li>
                            <li>{translate('pwa.modal.ios.step2')}</li>
                            <li>{translate('pwa.modal.ios.step3')}</li>
                        </ol>
                    </div>
                </div>

                <div className="mt-8">
                    <Button onClick={onClose} className="w-full">
                        {translate('pwa.modal.close')}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default PwaInstallModal;