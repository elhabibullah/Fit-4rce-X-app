import React, { useMemo } from 'react';
import { Home, Dumbbell, Apple, User, Shield, Lock } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import { Screen } from '../../types.ts';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isLocked?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, isActive, onClick, isLocked = false }) => {
  const activeClasses = 'text-[#8A2BE2] scale-110';
  const inactiveClasses = 'text-gray-500';
  
  const iconClasses = isLocked 
    ? 'text-gray-600' 
    : isActive ? activeClasses : inactiveClasses;
    
  const labelClasses = isLocked 
    ? 'text-gray-600' 
    : isActive ? 'text-white' : 'text-gray-500';

  return (
    <button 
      onClick={onClick} 
      disabled={isLocked}
      className="relative flex flex-col items-center justify-center w-full transition-all duration-300 transform disabled:cursor-not-allowed enabled:hover:text-[#8A2BE2] enabled:hover:scale-105"
      aria-label={label}
    >
      {isLocked && (
        <div className="absolute top-0 right-3 bg-gray-900 p-0.5 rounded-full">
            <Lock className="w-3 h-3 text-yellow-400" />
        </div>
      )}
      <Icon 
        className={`w-7 h-7 mb-1 transition-all duration-300 ${iconClasses}`} 
        style={isActive && !isLocked ? { filter: 'drop-shadow(0 0 10px #8A2BE2)' } : {}}
      />
      <span className={`text-xs font-medium transition-colors duration-300 ${labelClasses}`}>{label}</span>
    </button>
  );
};


const BottomNav: React.FC = () => {
  const { screen, setScreen, translate, planId, showStatus } = useApp();

  const navItems = useMemo(() => [
    { icon: Home, label: translate('nav.home'), screen: Screen.Home, premium: false },
    { icon: Dumbbell, label: translate('nav.workout'), screen: Screen.Workout, premium: false },
    { icon: Apple, label: translate('nav.nutrition'), screen: Screen.Nutrition, premium: true },
    { icon: Shield, label: translate('nav.defense'), screen: Screen.SelfDefense, premium: true },
    { icon: User, label: translate('nav.profile'), screen: Screen.Profile, premium: false },
  ], [translate]);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-black/50 backdrop-blur-lg border-t border-gray-800 z-50">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isLocked = item.premium && planId !== 'premium';
          return (
            <NavItem 
              key={item.screen}
              icon={item.icon}
              label={item.label}
              screen={item.screen}
              isActive={screen === item.screen}
              isLocked={isLocked}
              onClick={() => {
                if (isLocked) {
                  showStatus(translate('premiumFeature.locked'));
                } else {
                  setScreen(item.screen);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;