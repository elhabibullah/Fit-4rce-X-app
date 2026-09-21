import React, { useState } from 'react';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import { useApp } from '../../hooks/useApp.ts';
import { X, Scale, Ruler, User2, Save, Check } from 'lucide-react';
import { Gender } from '../../types.ts';

interface EditMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditMetricsModal: React.FC<EditMetricsModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateUserProfile, translate } = useApp();

  const [weight, setWeight] = useState<number>(profile?.weight || 70);
  const [height, setHeight] = useState<number>(profile?.height || 175);
  const [gender, setGender] = useState<Gender>(profile?.gender || 'male');
  const [age, setAge] = useState<number>(profile?.age || 25);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    // Keep weight history updated when weight changes
    const currentHistory = profile?.weight_history || [];
    const newHistory = [...currentHistory];
    if (!profile?.weight || profile.weight !== weight) {
      newHistory.push({
        date: new Date().toISOString(),
        weight: weight
      });
    }

    updateUserProfile({
      weight,
      height,
      gender,
      age,
      weight_history: newHistory
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="max-w-md w-full max-h-[90vh] flex flex-col bg-zinc-950 border border-purple-500/40 shadow-[0_0_50px_rgba(138,43,226,0.2)] p-4 sm:p-5 relative rounded-2xl overflow-hidden my-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white p-2 rounded-full bg-zinc-900 border border-zinc-800 transition-transform active:scale-90 z-10"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4 pt-1 shrink-0">
          <div className="w-10 h-10 rounded-full bg-purple-950/60 border border-purple-500/50 flex items-center justify-center mx-auto mb-1.5 text-purple-400">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-widest">
            {translate('profileSetup.step3.title') || 'Mensurations & Profil'}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Modifiez votre poids, taille, genre et âge en temps réel
          </p>
        </div>

        <div className="space-y-3.5 overflow-y-auto pr-1 py-1 flex-1 min-h-0">
          {/* Gender Selection */}
          <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800">
            <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2 flex items-center gap-1.5">
              <User2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Genre / Sexe</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                  gender === 'male'
                    ? 'bg-purple-900/60 text-white border-purple-500 shadow-[0_0_15px_rgba(138,43,226,0.3)]'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span>{translate('gender.male')}</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                  gender === 'female'
                    ? 'bg-purple-900/60 text-white border-purple-500 shadow-[0_0_15px_rgba(138,43,226,0.3)]'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span>{translate('gender.female')}</span>
              </button>
            </div>
          </div>

          {/* Weight */}
          <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-purple-400" />
                <span>{translate('profileSetup.step3.weight')}</span>
              </label>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  min="30"
                  max="250"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-zinc-950 border border-purple-500/50 rounded-lg px-2 py-0.5 text-right font-mono font-bold text-white text-base focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                <span className="text-xs text-purple-300 font-bold font-mono">kg</span>
              </div>
            </div>
            <input
              type="range"
              min="30"
              max="180"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Height */}
          <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                <span>{translate('profileSetup.step3.height')}</span>
              </label>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value, 10) || 0)}
                  className="w-16 bg-zinc-950 border border-cyan-500/50 rounded-lg px-2 py-0.5 text-right font-mono font-bold text-white text-base focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <span className="text-xs text-cyan-300 font-bold font-mono">cm</span>
              </div>
            </div>
            <input
              type="range"
              min="120"
              max="230"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Age */}
          <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                <User2 className="w-3.5 h-3.5 text-[#DAA520]" />
                <span>{translate('profileSetup.step2.age') || 'Âge'}</span>
              </label>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  min="12"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
                  className="w-14 bg-zinc-950 border border-[#DAA520]/50 rounded-lg px-2 py-0.5 text-right font-mono font-bold text-white text-base focus:outline-none focus:ring-1 focus:ring-[#DAA520]"
                />
                <span className="text-xs text-[#DAA520] font-bold font-mono">ans</span>
              </div>
            </div>
            <input
              type="range"
              min="14"
              max="95"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#DAA520]"
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800 flex gap-3 shrink-0">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 py-3 text-xs uppercase font-bold tracking-wider"
          >
            {translate('back')}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2"
          >
            {isSaved ? <Check className="w-4 h-4 text-green-400" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'Enregistré !' : 'Enregistrer'}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default EditMetricsModal;
