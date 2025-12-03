import React from 'react';
import { ChevronLeft, Dumbbell } from 'lucide-react';
import { useApp } from '../hooks/useApp.ts';
import { Screen, WorkoutPlan } from '../types.ts';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';

const SavedWorkoutsScreen: React.FC = () => {
  const { setScreen, translate, savedWorkouts, setSelectedPlan } = useApp();

  const handleStartWorkout = (plan: WorkoutPlan) => {
    setSelectedPlan(plan);
    setScreen(Screen.Workout);
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <header className="flex items-center relative -mb-2">
        <button onClick={() => setScreen(Screen.Profile)} className="p-2 -ml-2 text-gray-400 hover:text-white absolute left-0">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <h1 className="text-2xl font-bold text-white text-center flex-grow">{translate('saved.title')}</h1>
      </header>
      
      {savedWorkouts.length > 0 ? (
        <div className="space-y-4">
            {savedWorkouts.map((plan, index) => (
                <Card key={index} className="animate-fadeIn">
                    <h2 className="text-xl font-bold text-white">{plan.title}</h2>
                    <p className="text-gray-400 mt-1 text-sm">{plan.description}</p>
                    <Button onClick={() => handleStartWorkout(plan)} className="w-full mt-4 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 mr-2" />
                        {translate('saved.start')}
                    </Button>
                </Card>
            ))}
        </div>
      ) : (
         <Card className="text-center py-16">
            <p className="text-gray-400 text-lg">{translate('saved.empty')}</p>
         </Card>
      )}
    </div>
  );
};

export default SavedWorkoutsScreen;