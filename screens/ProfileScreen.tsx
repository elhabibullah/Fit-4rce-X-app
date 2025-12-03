
import React, { useRef, useState, useCallback } from 'react';
import Card from '../components/common/Card.tsx';
import { ChevronRight, CreditCard, Shield, Globe, MessageSquareQuote, Target, BarChart, RefreshCw, Share2, History, Bookmark, Camera, Lock, User, Zap, Watch, Info } from 'lucide-react';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import Button from '../components/common/Button.tsx';
import PrivacyModal from '../components/profile/PrivacyModal.tsx';
import AboutAppModal from '../components/profile/AboutAppModal.tsx';
import ImageCropper from '../components/profile/ImageCropper.tsx';

const ProfileOption: React.FC<{ icon: React.ElementType; title: string; onClick?: () => void; disabled?: boolean; subtitle?: string }> = ({ icon: Icon, title, onClick, disabled = false, subtitle }) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left group p-3 flex items-center justify-between bg-black/50 rounded-lg transition-colors duration-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed enabled:hover:bg-gray-800/80 enabled:hover:border-purple-500"
    >
        <div className="flex items-center space-x-3 overflow-hidden">
            <Icon className="w-5 h-5 text-purple-400 shrink-0"/>
            <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-white truncate">{title}</span>
                {subtitle && <span className="text-xs text-green-400 truncate font-mono">{subtitle}</span>}
            </div>
        </div>
        {disabled ? <Lock className="w-5 h-5 text-yellow-400 shrink-0"/> : <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-300 shrink-0"/>}
    </button>
);

const ProfileScreen: React.FC = () => {
    const { setScreen, translate, profile, user, resetApp, updateUserProfile, syncProfile, isSyncing, planId, isDeviceConnected, openDeviceModal } = useApp();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPrivacyModalOpen, setPrivacyModalOpen] = useState(false);
    const [isAboutModalOpen, setAboutModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    const isPremium = planId === 'premium';

    const handleShare = useCallback(async () => {
        if (!profile) return;
        const goalText = profile.goal && profile.goal.length > 0
            ? profile.goal.map(g => translate(`goal.${g}`)).join(', ')
            : 'get fit';
        const levelText = profile.fitness_level ? translate(`level.${profile.fitness_level}`) : 'new';

        const shareText = translate('profile.share.text', {
            goal: goalText,
            level: levelText
        });

        try {
            if (!navigator.share) {
                alert(translate('profile.share.notSupported'));
                return;
            }
            await navigator.share({
                title: translate('profile.share.title'),
                text: shareText,
                url: window.location.href,
            });
        } catch (error) {
            console.error('Error sharing profile progress:', error);
            alert(translate('profile.share.failed'));
        }
    }, [profile, translate]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToCrop(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropSave = (croppedImageUrl: string) => {
        updateUserProfile({ avatar_url: croppedImageUrl });
        setImageToCrop(null);
    };


    return (
        <div className="animate-fadeIn space-y-6">
            <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setPrivacyModalOpen(false)} />
            <AboutAppModal isOpen={isAboutModalOpen} onClose={() => setAboutModalOpen(false)} />
            
            {imageToCrop && (
                <ImageCropper 
                    src={imageToCrop} 
                    onSave={handleCropSave}
                    onClose={() => setImageToCrop(null)}
                />
            )}
            
            <div className="text-center relative">
                <div className="relative w-28 h-28 mx-auto">
                    <div 
                      className="w-28 h-28 rounded-full border-4 border-[#8A2BE2] shadow-[0_0_20px_rgba(138,43,226,0.6)] bg-cover bg-center bg-gray-800 flex items-center justify-center"
                      style={{ 
                          backgroundImage: profile?.avatar_url ? `url(${profile.avatar_url})` : 'none',
                      }}
                      aria-label="User profile picture"
                    >
                      {!profile?.avatar_url && <User className="w-16 h-16 text-gray-500" />}
                    </div>
                    <button onClick={handleAvatarClick} className="absolute bottom-0 right-0 p-2 bg-black rounded-full hover:bg-gray-800 transition-colors border-2 border-gray-600">
                        <Camera className="w-5 h-5 text-[#8A2BE2]" />
                    </button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
                </div>
                <h2 className="text-xl font-semibold text-white mt-4">{profile?.full_name || user?.email}</h2>
                <p className="text-gray-400">{translate('profile.premiumMember')}</p>
            </div>
            
            {profile && (
                <Card>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="p-3 bg-gray-800 rounded-full inline-block mb-2">
                                <Target className="w-6 h-6 text-purple-400"/>
                            </div>
                            <h4 className="text-sm text-gray-500 uppercase tracking-wider">{translate('profile.goal')}</h4>
                            <p className="text-base font-normal text-white">{profile.goal && profile.goal.length > 0 ? profile.goal.map(g => translate(`goal.${g}`)).join(', ') : translate('profile.notSet')}</p>
                        </div>
                        <div>
                            <div className="p-3 bg-gray-800 rounded-full inline-block mb-2">
                               <BarChart className="w-6 h-6 text-purple-400"/>
                            </div>
                            <h4 className="text-sm text-gray-500 uppercase tracking-wider">{translate('profile.level')}</h4>
                            <p className="text-base font-normal text-white">{profile.fitness_level ? translate(`level.${profile.fitness_level}`) : translate('profile.notSet')}</p>
                        </div>
                    </div>
                </Card>
            )}

            <div className="space-y-2">
                 <ProfileOption 
                    icon={Watch}
                    title={translate('device.title')}
                    subtitle={isDeviceConnected ? translate('device.status.connected') : undefined}
                    onClick={openDeviceModal}
                />
                <ProfileOption 
                    icon={CreditCard}
                    title={translate('profile.subscription.title')}
                    onClick={() => setScreen(Screen.SubscriptionManagement)}
                />
                 <ProfileOption 
                    icon={History}
                    title={translate('profile.history.title')}
                    onClick={() => setScreen(Screen.WorkoutHistory)}
                />
                 <ProfileOption 
                    icon={Bookmark}
                    title={translate('profile.saved.title')}
                    onClick={() => setScreen(Screen.SavedWorkouts)}
                />
                <ProfileOption 
                    icon={MessageSquareQuote}
                    title={translate('profile.services.title')}
                    onClick={() => setScreen(Screen.Trainers)}
                    // Unlocked for all users
                />
                 <ProfileOption
                    icon={RefreshCw}
                    title={translate('profile.sync.title')}
                    onClick={syncProfile}
                />
                 <ProfileOption 
                    icon={Share2}
                    title={translate('profile.share.title')}
                    onClick={handleShare}
                />
                <ProfileOption 
                    icon={Globe}
                    title={translate('profile.language.title')}
                    onClick={() => setScreen(Screen.Language)}
                />
                <ProfileOption 
                    icon={Info}
                    title={translate('profile.about.title')}
                    onClick={() => setAboutModalOpen(true)}
                />
                <ProfileOption 
                    icon={Shield}
                    title={translate('profile.privacy.title')}
                    onClick={() => setPrivacyModalOpen(true)}
                />
            </div>

             <div className="p-4">
                <Button variant="secondary" onClick={resetApp} className="w-full normal-case font-medium tracking-normal">
                    {translate('profile.reset')}
                </Button>
            </div>
        </div>
    );
};

export default ProfileScreen;
