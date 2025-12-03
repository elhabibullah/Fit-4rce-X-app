
import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp.ts';
import { Bot, BarChart, BookOpen, LayoutDashboard, Utensils, Timer, Scale, X, Lock, ShoppingBag } from 'lucide-react';
import { Screen } from '../types.ts';
import Button from '../components/common/Button.tsx';

// Import the new components
import DietAlLog from '../components/nutrition/DietAlLog.tsx';
import DietAlDashboard from '../components/nutrition/DietAlDashboard.tsx';
import DietAlPlan from '../components/nutrition/DietAlPlan.tsx';
import DietAlAnalytics from '../components/nutrition/DietAlAnalytics.tsx';
import DietAlChat from '../components/nutrition/DietAlChat.tsx';
import { DietAlFasting } from '../components/nutrition/DietAlFasting.tsx';
import DietAlTracking from '../components/nutrition/DietAlTracking.tsx';
import F4XStore from '../components/nutrition/F4XStore.tsx';
import { DeviceStatusTrigger } from '../components/common/DeviceStatusTrigger.tsx';


type DietAlView = 'log' | 'dashboard' | 'plan' | 'analytics' | 'chat' | 'fasting' | 'tracking' | 'store';

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => {
  const activeClasses = 'text-green-500';
  const inactiveClasses = 'text-gray-500';

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center w-full transition-colors duration-200 py-1"
      aria-label={label}
    >
      <Icon
        className={`w-5 h-5 mb-0.5 ${isActive ? activeClasses : inactiveClasses}`}
        style={isActive ? { filter: 'drop-shadow(0 0 8px #22c55e)' } : {}}
      />
      <span className={`text-[9px] font-medium leading-tight text-center ${isActive ? 'text-white' : 'text-gray-500'}`}>{label}</span>
    </button>
  );
};

const NUTRITION_NAV_ITEMS: { view: DietAlView, icon: React.ElementType, labelKey: string }[] = [
    { view: 'dashboard', icon: LayoutDashboard, labelKey: 'nutrition.nav.dashboard' },
    { view: 'store', icon: ShoppingBag, labelKey: 'nutrition.nav.store' },
    { view: 'log', icon: Utensils, labelKey: 'nutrition.nav.log' },
    { view: 'plan', icon: BookOpen, labelKey: 'nutrition.nav.plan' },
    { view: 'tracking', icon: Scale, labelKey: 'nutrition.nav.tracking' }, // RESTORED
    { view: 'analytics', icon: BarChart, labelKey: 'nutrition.nav.analytics' }, // RESTORED
    { view: 'fasting', icon: Timer, labelKey: 'nutrition.nav.fasting' },
    { view: 'chat', icon: Bot, labelKey: 'nutrition.nav.chat' },
];

const PremiumLockScreen: React.FC = () => {
  const { translate, setScreen } = useApp();
  const featureName = translate('nav.nutrition');

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="w-24 h-24 bg-yellow-900/50 rounded-full flex items-center justify-center mb-4 border-4 border-yellow-700">
        <Lock className="w-12 h-12 text-yellow-400" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">{translate('premiumLock.title', { featureName })}</h1>
      <p className="text-gray-400 max-w-sm mx-auto">{translate('premiumLock.description')}</p>
      <div className="mt-6 w-full max-w-xs">
        <Button onClick={() => setScreen(Screen.SubscriptionManagement)} className="w-full !text-white !bg-green-500 hover:!bg-green-600 !shadow-lg !shadow-green-500/50">
          {translate('premiumLock.upgradeButton')}
        </Button>
      </div>
    </div>
  );
};


const NutritionScreen: React.FC = () => {
  const { translate, setScreen, planId, nutritionTab, setNutritionTab } = useApp();
  const [activeView, setActiveView] = useState<DietAlView>('log');
  
  const isPremium = planId === 'premium';

  // Handle Deep Linking from Home Screen
  useEffect(() => {
      if (nutritionTab) {
          setActiveView(nutritionTab as DietAlView);
          setNutritionTab(null); // Reset trigger
      }
  }, [nutritionTab, setNutritionTab]);

  const renderContent = () => {
    switch (activeView) {
      case 'log':
        return <DietAlLog />;
      case 'dashboard':
        return <DietAlDashboard />;
      case 'plan':
        return <DietAlPlan />;
      case 'fasting':
        return <DietAlFasting />;
      case 'tracking':
        return <DietAlTracking />;
      case 'analytics':
        return <DietAlAnalytics />;
      case 'chat':
        return <DietAlChat />;
      case 'store':
        return <F4XStore />;
      default:
        return <DietAlLog />;
    }
  };

  return (
    <div className="bg-gray-900 text-gray-200 h-full flex flex-col font-sans overflow-hidden">
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-lg border-b border-gray-800 z-50 flex items-center justify-between px-4">
        <h2 className="font-bold text-xl text-white">
            {activeView === 'store' ? translate('nutrition.store.headerTitle') : translate('nutrition.title')}
        </h2>
        <div className="flex items-center gap-3">
           <DeviceStatusTrigger />
           <button 
             onClick={() => setScreen(Screen.Home)} 
             className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
             aria-label={translate('nutrition.exit')}
           >
             <X className="w-6 h-6 text-gray-300" />
           </button>
        </div>
      </header>

      {/* FIX: Using flex-1 min-h-0 guarantees scrollability in flexbox implementations */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 pt-20 pb-24 scroll-smooth">
        {isPremium ? renderContent() : <PremiumLockScreen />}
      </main>

      {/* Bottom Navigation for DietAl Section */}
      {isPremium && (
          <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-lg border-t border-gray-800 z-50">
            <div className="flex justify-between items-center h-full w-full px-2">
              {NUTRITION_NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.view}
                  icon={item.icon}
                  label={translate(item.labelKey)}
                  isActive={activeView === item.view}
                  onClick={() => setActiveView(item.view)}
                />
              ))}
            </div>
          </div>
      )}
    </div>
  );
};

export default NutritionScreen;
