
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
    <button onClick={onClick} className="w-full text-left relative">
        <Card className={`text-center transition-all duration-300 ${isSelected ? '!scale-105 bg-gray-800 !border-[#8A2BE2]' : ''}`}>
            {multiSelect && isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#8A2BE2] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                </div>
            )}
            <div className="text-lg font-bold text-white">{label}</div>
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
        height: initialProfile?.height || 175,
        weight: initialProfile?.weight || 70,
        fitness_level: initialProfile?.fitness_level,
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
            case 1: return ( // Name and Photo
                <div className="animate-fadeIn w-full">
                    <h2 className="text-2xl font-bold text-center mb-6">{translate('profileSetup.step1.title')}</h2>
                    <input
                        type="text"
                        placeholder={translate('profileSetup.step1.fullName')}
                        value={profile.full_name}
                        onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white text-center text-lg mb-6 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <div className="text-center mb-6">
                        <button onClick={handleAvatarClick} className="relative w-32 h-32 rounded-full mx-auto border-4 border-dashed border-gray-600 flex items-center justify-center hover:border-purple-500 transition-colors">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <UserIcon className="w-12 h-12 text-gray-500" />
                            )}
                            <div className="absolute bottom-0 right-0 p-2 bg-[#8A2BE2] rounded-full">
                                <Camera className="w-5 h-5 text-white" />
                            </div>
                        </button>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
                    </div>
                    <Button onClick={handleNext} className="w-full" disabled={!profile.full_name}>{translate('next')}</Button>
                </div>
            );
            case 2: return ( // Age and Gender
                <div className="animate-fadeIn w-full">
                    <h2 className="text-2xl font-bold text-center mb-6">{translate('profileSetup.step2.title')}</h2>
                    <label className="block text-gray-400 mb-2">{translate('profileSetup.step2.age')}: {profile.age}</label>
                    <input
                        type="range"
                        min="16" max="99"
                        value={profile.age}
                        onChange={(e) => setProfile(p => ({ ...p, age: parseInt(e.target.value, 10) }))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 mb-6"
                    />
                     <label className="block text-gray-400 mb-2">{translate('profileSetup.step2.gender')}</label>
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        <OptionCard label={translate('gender.male')} isSelected={profile.gender === 'male'} onClick={() => setProfile(p => ({ ...p, gender: 'male' }))} />
                        <OptionCard label={translate('gender.female')} isSelected={profile.gender === 'female'} onClick={() => setProfile(p => ({ ...p, gender: 'female' }))} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Button onClick={handleBack} variant="secondary">{translate('back')}</Button>
                        <Button onClick={handleNext}>{translate('next')}</Button>
                     </div>
                </div>
            );
            case 3: return ( // Height and Weight
                 <div className="animate-fadeIn w-full">
                    <h2 className="text-2xl font-bold text-center mb-6">{translate('profileSetup.step3.title')}</h2>
                    <label className="block text-gray-400 mb-2">{translate('profileSetup.step3.height')}: {profile.height} cm</label>
                    <input
                        type="range"
                        min="120" max="220"
                        value={profile.height}
                        onChange={(e) => setProfile(p => ({ ...p, height: parseInt(e.target.value, 10) }))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 mb-6"
                    />
                    <label className="block text-gray-400 mb-2">{translate('profileSetup.step3.weight')}: {profile.weight} kg</label>
                    <input
                        type="range"
                        min="40" max="150"
                        value={profile.weight}
                        onChange={(e) => setProfile(p => ({ ...p, weight: parseInt(e.target.value, 10) }))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 mb-6"
                    />
                     <div className="grid grid-cols-2 gap-4">
                        <Button onClick={handleBack} variant="secondary">{translate('back')}</Button>
                        <Button onClick={handleNext}>{translate('next')}</Button>
                     </div>
                </div>
            );
            case 4: return ( // Fitness Level
                 <div className="animate-fadeIn w-full">
                    <h2 className="text-2xl font-bold text-center mb-6">{translate('profileSetup.step4.title')}</h2>
                     <div className="grid grid-cols-1 gap-4 mb-6">
                        <OptionCard label={translate('level.beginner')} isSelected={profile.fitness_level === 'beginner'} onClick={() => setProfile(p => ({ ...p, fitness_level: 'beginner' }))} />
                        <OptionCard label={translate('level.intermediate')} isSelected={profile.fitness_level === 'intermediate'} onClick={() => setProfile(p => ({ ...p, fitness_level: 'intermediate' }))} />
                        <OptionCard label={translate('level.advanced')} isSelected={profile.fitness_level === 'advanced'} onClick={() => setProfile(p => ({ ...p, fitness_level: 'advanced' }))} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Button onClick={handleBack} variant="secondary">{translate('back')}</Button>
                        <Button onClick={handleNext} disabled={!profile.fitness_level}>{translate('next')}</Button>
                     </div>
                </div>
            );
            case 5: return ( // Goal
                 <div className="animate-fadeIn w-full">
                    <h2 className="text-2xl font-bold text-center mb-2">{translate('profileSetup.step5.title')}</h2>
                    <p className="text-gray-400 text-center text-sm mb-6">{translate('profileSetup.step5.subtitle')}</p>
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        <OptionCard label={translate('goal.lose_weight')} isSelected={profile.goal?.includes('lose_weight') || false} onClick={() => handleGoalSelection('lose_weight')} multiSelect />
                        <OptionCard label={translate('goal.build_muscle')} isSelected={profile.goal?.includes('build_muscle') || false} onClick={() => handleGoalSelection('build_muscle')} multiSelect />
                        <OptionCard label={translate('goal.improve_endurance')} isSelected={profile.goal?.includes('improve_endurance') || false} onClick={() => handleGoalSelection('improve_endurance')} multiSelect />
                        <OptionCard label={translate('goal.learn_self_defense')} isSelected={profile.goal?.includes('learn_self_defense') || false} onClick={() => handleGoalSelection('learn_self_defense')} multiSelect />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Button onClick={handleBack} variant="secondary">{translate('back')}</Button>
                        <Button onClick={handleComplete} disabled={!profile.goal || profile.goal.length === 0 || isProcessing}>
                            {isProcessing ? translate('processing') : translate('finish')}
                        </Button>
                     </div>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4" key={language}>
            {imageToCrop && (
                <ImageCropper 
                    src={imageToCrop} 
                    onSave={handleCropSave}
                    onClose={() => setImageToCrop(null)}
                />
            )}
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i <= step ? 'bg-[#8A2BE2]' : 'bg-gray-700'}`}></div>
                        ))}
                    </div>
                </div>
                {renderStep()}
            </div>
        </div>
    );
};

export default ProfileSetupScreen;
