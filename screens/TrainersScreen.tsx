
import React, { useState, useMemo } from 'react';
import { ChevronLeft, Search, Star, Lock, FileText } from 'lucide-react';
import { useApp } from '../hooks/useApp.ts';
import { Screen, TrainerProfile } from '../types.ts';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import TrainerCVModal from '../components/trainers/TrainerCVModal.tsx';

const TrainersScreen: React.FC = () => {
  const { setScreen, openBookingScreen, translate, constants, planId } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCVTrainer, setSelectedCVTrainer] = useState<TrainerProfile | null>(null);
  const TRAINER_PROFILES = constants.TRAINER_PROFILES;

  const isPremium = planId === 'premium';

  const filteredTrainers = useMemo(() => {
    if (!searchTerm) {
      return TRAINER_PROFILES;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return TRAINER_PROFILES.filter(
      (trainer) =>
        trainer.name.toLowerCase().includes(lowercasedTerm) ||
        trainer.specializations.some((spec) => spec.toLowerCase().includes(lowercasedTerm)) ||
        trainer.titles.some((title) => title.toLowerCase().includes(lowercasedTerm))
    );
  }, [searchTerm, TRAINER_PROFILES]);

  return (
    <div className="animate-fadeIn space-y-6">
      {selectedCVTrainer && (
          <TrainerCVModal 
            isOpen={!!selectedCVTrainer} 
            onClose={() => setSelectedCVTrainer(null)} 
            trainer={selectedCVTrainer} 
          />
      )}

      <header className="flex items-center relative -mb-2">
        <button onClick={() => setScreen(Screen.Profile)} className="p-2 -ml-2 text-gray-400 hover:text-white absolute left-0">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <h1 className="text-2xl font-bold text-white text-center flex-grow">{translate('trainers.title')}</h1>
      </header>

      <div className="relative">
        <input
          type="text"
          placeholder={translate('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>
      
      {filteredTrainers.length > 0 ? (
        <div className="space-y-6">
            {filteredTrainers.map((trainer) => (
                <Card key={trainer.name} className="animate-fadeIn">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <img src={trainer.photoUrl} alt={trainer.name} className="w-24 h-24 rounded-full border-4 border-purple-400 object-cover mx-auto sm:mx-0 flex-shrink-0 shadow-lg shadow-purple-500/40" />
                        <div className="text-center sm:text-left flex-grow">
                            <h2 className="text-xl font-semibold text-white">{trainer.name}</h2>
                            <p className="text-purple-400 font-medium">{trainer.titles.join(' · ')}</p>
                            <div className="flex items-center justify-center sm:justify-start mt-2">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                                <span className="font-bold text-white">{trainer.rating.toFixed(1)}</span>
                                <span className="text-gray-400 text-sm ml-2">({trainer.reviews} {translate('trainers.reviews')})</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                                {trainer.specializations.map(spec => (
                                    <span key={spec} className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded-full">{spec}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <Button 
                            onClick={() => setSelectedCVTrainer(trainer)} 
                            variant="secondary" 
                            className="flex items-center justify-center text-xs"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            View Full CV
                        </Button>
                        <Button onClick={() => openBookingScreen(trainer)} className="flex items-center justify-center text-xs" disabled={!isPremium}>
                            {!isPremium && <Lock className="w-3 h-3 mr-1 inline-block text-yellow-400 !opacity-100"/>}
                            {isPremium ? translate('trainers.bookSession') : translate('premiumFeature.locked')}
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
      ) : (
         <Card className="text-center py-10">
            <p className="text-gray-400">{translate('noResults')}</p>
         </Card>
      )}
    </div>
  );
};

export default TrainersScreen;
