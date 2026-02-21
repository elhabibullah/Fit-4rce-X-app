import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp.ts';
import { Bot, BarChart, BookOpen, LayoutDashboard, Utensils, Timer, Scale, X, Lock, ShoppingBag } from 'lucide-react';
import { Screen } from '../types.ts';
import Button from '../components/common/Button.tsx';

import DietAlLog from '../components/nutrition/DietAlLog.tsx';
import DietAlDashboard from '../components/nutrition/DietAlDashboard.tsx';
import DietAlPlan from '../components/nutrition/DietAlPlan.tsx';
import DietAlAnalytics from '../hooks/DietAlAnalytics.tsx';
import DietAlChat from '../components/nutrition/DietAlChat.tsx';
import { DietAlFasting } from '../components/nutrition/DietAlFasting.tsx';
import DietAlTracking from '../components/nutrition/DietAlTracking.tsx';
import F4XStore from '../components/profile/F4XStore.tsx';
import { DeviceStatusTrigger } from '../components/common/DeviceStatusTrigger.tsx';

type DietAlView = 'dashboard' | 'store' | 'log' | 'plan' | 'tracking' | 'analytics' | 'fasting' | 'chat';

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => {
    const IconComp = Icon as any;
    return (
        <button onClick={onClick} className="flex flex-col items-center justify-center w-full py-1 h-full active:scale-95 transition-transform">
          {(IconComp as any) && <IconComp className={`w-5 h-5 mb-0.5 ${isActive ? 'text-purple-400' : 'text-gray-600'}`} />}
          <span className={`text-[7px] font-black uppercase tracking-tighter ${isActive ? 'text-white' : 'text-gray-700'}`}>{label}</span>
        </button>
    );
};

const NUTRITION_NAV_ITEMS: { view: DietAlView, icon: React.ElementType, labelKey: string }[] = [
    { view: 'dashboard', icon: LayoutDashboard, labelKey: 'nutrition.nav.dashboard' },
    { view: 'store', icon: ShoppingBag, labelKey: 'nutrition.nav.store' },
    { view: 'log', icon: Utensils, labelKey: 'nutrition.nav.log' },
    { view: 'plan', icon: BookOpen, labelKey: 'nutrition.nav.plan' },
    { view: 'tracking', icon: Scale, labelKey: 'nutrition.nav.tracking' },
    { view: 'analytics', icon: BarChart, labelKey: 'nutrition.nav.analytics' },
    { view: 'fasting', icon: Timer, labelKey: 'nutrition.nav.fasting' },
    { view: 'chat', icon: Bot, labelKey: 'nutrition.nav.chat' },
];

/**
 * FIXED: Completed the NutritionScreen component which was truncated.
 * This fixes the error where 'Type () => void is not assignable to FC' and the missing default export.
 */
const NutritionScreen: React.FC = () => {
  const { translate, setScreen, nutritionTab, setNutritionTab } = useApp();
  
  // Use nutritionTab from context or default to dashboard
  const activeView = (nutritionTab as DietAlView) || 'dashboard';

  const handleClose = () => {
    setNutritionTab(null);
    setScreen(Screen.Home);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <DietAlDashboard />;
      case 'store': return <F4XStore />;
      case 'log': return <DietAlLog />;
      case 'plan': return <DietAlPlan />;
      case 'tracking': return <DietAlTracking />;
      case 'analytics': return <DietAlAnalytics />;
      case 'fasting': return <DietAlFasting />;
      case 'chat': return <DietAlChat />;
      default: return <DietAlDashboard />;
    }
  };

  const isStore = activeView === 'store';

  return (
    <div className={`flex flex-col h-full bg-black font-['Poppins'] ${isStore ? '' : 'animate-fadeIn'}`}>
      {!isStore && (
        <header className="flex-none flex items-center justify-between py-4 border-b border-gray-800 mb-6 px-1">
          <button onClick={handleClose} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <DeviceStatusTrigger />
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {renderContent()}
      </main>

      {/* Internal Nutrition Navigation Bar */}
      <div className="fixed bottom-20 left-0 right-0 h-14 bg-gray-950/80 backdrop-blur-md border-t border-gray-800 z-40 flex items-center justify-around px-2 max-w-2xl mx-auto">
        {NUTRITION_NAV_ITEMS.map((item) => (
          <NavItem
            key={item.view}
            icon={item.icon}
            label={translate(item.labelKey)}
            isActive={activeView === item.view}
            onClick={() => setNutritionTab(item.view)}
          />
        ))}
      </div>
    </div>
  );
};

export default NutritionScreen;