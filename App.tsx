import React, { useState, useEffect } from 'react';
import { useApp } from './hooks/useApp.ts';
import SplashScreen from './screens/SplashScreen.tsx';
import DashboardScreen from './screens/HomeScreen.tsx';
import { WorkoutScreen } from './screens/WorkoutScreen.tsx';
import NutritionScreen from './screens/NutritionScreen.tsx';
import ProfileScreen from './screens/ProfileScreen.tsx';
import BottomNav from './components/layout/BottomNav.tsx';
import { Screen } from './types.ts';
import { ExpertAdviceScreen } from './screens/ExpertAdviceScreen.tsx';
import TrainersScreen from './screens/TrainersScreen.tsx';
import LanguageScreen from './screens/LanguageScreen.tsx';
import { SelfDefenseScreen, DISCIPLINE_BACKGROUNDS } from './screens/SelfDefenseScreen.tsx';
import IntroScreen from './screens/IntroScreen.tsx';
import SubscriptionScreen from './screens/SubscriptionScreen.tsx';
import ProfileSetupScreen from './screens/ProfileSetupScreen.tsx';
import WorkoutHistoryScreen from './screens/WorkoutHistoryScreen.tsx';
import SavedWorkoutsScreen from './screens/SavedWorkoutsScreen.tsx';
import SignInScreen from './screens/SignInScreen.tsx';
import { SpinningScreen } from './screens/SpinningScreen.tsx';
import RunningScreen from './screens/RunningScreen.tsx';
import { CheckCircle } from 'lucide-react';
import AICoach from './components/common/AICoach.tsx';
import HolographicGearModal from './components/profile/HolographicGearModal.tsx';
import { ENVIRONMENT_THUMBNAILS } from './components/common/VirtualEnvironment.tsx';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary.tsx';

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
    session, profile, loading, screen, expertToBook, closeBookingScreen, 
    updateUserProfile, onboardingStep, setOnboardingStep, showSignIn, setShowSignIn,
    statusMessage, isCoachOpen, setIsCoachOpen, isDeviceModalOpen, closeDeviceModal
  } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => setIsSplashVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const imagesToPreload = [
      ...Object.values(DISCIPLINE_BACKGROUNDS),
      ...Object.values(ENVIRONMENT_THUMBNAILS),
      "https://ai-webbuilder-prod.s3.us-east-1.amazonaws.com/public/images/ad85aead516242b9b73a5140f6db62a1/1d87d3f1227c4419aca5c972544ab725.Screenshot_20251114-091219_Chrome.jpg"
    ];
    imagesToPreload.forEach(url => { const img = new Image(); img.src = url; });
  }, []);
  
  const handleIntroComplete = () => setOnboardingStep('subscription');
  const handleSubscriptionComplete = () => setOnboardingStep('profileSetup');
  const handleProfileSetupComplete = async () => { await updateUserProfile({ onboarding_complete: true }); };
  
  if (isSplashVisible || loading) return <SplashScreen />;
  
  if (!session || (profile && !profile.onboarding_complete)) {
    return (
      <GlobalErrorBoundary>
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
      </GlobalErrorBoundary>
    );
  }

  const isImmersive = [Screen.Spinning, Screen.Running, Screen.Nutrition].includes(screen);

  return (
    <GlobalErrorBoundary>
      <div className="bg-black text-white min-h-screen font-sans relative">
        <HolographicGearModal isOpen={isDeviceModalOpen} onClose={closeDeviceModal} />
        {expertToBook && <ExpertAdviceScreen trainer={expertToBook} onClose={closeBookingScreen} />}
        
        <main className={`transition-all duration-500 ${isImmersive ? 'w-full h-screen overflow-hidden p-0' : 'p-4 max-w-2xl mx-auto pb-20'}`}>
          <MainContent screen={screen} />
        </main>

        {isCoachOpen && <AICoach isVisible={isCoachOpen} onClose={() => setIsCoachOpen(false)} />}
        {!isImmersive && <BottomNav />}

        {statusMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[9999] pointer-events-none">
            <div className="bg-gray-900/95 backdrop-blur-xl text-white px-6 py-4 rounded-xl shadow-lg border border-green-500 flex items-center gap-3 animate-slideInUp pointer-events-auto">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="font-bold text-sm">{statusMessage}</span>
            </div>
          </div>
        )}
      </div>
    </GlobalErrorBoundary>
  );
};

export default App;
