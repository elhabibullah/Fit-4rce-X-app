
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../hooks/useApp.ts';
import SplashScreen from '../../screens/SplashScreen.tsx';
import DashboardScreen from '../../screens/HomeScreen.tsx';
import { WorkoutScreen } from '../../screens/WorkoutScreen.tsx';
import NutritionScreen from '../../screens/NutritionScreen.tsx';
import ProfileScreen from '../../screens/ProfileScreen.tsx';
import BottomNav from '../profile/BottomNav.tsx';
import { Screen } from '../../types.ts';
import { ExpertAdviceScreen } from '../../screens/ExpertAdviceScreen.tsx';
import TrainersScreen from '../../screens/TrainersScreen.tsx';
import LanguageScreen from '../../screens/LanguageScreen.tsx';
import { SelfDefenseScreen } from '../../screens/SelfDefenseScreen.tsx';
import IntroScreen from '../../screens/IntroScreen.tsx';
import SubscriptionScreen from '../../screens/SubscriptionScreen.tsx';
import ProfileSetupScreen from '../../screens/ProfileSetupScreen.tsx';
import WorkoutHistoryScreen from '../../screens/WorkoutHistoryScreen.tsx';
import SavedWorkoutsScreen from '../../screens/SavedWorkoutsScreen.tsx';
import SignInScreen from '../../screens/SignInScreen.tsx';
import { SpinningScreen } from '../../screens/SpinningScreen.tsx';
import RunningScreen from '../../screens/RunningScreen.tsx';
import { CheckCircle } from 'lucide-react';
import AICoach from './AICoach.tsx';
import HolographicGearModal from '../profile/HolographicGearModal.tsx';
import { ENVIRONMENT_THUMBNAILS } from './VirtualEnvironment.tsx';
import GlobalErrorBoundary from './GlobalErrorBoundary.tsx';
import Loader from './Loader.tsx';

const MainContent: React.FC<{ screen: Screen }> = React.memo(({ screen }) => {
  switch (screen) {
    case Screen.Home: return <DashboardScreen />;
    case Screen.Workout: return <WorkoutScreen />;
    case Screen.SelfDefense: return <SelfDefenseScreen />;
    case Screen.Profile: return <ProfileScreen />;
    case Screen.Trainers: return <TrainersScreen />;
    case Screen.Language: return <LanguageScreen fromProfile={true} />;
    case Screen.WorkoutHistory: return <WorkoutHistoryScreen />;
    case Screen.SavedWorkouts: return <SavedWorkoutsScreen />;
    case Screen.SubscriptionManagement: return <SubscriptionScreen isManaging={true} />;
    case Screen.Spinning: return <SpinningScreen />;
    case Screen.Running: return <RunningScreen />;
    case Screen.Nutrition: return <NutritionScreen />;
    default: return <DashboardScreen />;
  }
});

const App: React.FC = () => {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const { 
    profile, loading, screen, expertToBook, closeBookingScreen, 
    updateUserProfile, onboardingStep, setOnboardingStep, showSignIn, setShowSignIn,
    statusMessage, isCoachOpen, setIsCoachOpen, isDeviceModalOpen, closeDeviceModal,
    isGeneratingWorkout, translate
  } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => setIsSplashVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleIntroComplete = () => setOnboardingStep('subscription');
  const handleSubscriptionComplete = () => setOnboardingStep('profileSetup');
  const handleProfileSetupComplete = async () => { 
    await updateUserProfile({ onboarding_complete: true }); 
  };
  
  const handleCloseCoach = useCallback(() => {
    setIsCoachOpen(false);
  }, [setIsCoachOpen]);

  if (isSplashVisible || loading) return <SplashScreen />;
  
  if (!profile?.onboarding_complete) {
    return (
      <GlobalErrorBoundary>
        <div className="bg-black min-h-screen w-full overflow-y-auto">
          {showSignIn ? (
            <SignInScreen onBack={() => setShowSignIn(false)} />
          ) : (
            (() => {
              switch (onboardingStep) {
                case 'language': return <LanguageScreen />;
                case 'intro': return <IntroScreen onComplete={handleIntroComplete} />;
                case 'subscription': return <SubscriptionScreen onPaymentSuccess={handleSubscriptionComplete} onSignInClick={() => setShowSignIn(true)} />;
                case 'profileSetup': return <ProfileSetupScreen onComplete={handleProfileSetupComplete} />;
                default: return <LanguageScreen />;
              }
            })()
          )}
        </div>
      </GlobalErrorBoundary>
    );
  }

  const isImmersive = [Screen.Spinning, Screen.Running].includes(screen);

  return (
    <GlobalErrorBoundary>
      <div className="bg-black text-white min-h-screen font-['Poppins'] relative w-full flex flex-col">
        <HolographicGearModal isOpen={isDeviceModalOpen} onClose={closeDeviceModal} />
        {expertToBook && <ExpertAdviceScreen trainer={expertToBook} onClose={closeBookingScreen} />}
        
        {isGeneratingWorkout && (
          <div className="fixed inset-0 z-[10001] bg-black flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
              <div className="relative mb-10">
                  <div className="scale-125">
                      <Loader />
                  </div>
              </div>
              <h2 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.6em] animate-pulse">
                {translate('workout.loading.calculating')}
              </h2>
          </div>
        )}

        <main className={`w-full flex-grow ${isImmersive ? 'h-screen overflow-hidden' : 'min-h-screen pb-32'}`}>
          <div className={isImmersive ? 'h-full w-full' : 'p-4 max-w-2xl mx-auto'}>
            <MainContent screen={screen} />
          </div>
        </main>

        {isCoachOpen && <AICoach isVisible={isCoachOpen} onClose={handleCloseCoach} />}
        {!isImmersive && <BottomNav />}

        {statusMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[9999] pointer-events-none">
            <div className="bg-gray-900/95 backdrop-blur-xl text-white px-6 py-4 rounded-xl shadow-lg border border-green-500 flex items-center gap-3 animate-slideInUp pointer-events-auto">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="font-bold text-sm uppercase tracking-widest">{statusMessage}</span>
            </div>
          </div>
        )}
      </div>
    </GlobalErrorBoundary>
  );
};

export default App;
