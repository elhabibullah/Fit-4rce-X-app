import React from 'react';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import { useApp } from '../../hooks/useApp.ts';
import { X, Award, FileText, CheckCircle2, Globe, Flame, Shield, Sparkles, BookOpen, HeartPulse } from 'lucide-react';
import { TrainerProfile, Language } from '../../types.ts';
import { ABDELWAHID_CV } from '../../data/abdelwahidCV.ts';

interface TrainerCVModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainer: TrainerProfile;
}

const TrainerCVModal: React.FC<TrainerCVModalProps> = ({ isOpen, onClose, trainer }) => {
    const { translate, language } = useApp();

    if (!isOpen) return null;

    const cvData = ABDELWAHID_CV[language as Language] || ABDELWAHID_CV[Language.FR];

    return (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[9999] flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
            {/* Standalone floating high-contrast close button */}
            <button 
              onClick={onClose} 
              className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[10000] p-3 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-2xl transition-transform active:scale-90 flex items-center justify-center cursor-pointer border border-white/20"
              aria-label="Fermer"
              title="Fermer le profil du coach"
            >
                <X className="w-6 h-6 stroke-[2.5]"/>
            </button>

            <Card className="max-w-2xl w-full h-[90vh] sm:h-[84vh] flex flex-col relative border-[#DAA520]/40 shadow-[0_0_60px_rgba(218,165,32,0.15)] bg-zinc-950/95 overflow-hidden">
                {/* Header with Close Bar */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-zinc-800/80 shrink-0">
                    <span className="text-[10px] font-black uppercase text-[#DAA520] tracking-widest">
                        Master Coach CV
                    </span>
                    <button 
                      onClick={onClose} 
                      className="flex items-center gap-1 text-gray-300 hover:text-white px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-bold uppercase transition-colors"
                      aria-label="Fermer"
                    >
                        <X className="w-4 h-4"/>
                        <span>Fermer</span>
                    </button>
                </div>

                {/* Header with Photo & Titles */}
                <div className="text-center pt-3 pb-3 border-b border-zinc-800/80 shrink-0 px-4">
                    <div className="relative inline-block">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-900 border-2 border-[#DAA520] mx-auto overflow-hidden shadow-[0_0_25px_rgba(218,165,32,0.35)]">
                            <img src={trainer.photoUrl} alt={cvData.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-[#DAA520] text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">
                            Pro
                        </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mt-3">
                        {cvData.name}
                    </h2>
                    <p className="text-[#DAA520] font-bold text-xs sm:text-sm tracking-wide mt-0.5">
                        {cvData.titles.join(' • ')}
                    </p>
                </div>

                {/* Scrollable CV Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 space-y-5 text-gray-300 text-sm leading-relaxed">
                    {/* Inspirational Quote */}
                    <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#DAA520]/10 via-purple-950/20 to-transparent rounded-xl border border-[#DAA520]/30 text-center italic text-[#DAA520] font-medium text-xs sm:text-sm">
                        {cvData.quote}
                    </div>

                    {/* Professional Profile / Bio */}
                    <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
                        <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm uppercase tracking-wider pb-1 border-b border-zinc-800">
                            <FileText className="w-4 h-4 text-[#DAA520]" />
                            <span>{translate('cv.summary') || 'Profil Professionnel'}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed pt-1">
                            {cvData.summary}
                        </p>
                    </div>

                    {/* Badges Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        {cvData.certsBadges.map((badge, idx) => (
                            <div key={idx} className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800/80 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-[#DAA520] mb-1">
                                    <Award className="w-4 h-4 shrink-0" />
                                    <span className="text-[11px] font-black uppercase tracking-wider truncate">{badge.title}</span>
                                </div>
                                <p className="text-[10px] text-zinc-400 font-medium leading-snug">{badge.subtitle}</p>
                            </div>
                        ))}
                    </div>

                    {/* Domains of Expertise & Disciplines */}
                    <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-3">
                        <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm uppercase tracking-wider pb-1 border-b border-zinc-800">
                            <Flame className="w-4 h-4 text-purple-400" />
                            <span>{cvData.domainsTitle}</span>
                        </div>
                        <div className="space-y-3 pt-1">
                            {cvData.domains.map((domain, idx) => (
                                <div key={idx} className="text-xs sm:text-sm">
                                    <div className="font-bold text-purple-300 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                        <span>{domain.title}</span>
                                    </div>
                                    <p className="text-zinc-400 text-xs mt-0.5 pl-3 leading-relaxed">
                                        {domain.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Qualifications & Official Certifications */}
                    <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2.5">
                        <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm uppercase tracking-wider pb-1 border-b border-zinc-800">
                            <Shield className="w-4 h-4 text-cyan-400" />
                            <span>{cvData.qualificationsTitle}</span>
                        </div>
                        <div className="space-y-2 pt-1">
                            {cvData.qualifications.map((qual, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-300">
                                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                    <span>{qual}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Training Philosophy */}
                    <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2.5">
                        <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm uppercase tracking-wider pb-1 border-b border-zinc-800">
                            <Sparkles className="w-4 h-4 text-[#DAA520]" />
                            <span>{cvData.philosophyTitle}</span>
                        </div>
                        <p className="text-xs text-zinc-400 italic">
                            {cvData.philosophyIntro}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {cvData.philosophyPoints.map((pt, idx) => (
                                <div key={idx} className="p-3 bg-black/40 rounded-lg border border-zinc-800">
                                    <p className="text-xs font-bold text-white mb-1">{pt.title}</p>
                                    <p className="text-[11px] text-zinc-400 leading-relaxed">{pt.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Spoken Languages */}
                    <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-start gap-3">
                        <Globe className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-white uppercase tracking-wider">{cvData.spokenLanguagesTitle}</p>
                            <p className="text-xs text-emerald-300/90 mt-0.5">{cvData.spokenLanguages}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Modal Actions */}
                <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950/80 shrink-0">
                    <Button onClick={onClose} variant="secondary" className="w-full uppercase tracking-wider text-xs font-bold py-3">
                        {translate('done')}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default TrainerCVModal;
