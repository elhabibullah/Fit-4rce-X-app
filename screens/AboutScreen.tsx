import React from 'react';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import { ChevronLeft } from 'lucide-react';
import Card from '../components/common/Card.tsx';

const AboutScreen: React.FC = () => {
    const { setScreen, translate } = useApp();
    const logoUrl = "https://ai-webbuilder-prod.s3.us-east-1.amazonaws.com/public/images/ad85aead516242b9b73a5140f6db62a1/64b9158269be4300990d5a96abba47d5.20251121_061454.jpg";

    const infoItems = [
        { label: translate('about.version'), value: translate('about.text.version') },
        { label: translate('about.size'), value: translate('about.text.size') },
        { label: translate('about.companyName'), value: translate('about.text.companyName') },
        { label: translate('about.vision'), value: translate('about.text.vision') },
        { label: translate('about.connectivity'), value: translate('about.text.connectivity') },
        { label: translate('about.location'), value: translate('about.text.location') },
        { label: translate('about.privacy'), value: translate('about.text.privacy') },
        { label: translate('about.developer'), value: translate('about.text.developer') },
        { label: translate('about.technology'), value: translate('about.text.technology') },
        { label: translate('about.legal'), value: translate('about.text.legal') },
    ];

    return (
        <div className="animate-fadeIn space-y-6">
            <header className="flex items-center relative -mb-2">
                <button onClick={() => setScreen(Screen.Profile)} className="p-2 -ml-2 text-gray-400 hover:text-white absolute left-0">
                    <ChevronLeft className="w-7 h-7" />
                </button>
                <h1 className="text-2xl font-bold text-white text-center flex-grow">{translate('about.title')}</h1>
            </header>

            <Card className="flex items-center gap-4 p-5">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-[0_0_20px_rgba(138,43,226,0.3)] shrink-0 bg-black">
                    <img src={logoUrl} alt="App Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white tracking-wider uppercase">Fit-4rce-X</h2>
                    <p className="text-xs text-purple-400 tracking-widest font-mono uppercase mt-0.5">{translate('about.text.version')}</p>
                </div>
            </Card>

            <div className="space-y-4">
                {infoItems.map((item, index) => (
                    <Card key={index} className="p-4 border-gray-850 bg-zinc-900/20">
                        <p className="text-[10px] uppercase tracking-wider text-purple-500 font-black mb-1">{item.label}</p>
                        <p className="text-sm text-gray-300 font-medium leading-relaxed">{item.value}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AboutScreen;
