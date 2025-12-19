import React, { useRef, useState, useCallback } from 'react';
import Card from '../components/common/Card.tsx';
import { ChevronRight, CreditCard, Shield, Globe, MessageSquareQuote, Target, BarChart, RefreshCw, Share2, History, Bookmark, Camera, Lock, User, Watch, Info } from 'lucide-react';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import Button from '../components/common/Button.tsx';
import PrivacyModal from '../components/profile/PrivacyModal.tsx';
import AboutAppModal from '../components/profile/AboutAppModal.tsx';
import ImageCropper from '../components/profile/ImageCropper.tsx';
import PwaInstallModal from '../components/profile/PwaInstallModal.tsx';

const ProfileOption: React.FC<{ icon: React.ElementType; title: string; onClick?: () => void; disabled?: boolean; subtitle?: string }> = ({ icon: Icon, title, onClick, disabled = false, subtitle }) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left group p-3 flex items-center justify-between bg-black/50 rounded-lg transition-colors duration-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed enabled:hover:bg-gray-800/80 enabled:hover:border-purple-500"
    >
        <div className="flex items-center space-x-3 overflow-hidden">
            <Icon className="w-5 h-5 text-purple-400 group-hover:text-white transition-colors" />
            <div className="overflow-hidden">
                <p className="font-bold text-white text-sm tracking-wide truncate">{title}</p>
                {subtitle && <p className="text-[10px] text-gray-500 font-medium truncate">{subtitle}</p>}
            </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors shrink-0" />
    </button>
);

const ProfileScreen: React.FC = () => {
    const { 
        profile, setScreen, resetApp, translate, isSyncing, syncProfile, 
        updateUserProfile, language, installPromptEvent, clearInstallPrompt,
        openDeviceModal
    } = useApp();
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setImageToCrop(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleCropSave = (croppedImageUrl: string) => {
        updateUserProfile({ avatar_url: croppedImageUrl });
        setImageToCrop(null);
    };

    const handleShare = async () => {
        const shareText = translate('profile.share.text', { 
            goal: translate(`goal.${profile?.goal?.[0] || 'build_muscle'}`),
            level: translate(`level.${profile?.fitness_level || 'beginner'}`)
        });
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Fit-4rce-X', text: shareText, url: window.location.origin });
            } catch (err) { console.error('Share failed:', err); }
        } else {
            alert(translate('profile.share.notSupported'));
        }
    };

    const handleInstallClick = async () => {
        if (installPromptEvent) {
            installPromptEvent.prompt();
            const { outcome } = await installPromptEvent.userChoice;
            if (outcome === 'accepted') clearInstallPrompt();
        } else {
            setIsPwaModalOpen(true);
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-fadeIn" key={language}>
            <header className="text-center pt-4">
                <div className="relative inline-block group">
                    <button 
                        onClick={handleAvatarClick}
                        className="w-24 h-24 rounded-full border-4 border-[#8A2BE2] overflow-hidden shadow-[0_0_20px_rgba(138,43,226,0.5)] transition-transform group-hover:scale-105"
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                <User className="w-12 h-12 text-gray-600" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                </div>
                <h1 className="text-2xl font-bold mt-4 text-white tracking-tight">{profile?.full_name || translate('profile.notSet')}</h1>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <Shield className="w-4 h-4 text-[#8A2BE2]" fill="currentColor" />
                    <span className="text-xs font-bold uppercase text-purple-400 tracking-widest">{translate('profile.premiumMember')}</span>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <Card className="text-center p-3">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{translate('profile.goal')}</p>
                    <p className="text-xs font-bold text-white mt-1 truncate">{profile?.goal?.[0] ? translate(`goal.${profile.goal[0]}`) : '--'}</p>
                </Card>
                <Card className="text-center p-3">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{translate('profile.level')}</p>
                    <p className="text-xs font-bold text-white mt-1 truncate">{profile?.fitness_level ? translate(`level.${profile.fitness_level}`) : '--'}</p>
                </Card>
            </div>

            <div className="space-y-4">
                 <section>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Core Training</h3>
                    <div className="space-y-2">
                        <ProfileOption icon={History} title={translate('profile.history.title')} onClick={() => setScreen(Screen.WorkoutHistory)} />
                        <ProfileOption icon={Bookmark} title={translate('profile.saved.title')} onClick={() => setScreen(Screen.SavedWorkouts)} />
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Ecosystem</h3>
                    <div className="space-y-2">
                        <ProfileOption icon={CreditCard} title={translate('profile.subscription.title')} onClick={() => setScreen(Screen.SubscriptionManagement)} />
                        <ProfileOption icon={Watch} title={translate('device.title')} subtitle={translate('device.subtitle')} onClick={openDeviceModal} />
                        <ProfileOption icon={MessageSquareQuote} title={translate('profile.services.title')} onClick={() => setScreen(Screen.Trainers)} />
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">Settings</h3>
                    <div className="space-y-2">
                        <ProfileOption icon={Globe} title={translate('profile.language.title')} onClick={() => setScreen(Screen.Language)} subtitle={language.toUpperCase()} />
                        <ProfileOption icon={RefreshCw} title={translate('profile.sync.title')} onClick={syncProfile} disabled={isSyncing} />
                        <ProfileOption icon={Share2} title={translate('profile.share.title')} onClick={handleShare} />
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-3 ml-1">System</h3>
                    <div className="space-y-2">
                        <ProfileOption icon={Info} title={translate('profile.about.title')} onClick={() => setIsAboutModalOpen(true)} />
                        <ProfileOption icon={Shield} title={translate('profile.privacy.title')} onClick={() => setIsPrivacyModalOpen(true)} />
                    </div>
                </section>

                <div className="pt-4 space-y-4">
                    <Button onClick={handleInstallClick} className="w-full bg-blue-600 border-blue-500 hover:bg-blue-700">
                        {translate('pwa.modal.title')}
                    </Button>
                    <Button variant="secondary" onClick={resetApp} className="w-full border-red-900 text-red-500 hover:bg-red-950/20">
                        <Lock className="w-4 h-4 mr-2 inline-block" />
                        {translate('profile.reset')}
                    </Button>
                </div>
            </div>

            <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
            <AboutAppModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
            <PwaInstallModal isOpen={isPwaModalOpen} onClose={() => setIsPwaModalOpen(false)} />
            {imageToCrop && <ImageCropper src={imageToCrop} onSave={handleCropSave} onClose={() => setImageToCrop(null)} />}
        </div>
    );
};

export default ProfileScreen;
