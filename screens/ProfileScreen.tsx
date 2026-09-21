import React, { useRef, useState } from 'react';
import Card from '../components/common/Card.tsx';
import { 
    ChevronRight, CreditCard, Globe, MessageSquareQuote, Watch, 
    Info, Camera, User, History, Bookmark, Shield, Bot, 
    Scale, Ruler, User2, Edit3 
} from 'lucide-react';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import Button from '../components/common/Button.tsx';
import PrivacyModal from '../components/profile/PrivacyModal.tsx';
import ImageCropper from '../components/profile/ImageCropper.tsx';
import { SensorsPermissionBanner } from '../components/common/SensorsPermissionBanner.tsx';
import ModelTesterModal from '../components/profile/ModelTesterModal.tsx';
import EditMetricsModal from '../components/profile/EditMetricsModal.tsx';

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
        profile, setScreen, resetApp, translate, 
        updateUserProfile, language, openDeviceModal
    } = useApp();
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isModelTesterOpen, setIsModelTesterOpen] = useState(false);
    const [isEditMetricsOpen, setIsEditMetricsOpen] = useState(false);
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

    const genderLabel = profile?.gender 
        ? translate(`gender.${profile.gender}`) 
        : translate('gender.male');

    return (
        <div className="w-full space-y-5 pb-44 animate-fadeIn px-2" key={language}>
            {/* Profile Avatar & Title */}
            <header className="text-center pt-6">
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
                <h1 className="text-xl font-bold mt-4 text-white uppercase tracking-widest">
                    {profile?.full_name || translate('profile.notSet')}
                </h1>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px] font-black uppercase text-purple-400 tracking-[0.2em]">
                        {translate('profile.premiumMember')}
                    </span>
                </div>
            </header>

            {/* Editable Biometrics Card (Poids, Taille, Genre, Âge) */}
            <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border border-purple-500/30 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-purple-400" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-white">
                            {translate('profileSetup.step3.title') || 'Mensurations Biométriques'}
                        </h2>
                    </div>
                    <button
                        onClick={() => setIsEditMetricsOpen(true)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 hover:text-purple-300 bg-purple-950/40 hover:bg-purple-900/50 px-2.5 py-1 rounded-lg border border-purple-500/30 transition-all active:scale-95"
                    >
                        <Edit3 className="w-3 h-3" />
                        <span>Modifier</span>
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                    {/* Weight */}
                    <button
                        onClick={() => setIsEditMetricsOpen(true)}
                        className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 hover:border-purple-500/40 transition-colors text-left group"
                    >
                        <div className="flex items-center justify-between text-zinc-400 text-[10px] font-black uppercase tracking-wider mb-1">
                            <span className="truncate">{translate('profileSetup.step3.weight')}</span>
                            <Scale className="w-3 h-3 text-purple-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-base sm:text-lg font-black font-mono text-white">
                                {profile?.weight || '--'}
                            </span>
                            <span className="text-[10px] text-purple-400 font-mono font-bold">kg</span>
                        </div>
                    </button>

                    {/* Height */}
                    <button
                        onClick={() => setIsEditMetricsOpen(true)}
                        className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 hover:border-cyan-500/40 transition-colors text-left group"
                    >
                        <div className="flex items-center justify-between text-zinc-400 text-[10px] font-black uppercase tracking-wider mb-1">
                            <span className="truncate">{translate('profileSetup.step3.height')}</span>
                            <Ruler className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-base sm:text-lg font-black font-mono text-white">
                                {profile?.height || '--'}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-mono font-bold">cm</span>
                        </div>
                    </button>

                    {/* Gender */}
                    <button
                        onClick={() => setIsEditMetricsOpen(true)}
                        className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 hover:border-[#DAA520]/40 transition-colors text-left group"
                    >
                        <div className="flex items-center justify-between text-zinc-400 text-[10px] font-black uppercase tracking-wider mb-1">
                            <span className="truncate">Genre</span>
                            <User2 className="w-3 h-3 text-[#DAA520] group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex items-baseline">
                            <span className="text-xs sm:text-sm font-bold text-white capitalize truncate">
                                {genderLabel}
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Goal and Level Cards */}
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

            <SensorsPermissionBanner />

            {/* Navigation Options */}
            <div className="space-y-2 pt-1">
                <ProfileOption icon={Bot} title="Studio 3D & Miroir Humanoïde" subtitle="Cyborg F4X • Sifu • Biomécanique" onClick={() => setIsModelTesterOpen(true)} />
                <ProfileOption icon={Watch} title={translate('profile.gear.title')} onClick={openDeviceModal} />
                <ProfileOption icon={CreditCard} title={translate('profile.subscription.title')} onClick={() => setScreen(Screen.SubscriptionManagement)} />
                <ProfileOption icon={History} title={translate('profile.history.title')} onClick={() => setScreen(Screen.WorkoutHistory)} />
                <ProfileOption icon={Bookmark} title={translate('profile.saved.title')} onClick={() => setScreen(Screen.SavedWorkouts)} />
                <ProfileOption icon={MessageSquareQuote} title={translate('profile.services.title')} onClick={() => setScreen(Screen.Trainers)} />
                <ProfileOption icon={Globe} title={translate('profile.language.title')} onClick={() => setScreen(Screen.Language)} />
                <ProfileOption icon={Info} title={translate('profile.about.title')} onClick={() => setScreen(Screen.AboutApp)} />

                <div className="pt-4">
                    <Button 
                      variant="secondary" 
                      onClick={resetApp} 
                      className="w-full !border-red-500/30 !text-red-500 hover:!bg-red-950/40 hover:!text-red-400 py-3.5 uppercase text-xs font-bold tracking-widest"
                    >
                        Réinitialiser l'application
                    </Button>
                </div>
            </div>

            <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
            <ModelTesterModal isOpen={isModelTesterOpen} onClose={() => setIsModelTesterOpen(false)} />
            <EditMetricsModal isOpen={isEditMetricsOpen} onClose={() => setIsEditMetricsOpen(false)} />
            {imageToCrop && <ImageCropper src={imageToCrop} onSave={handleCropSave} onClose={() => setImageToCrop(null)} />}
        </div>
    );
};

export default ProfileScreen;
