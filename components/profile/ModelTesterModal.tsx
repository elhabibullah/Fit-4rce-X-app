import React, { useState, useRef } from 'react';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import { X, Upload, Info, AlertCircle, Play, Pause, Camera, Eye, RotateCw } from 'lucide-react';
import { HolographicCoach } from '../common/HolographicCoach.tsx';
import { COACH_MODEL_URL, SIFU_MODEL_URL } from '../../lib/constants.ts';

interface ModelTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEST_MOVEMENTS = [
  { id: 'pushup', label: 'Pompes (Push-up)' },
  { id: 'squat', label: 'Squats' },
  { id: 'lunge', label: 'Fentes (Lunges)' },
  { id: 'plank', label: 'Gainage (Plank)' },
  { id: 'walk', label: 'Marche Humaine' },
  { id: 'run', label: 'Course Dynamique' },
  { id: 'jump', label: 'Jumping Jacks' },
  { id: 'martial_mabu', label: 'Cavalier (Ma Bu)' },
  { id: 'martial_punch', label: 'Frappes Directes' },
  { id: 'martial_kick', label: 'Coups de Pied' },
  { id: 'martial_taichi', label: 'Neo Tai Chi Flow' },
  { id: 'idle', label: 'Posture & Respiration' },
];

const ModelTesterModal: React.FC<ModelTesterModalProps> = ({ isOpen, onClose }) => {
  const [selectedModel, setSelectedModel] = useState<string>(SIFU_MODEL_URL);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState<string>('pushup');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [cameraPreset, setCameraPreset] = useState<'face' | 'profile' | 'free'>('profile');
  const [studioTheme, setStudioTheme] = useState<'white' | 'dark'>('white');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.glb')) {
        setError('Seuls les fichiers .glb sont pris en charge pour notre moteur holographique.');
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        setError('Attention : le fichier dépasse 25 Mo.');
      } else {
        setError(null);
      }

      const url = URL.createObjectURL(file);
      setUploadedUrl(url);
      setSelectedModel(url);
    }
  };

  const handleClose = () => {
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
    setUploadedUrl(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <Card className="max-w-5xl w-full h-[92vh] flex flex-col relative border-purple-500/30 shadow-[0_0_60px_rgba(138,43,226,0.15)] bg-neutral-950 p-4 sm:p-6 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span>Studio Biomécanique 3D</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                LABO HUMANOÏDE
              </span>
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              Testez en temps réel l'anatomie, les pompes et les mouvements sur Sifu Abdelwahid et le Cyborg.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 shrink-0">
          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-gray-400">Personnage :</span>
            <button
              onClick={() => setSelectedModel(SIFU_MODEL_URL)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedModel === SIFU_MODEL_URL
                  ? 'bg-[#DAA520] text-black shadow-md'
                  : 'bg-neutral-900 text-gray-300 hover:bg-neutral-800'
              }`}
            >
              Sifu Abdelwahid
            </button>
            <button
              onClick={() => setSelectedModel(COACH_MODEL_URL)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedModel === COACH_MODEL_URL
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-neutral-900 text-gray-300 hover:bg-neutral-800'
              }`}
            >
              Cyborg F4X
            </button>
            {uploadedUrl && (
              <button
                onClick={() => setSelectedModel(uploadedUrl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  selectedModel === uploadedUrl
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-neutral-900 text-gray-300 hover:bg-neutral-800'
                }`}
              >
                Fichier Custom
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-neutral-700 text-gray-300 hover:text-white hover:bg-neutral-800 flex items-center gap-1.5"
              title="Charger un modèle .glb local"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Importer .glb</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".glb"
              className="hidden"
            />
          </div>

          {/* Camera, Speed & Play Controls */}
          <div className="flex items-center gap-2">
            {/* Camera Angle */}
            <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-[10px] font-black">
              <button
                onClick={() => setCameraPreset('face')}
                className={`px-2 py-1 rounded-lg ${cameraPreset === 'face' ? 'bg-neutral-800 text-white' : 'text-gray-400'}`}
              >
                Face
              </button>
              <button
                onClick={() => setCameraPreset('profile')}
                className={`px-2 py-1 rounded-lg ${cameraPreset === 'profile' ? 'bg-neutral-800 text-white' : 'text-gray-400'}`}
              >
                Profil
              </button>
              <button
                onClick={() => setCameraPreset('free')}
                className={`px-2 py-1 rounded-lg ${cameraPreset === 'free' ? 'bg-neutral-800 text-white' : 'text-gray-400'}`}
              >
                Libre
              </button>
            </div>

            {/* Play / Pause */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-all active:scale-95"
              title={isPaused ? 'Lecture' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
            </button>

            {/* Speed */}
            <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-[10px] font-black">
              {[0.5, 1.0, 1.5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded-lg ${speed === s ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Viewport & Movement Picker */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 mt-3">
          {/* 3D Viewport */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-neutral-800 relative bg-neutral-900 shadow-inner">
            <HolographicCoach
              key={selectedModel}
              modelUrl={selectedModel}
              exerciseName={exerciseName}
              isPaused={isPaused}
              speed={speed}
              cameraPreset={cameraPreset}
              studioTheme={studioTheme}
              onToggleStudioTheme={setStudioTheme}
              hideBadge={false}
              hideThemeToggle={false}
            />

            <div className="absolute bottom-3 right-3 z-30 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-white font-black tracking-wider uppercase">
                Moteur Humanoïde Actif
              </span>
            </div>
          </div>

          {/* Movement List Sidebar */}
          <div className="w-full md:w-64 flex flex-col shrink-0 bg-neutral-900/60 rounded-2xl border border-neutral-800 p-3 overflow-hidden">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-300 mb-2 px-1">
              Mouvements à tester ({TEST_MOVEMENTS.length})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {TEST_MOVEMENTS.map((mov) => {
                const isActive = exerciseName === mov.id;
                return (
                  <button
                    key={mov.id}
                    onClick={() => setExerciseName(mov.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-neutral-800/80 text-gray-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <span>{mov.label}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-500/50 rounded-xl flex items-center gap-3 shrink-0">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-200">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-end gap-3 shrink-0">
          <Button onClick={handleClose} variant="secondary" className="px-6">
            Fermer le Labo
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ModelTesterModal;
