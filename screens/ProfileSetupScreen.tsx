import React, { useState, useRef } from 'react';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import { useApp } from '../hooks/useApp.ts';
import { UserProfile, WorkoutGoal } from '../types.ts';
import { Camera, User as UserIcon, Check } from 'lucide-react';
import ImageCropper from '../components/profile/ImageCropper.tsx';

type OptionCardProps = {
    label: string;
    isSelected: boolean;
    onClick: () => void;
    multiSelect?: boolean;
};

const OptionCard: React.FC<OptionCardProps> = ({ label, isSelected, onClick, multiSelect = false }) => (
    <button onClick={onClick} className="w-full text-left relative transition-transform active:scale-95">
        <Card className={`text-center transition-all duration-300 py-4 ${isSelected ? '!scale-105 bg-gray-800 !border-purple-500 shadow-[0_0_15px_rgba(138,43,226,0.2)]' : 'border-gray-700'}`}>
            {multiSelect && isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                </div>
            )}
            <div className="text-sm font-bold text-white uppercase tracking-widest">{label}</div>
        </Card>
    </button>
);

interface ProfileSetupScreenProps {
  onComplete: () => void;
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete }) => {
    const { translate, updateUserProfile, profile: initialProfile, language } = useApp();
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [profile, setProfile] = useState<Partial<UserProfile>>({
        full_name: initialProfile?.full_name || '',
        avatar_url: initialProfile?.avatar_url,
        age: initialProfile?.age || 25,
        gender: initialProfile?.gender || 'male',
        height: initialProfile?.height || 154,
        weight: initialProfile?.weight || 70,
        fitness_level: initialProfile?.fitness_level || 'intermediate',
        goal: initialProfile?.goal || [],
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfile?.avatar_url || null);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleGoalSelection = (selectedGoal: WorkoutGoal) => {
        setProfile(p => {
            const currentGoals = p.goal || [];
            const newGoals = currentGoals.includes(selectedGoal)
                ? currentGoals.filter(g => g !== selectedGoal)
                : [...currentGoals, selectedGoal];
            return { ...p, goal: newGoals };
        });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setImageToCrop(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleCropSave = (croppedImageUrl: string) => {
        setAvatarPreview(croppedImageUrl);
        setProfile(p => ({ ...p, avatar_url: croppedImageUrl }));
        setImageToCrop(null);
    };

    const handleComplete = async () => {
        setIsProcessing(true);
        updateUserProfile(profile);
        setIsProcessing(false);
        onComplete();
    };

    const renderStep = () => {
        switch (step) {
            case 1: return ( // Identity
                <div className="animate-fadeIn w-full">
                    <h2 className="text-xl font-black text-center mb-8 uppercase tracking-[0.3em] text-white">{translate('profileSetup.step1.title')}</h2>
                    <input
                        type="text"
                        placeholder={translate('profileSetup.step1.fullName')}
                        value={profile.full_name}
                        onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                        className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-5 text-white text-center text-lg mb-8 focus:ring-1 focus:ring-purple-500 focus:outline-none placeholder:text-gray-600"
                    />
                    <div className="text-center mb-12">
                        <button onClick={() => fileInputRef.current?.click()} className="relative w-40 h-40 rounded-full mx-auto border-4 border-dashed border-gray-800 flex items-center justify-center hover:border-purple-500 transition-all overflow-hidden group">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-12 h-12 text-gray-700 group-hover:text-purple-400" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </button>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
                    </div>
                    <Button onClick={handleNext} className="w-full py-5 uppercase font-black tracking-widest text-sm" disabled={!profile.full_name}>{translate('next')}</Button>
                </div>
            );
            case 2: return ( // Specs
                <div className="animate-fadeIn w-full">
                    <h2 className="text-xl font-black text-center mb-10 uppercase tracking-[0.3em] text-white">{translate('profileSetup.step2.title')}</h2>
                    <div className="mb-10 bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
                        <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center">{translate('profileSetup.step2.age')}: <span className="text-white text-lg ml-2">{profile.age}</span></label>
                        <input
                            type="range" min="16" max="90" value={profile.age}
                            onChange={(e) => setProfile(p => ({ ...p, age: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4 mb-10">
                        <OptionCard label={translate('gender.male')} isSelected={profile.gender === 'male'} onClick={() => setProfile(p => ({ ...p, gender: 'male' }))} />
                        <OptionCard label={translate('gender.female')} isSelected={profile.gender === 'female'} onClick={() => setProfile(p => ({ ...p, gender: 'female' }))} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Button onClick={handleBack} variant="secondary" className="py-5 uppercase font-black tracking-widest text-xs">{translate('back')}</Button>
                        <Button onClick={handleNext} className="py-5 uppercase font-black tracking-widest text-xs">{translate('next')}</Button>
                     </div>
                </div>
            );
            case 3: return ( // Vitals
                 <div className="animate-fadeIn w-full">
                    <h2 className="text-xl font-black text-center mb-10 uppercase tracking-[0.3em] text-white">{translate('profileSetup.step3.title')}</h2>
                    <div className="space-y-8 mb-12">
                        <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
                            <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center">{translate('profileSetup.step3.height')}: <span className="text-white text-lg ml-2">{profile.height} cm</span></label>
                            <input
                                type="range" min="120" max="230" value={profile.height}
                                onChange={(e) => setProfile(p => ({ ...p, height: parseInt(e.target.value) }))}
                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>
                        <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
                            <label className="block text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center">{translate('profileSetup.step3.weight')}: <span className="text-white text-lg ml-2">{profile.weight} kg</span></label>
                            <input
                                type="range" min="30" max="180" value={profile.weight}
                                onChange={(e) => setProfile(p => ({ ...p, weight: parseInt(e.target.value) }))}
                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Button onClick={handleBack} variant="secondary" className="py-5 uppercase font-black tracking-widest text-xs">{translate('back')}</Button>
                        <Button onClick={handleNext} className="py-5 uppercase font-black tracking-widest text-xs">{translate('next')}</Button>
                     </div>
                </div>
            );
            case 4: return ( // Level
                 <div className="animate-fadeIn w-full">
                    <h2 className="text-xl font-black text-center mb-10 uppercase tracking-[0.3em] text-white">{translate('profileSetup.step4.title')}</h2>
                     <div className="grid grid-cols-1 gap-4 mb-12">
                        {['beginner', 'intermediate', 'advanced', 'elite'].map(l => (
                            <OptionCard key={l} label={translate(`level.${l}`)} isSelected={profile.fitness_level === l} onClick={() => setProfile(p => ({ ...p, fitness_level: l as any }))} />
                        ))}
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Button onClick={handleBack} variant="secondary" className="py-5 uppercase font-black tracking-widest text-xs">{translate('back')}</Button>
                        <Button onClick={handleNext} className="py-5 uppercase font-black tracking-widest text-xs" disabled={!profile.fitness_level}>{translate('next')}</Button>
                     </div>
                </div>
            );
            case 5: return ( // Goals
                 <div className="animate-fadeIn w-full">
                    <h2 className="text-xl font-black text-center mb-2 uppercase tracking-[0.3em] text-white">{translate('profileSetup.step5.title')}</h2>
                    <p className="text-gray-500 text-center text-[10px] font-black uppercase tracking-[0.4em] mb-12">{translate('profileSetup.step5.subtitle')}</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                        {['lose_weight', 'build_muscle', 'improve_endurance', 'learn_self_defense'].map(g => (
                            <OptionCard key={g} label={translate(`goal.${g}`)} isSelected={profile.goal?.includes(g as any) || false} onClick={() => handleGoalSelection(g as any)} multiSelect />
                        ))}
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Button onClick={handleBack} variant="secondary" className="py-5 uppercase font-black tracking-widest text-xs">{translate('back')}</Button>
                        <Button onClick={handleComplete} className="py-5 uppercase font-black tracking-widest text-xs" disabled={!profile.goal || profile.goal.length === 0 || isProcessing}>
                            {isProcessing ? translate('processing') : translate('finish')}
                        </Button>
                     </div>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen w-full bg-black flex flex-col items-center pt-24 pb-32 px-6" key={language}>
            {imageToCrop && <ImageCropper src={imageToCrop} onSave={handleCropSave} onClose={() => setImageToCrop(null)} />}
            <div className="w-full max-w-lg">
                <div className="flex justify-center mb-16">
                    <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${i <= step ? 'bg-purple-500 w-10 shadow-[0_0_10px_#8A2BE2]' : 'bg-gray-800 w-3'}`}></div>
                        ))}
                    </div>
                </div>
                {renderStep()}
            </div>
        </div>
    );
};

export default ProfileSetupScreen;