import React from 'react';
import { ChevronLeft, Calendar } from 'lucide-react';
import { useApp } from '../hooks/useApp.ts';
import { Screen } from '../types.ts';
import Card from '../components/common/Card.tsx';

const WorkoutHistoryScreen: React.FC = () => {
  const { setScreen, translate, workoutHistory } = useApp();

  return (
    <div className="animate-fadeIn space-y-6">
      <header className="flex items-center relative -mb-2">
        <button onClick={() => setScreen(Screen.Profile)} className="p-2 -ml-2 text-gray-400 hover:text-white absolute left-0">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <h1 className="text-2xl font-bold text-white text-center flex-grow">{translate('history.title')}</h1>
      </header>
      
      {workoutHistory.length > 0 ? (
        <div className="space-y-4">
            {workoutHistory.map((item, index) => (
                <Card key={index} className="animate-fadeIn">
                    <h2 className="text-xl font-bold text-white">{item.title}</h2>
                    <p className="text-gray-400 mt-1 text-sm">{item.description}</p>
                    <div className="flex items-center text-purple-400 text-xs font-semibold mt-3">
                        <Calendar className="w-4 h-4 mr-2"/>
                        <span>{translate('history.completedOn', { date: item.date })}</span>
                    </div>
                </Card>
            ))}
        </div>
      ) : (
         <Card className="text-center py-16">
            <p className="text-gray-400 text-lg">{translate('history.empty')}</p>
         </Card>
      )}
    </div>
  );
};

export default WorkoutHistoryScreen;