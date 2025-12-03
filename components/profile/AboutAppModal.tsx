
import React from 'react';
import Button from '../common/Button.tsx';
import { useApp } from '../../hooks/useApp.ts';
import { ChevronLeft } from 'lucide-react';

interface AboutAppModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AboutAppModal: React.FC<AboutAppModalProps> = ({ isOpen, onClose }) => {
    const { translate } = useApp();
    const logoUrl = "https://ai-webbuilder-prod.s3.us-east-1.amazonaws.com/public/images/ad85aead516242b9b73a5140f6db62a1/64b9158269be4300990d5a96abba47d5.20251121_061454.jpg";

    if (!isOpen) return null;

    const infoItems = [
        { label: translate('about.version'), value: translate('about.text.version') },
        { label: translate('about.size'), value: translate('about.text.size') },
        { label: translate('about.companyName'), value: translate('about.text.companyName') },
        { label: translate('about.developer'), value: translate('about.text.developer') },
        { label: translate('about.location'), value: translate('about.text.location') },
        { label: translate('about.technology'), value: translate('about.text.technology') },
        { label: translate('about.vision'), value: translate('about.text.vision') },
        { label: translate('about.connectivity'), value: translate('about.text.connectivity') },
        { label: translate('about.privacy'), value: translate('about.text.privacy') },
        { label: translate('about.legal'), value: translate('about.text.legal') },
    ];

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
            <div className="max-w-lg w-full bg-black border border-gray-800 rounded-2xl shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden">
                {/* Header Section (Fixed) */}
                <div className="p-4 flex items-center justify-center relative border-b border-gray-800 bg-black z-10 shrink-0">
                    <button 
                        onClick={onClose} 
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-2 bg-gray-900/50 rounded-full border border-gray-700 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6"/>
                    </button>
                    <h2 className="text-xl font-bold text-white">{translate('profile.about.title')}</h2>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="flex flex-col items-center mb-2">
                        <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-[#8A2BE2] shadow-[0_0_30px_rgba(138,43,226,0.3)] mb-6 bg-black">
                            <img src={logoUrl} alt="App Logo" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {infoItems.map((item, index) => (
                            <div key={index} className="border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                                <p className="text-xs uppercase tracking-wider text-purple-500 font-bold mb-1">{item.label}</p>
                                <p className="text-sm text-gray-200 leading-relaxed font-medium">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer (Fixed) */}
                <div className="p-4 border-t border-gray-800 bg-black shrink-0">
                    <Button onClick={onClose} className="w-full">
                        {translate('privacyModal.close')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AboutAppModal;
