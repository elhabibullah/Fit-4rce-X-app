
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
import IntroScreen from './IntroScreen.tsx';
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

// Optimized Main Content Switcher - Wrapped in Memo for Performance
const MainContent: React.FC<{
  screen: Screen;
}> = React.memo(({ screen }) => {
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
    session,
    profile,
    loading,
    screen, 
    expertToBook, 
    closeBookingScreen, 
    updateUserProfile,
    onboardingStep,
    setOnboardingStep,
    showSignIn,
    setShowSignIn,
    statusMessage,
    isCoachOpen,
    setIsCoachOpen,
    isDeviceModalOpen,
    closeDeviceModal
  } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => setIsSplashVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Stealth Preloader Logic - Optimized
  useEffect(() => {
    const preloadImages = () => {
      const imagesToPreload = [
        ...Object.values(DISCIPLINE_BACKGROUNDS),
        ...Object.values(ENVIRONMENT_THUMBNAILS),
        "https://ai-webbuilder-prod.s3.us-east-1.amazonaws.com/public/images/ad85aead516242b9b73a5140f6db62a1/1d87d3f1227c4419aca5c972544ab725.Screenshot_20251114-091219_Chrome.jpg", // Coach
        "https://ai-webbuilder-prod.s3.us-east-1.amazonaws.com/public/images/b41ca67767304c519a58cec7ad351092/788ced7328b0464cb7a81e01e3e45f68.Screenshot_20250429-140125_Samsung%20Notes.jpg" // Abdel
      ];
      
      imagesToPreload.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    };
    
    // Run after a short delay to prioritize initial render
    const timer = setTimeout(preloadImages, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  const handleIntroComplete = () => setOnboardingStep('subscription');
  const handleSubscriptionComplete = () => {
    setOnboardingStep('profileSetup');
  };
  const handleProfileSetupComplete = async () => {
    await updateUserProfile({ onboarding_complete: true });
  };
  
  if (isSplashVisible || loading) {
    return <SplashScreen />;
  }
  
  // This is the main router for the app.
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

  // --- UNIFIED LAYOUT ARCHITECTURE ---
  // Determines if the current screen requires full-screen immersion (no padding, no nav)
  const isImmersive = [Screen.Spinning, Screen.Running, Screen.Nutrition].includes(screen);

  return (
    <GlobalErrorBoundary>
      <div className="bg-black text-white min-h-screen font-sans relative">
        
        {/* Global Modals */}
        <HolographicGearModal isOpen={isDeviceModalOpen} onClose={closeDeviceModal} />
        {expertToBook && <ExpertAdviceScreen trainer={expertToBook} onClose={closeBookingScreen} />}
        
        {/* Main Application Area */}
        <main 
          className={`
            transition-all duration-500
            ${isImmersive ? 'w-full h-screen overflow-hidden p-0' : 'p-4 max-w-2xl mx-auto pb-20'}
          `}
        >
          <MainContent screen={screen} />
        </main>

        {/* Global AI Coach Overlay */}
        {isCoachOpen && <AICoach isVisible={isCoachOpen} onClose={() => setIsCoachOpen(false)} />}

        {/* Bottom Navigation (Hidden in Immersive Mode) */}
        {!isImmersive && <BottomNav />}

        {/* Global Status Toaster - FORCED VISIBILITY */}
        {statusMessage && (
          <div 
            id="status-toast"
            key={statusMessage + Date.now()} 
            className="fixed left-1/2 -translate-x-1/2 pointer-events-none w-full max-w-md px-4"
            style={{ 
              zIndex: '2147483647 !important' as any, 
              top: '128px', // Approx 8rem / 128px to clear large headers
              position: 'fixed' 
            }} 
          >
            <div className="bg-gray-900/95 backdrop-blur-xl text-white px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.6)] border border-green-500 flex items-center gap-3 animate-slideInUp pointer-events-auto">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="font-bold tracking-wide text-sm">{statusMessage}</span>
            </div>
          </div>
        )}
      </div>
    </GlobalErrorBoundary>
  );
};

export default App;
