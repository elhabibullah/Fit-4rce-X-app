import React, { useRef, useState } from 'react';
import Card from '../components/common/Card.tsx';
import { ChevronRight, CreditCard, Globe, MessageSquareQuote, Watch, Info, Camera, Lock, User, History, Bookmark, RefreshCw, Shield } from 'lucide-react';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import Button from '../components/common/Button.tsx';
import PrivacyModal from '../components/profile/PrivacyModal.tsx';
import AboutAppModal from '../components/profile/AboutAppModal.tsx';
import ImageCropper from '../components/profile/ImageCropper.tsx';

const ProfileOption: React.FC<{ icon: React.ElementType; title: string; onClick?: () => void; disabled?: boolean; subtitle?: string }> = ({ icon: Icon, title, onClick, disabled = false, subtitle }) => {
    const IconComp = Icon as any;
    return (
        <button 
          onClick={onClick}
          disabled={disabled}
          className="w-full text-left group p-3.5 flex items-center justify-between bg-zinc-900/40 rounded-xl transition-all border border-gray-800 hover:border-purple-500/50 active:scale-[0.98]"
        >
            <div className="flex items-center space-x-3 overflow-hidden">
                {(IconComp as any) && <IconComp className="w-5 h-5 text-purple-400" />}
                <div className="overflow-hidden">
                    <p className="font-bold text-white text-xs tracking-wide">{title}</p>
                    {subtitle && <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors shrink-0" />
        </button>
    );
};

const ProfileScreen: React.FC = () => {
    const { 
        profile, setScreen, resetApp, translate, isSyncing, syncProfile, 
        updateUserProfile, language, openDeviceModal
    } = useApp();
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    return (
        <div className="space-y-6 pb-24 animate-fadeIn px-2" key={language}>
            <header className="text-center pt-8">
                <div className="relative inline-block group">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-full border-2 border-purple-500 overflow-hidden shadow-[0_0_25px_rgba(138,43,226,0.3)] transition-transform group-hover:scale-105"
                    >
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                <User className="w-10 h-10 text-gray-700" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                </div>
                <h1 className="text-xl font-bold mt-4 text-white uppercase tracking-widest">{profile?.full_name || translate('profile.notSet')}</h1>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px] font-black uppercase text-purple-400 tracking-[0.2em]">{translate('profile.premiumMember')}</span>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-3">
                <Card className="text-center p-3.5 border-gray-800">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{translate('profile.goal')}</p>
                    <p className="text-[10px] font-bold text-white mt-1 uppercase truncate">{profile?.goal?.[0] ? translate(`goal.${profile.goal[0]}`) : '--'}</p>
                </Card>
                <Card className="text-center p-3.5 border-gray-800">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{translate('profile.level')}</p>
                    <p className="text-[10px] font-bold text-white mt-1 uppercase truncate">{profile?.fitness_level ? translate(`level.${profile.fitness_level}`) : '--'}</p>
                </Card>
            </div>

            <div className="space-y-6">
                 <section>
                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-3 ml-1">{translate('profile.section.training')}</h3>
                    <div className="space-y-2">
                        <ProfileOption icon={History} title={translate('profile.history.title')} onClick={() => setScreen(Screen.WorkoutHistory)} />
                        <ProfileOption icon={Bookmark} title={translate('profile.saved.title')} onClick={() => setScreen(Screen.SavedWorkouts)} />
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-3 ml-1">{translate('profile.section.ecosystem')}</h3>
                    <div className="space-y-2">
                        <ProfileOption icon={CreditCard} title={translate('profile.subscription.title')} onClick={() => setScreen(Screen.SubscriptionManagement)} />
                        <ProfileOption icon={Watch} title={translate('profile.gear.title')} subtitle={translate('profile.gear.subtitle')} onClick={openDeviceModal} />
                        <ProfileOption icon={MessageSquareQuote} title={translate('profile.services.title')} onClick={() => setScreen(Screen.Trainers)} />
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-3 ml-1">{translate('profile.section.settings')}</h3>
                    <div className="space-y-2">
                        <ProfileOption icon={Globe} title={translate('profile.language.title')} onClick={() => setScreen(Screen.Language)} subtitle={language.toUpperCase()} />
                        <ProfileOption icon={RefreshCw} title={translate('profile.sync.title')} onClick={syncProfile} disabled={isSyncing} />
                    </div>
                </section>

                <section>
                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-3 ml-1">{translate('profile.section.system')}</h3>
                    <div className="space-y-2">
                        <ProfileOption icon={Info} title={translate('profile.about.title')} onClick={() => setIsAboutModalOpen(true)} />
                        <ProfileOption icon={Shield} title={translate('profile.privacy.title')} onClick={() => setIsPrivacyModalOpen(true)} />
                    </div>
                </section>

                <div className="pt-4">
                    <Button variant="secondary" onClick={resetApp} className="w-full border-red-900/50 text-red-500 hover:bg-red-950/20 py-4 uppercase text-xs font-bold tracking-widest">
                        <Lock className="w-4 h-4 mr-2 inline-block" />
                        {translate('profile.reset')}
                    </Button>
                </div>
            </div>

            <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
            <AboutAppModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
            {imageToCrop && <ImageCropper src={imageToCrop} onSave={handleCropSave} onClose={() => setImageToCrop(null)} />}
        </div>
    );
};

export default ProfileScreen;