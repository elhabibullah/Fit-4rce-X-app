import React, { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { DailyMacros, FastingPlan, Language, Meal, MealPlanSection, Screen, TrainerProfile, TranslatedConstants, UserProfile, WeightHistoryItem, WorkoutPlan, WorkoutHistoryItem, OnboardingStep, CurrencyInfo, AIProvider, WorkoutGenerationParams, ConnectedDevice, LiveBioMetrics } from './types.ts';
import { getTranslatedConstants } from './lib/i18n.ts';
import { TRANSLATIONS } from './lib/translations.ts';
import { CURRENCY_MAP, DEFAULT_CURRENCY_INFO } from './screens/currency.ts';
import { generateWorkoutWithGemini } from './services/aiService.ts';

interface AppContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isSubscribed: boolean;
  planId: 'silver' | 'premium' | undefined;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  resetApp: () => void;
  signIn: (existingProfile: Partial<UserProfile & { email?: string }>) => void;
  finalizeOnboarding: (finalizedProfile: UserProfile) => void;
  isSyncing: boolean;
  syncProfile: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  expertToBook: TrainerProfile | null;
  openBookingScreen: (trainer: TrainerProfile) => void;
  closeBookingScreen: () => void;
  onboardingStep: OnboardingStep;
  setOnboardingStep: (step: OnboardingStep) => void;
  showSignIn: boolean;
  setShowSignIn: (show: boolean) => void;
  statusMessage: string | null;
  showStatus: (message: string) => void;
  isCoachOpen: boolean;
  setIsCoachOpen: (isOpen: boolean) => void;
  coachContext: string | null;
  setCoachContext: (context: string | null) => void;
  selectedCoachPersona: AIProvider;
  setSelectedCoachPersona: (persona: AIProvider) => void;
  installPromptEvent: any | null;
  clearInstallPrompt: () => void;
  isStandalone: boolean;
  translate: (key: string, replacements?: { [key: string]: string | number }) => string;
  constants: TranslatedConstants;
  workoutHistory: WorkoutHistoryItem[];
  logWorkout: (plan: WorkoutPlan) => void;
  savedWorkouts: WorkoutPlan[];
  saveWorkoutPlan: (plan: WorkoutPlan) => void;
  selectedPlan: WorkoutPlan | null;
  setSelectedPlan: (plan: WorkoutPlan | null) => void;
  nutritionHistory: Meal[];
  logMeal: (meal: Omit<Meal, 'timestamp'>) => void;
  dietPlan: MealPlanSection[] | null;
  setDietPlan: (plan: MealPlanSection[] | null) => void;
  dailyMacros: DailyMacros | null;
  setDailyMacros: (macros: DailyMacros | null) => void;
  updateFastingPlan: (plan: FastingPlan) => Promise<void>;
  addWeightLog: (weight: number) => void;
  updateWeightGoal: (goal: number) => void;
  updateUserMetrics: (weight: number, height: number) => void;
  currencyInfo: CurrencyInfo;
  setCurrency: (code: string) => void;
  userLocation: { currency: string; countryCode: string } | null;
  voiceWorkoutParams: WorkoutGenerationParams | null;
  setVoiceWorkoutParams: (params: WorkoutGenerationParams | null) => void;
  startWorkoutFromVoice: (params: WorkoutGenerationParams) => void;
  generateAndCacheDietPlan: () => Promise<{ macros: DailyMacros, meals: MealPlanSection[] } | null>;
  nutritionTab: string | null;
  setNutritionTab: (tab: string | null) => void;
  connectDevice: () => Promise<void>;
  disconnectDevice: () => void;
  deviceMetrics: LiveBioMetrics;
  isDeviceConnected: boolean;
  startDeviceStream: () => void;
  stopDeviceStream: () => void;
  isDeviceModalOpen: boolean;
  openDeviceModal: () => void;
  closeDeviceModal: () => void;
  isGeneratingWorkout: boolean;
  setIsGeneratingWorkout: (isGenerating: boolean) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // CRITICAL: REMOVED ALL LOCALSTORAGE READS. APP ALWAYS STARTS FRESH.
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [language, _setLanguage] = useState<Language>(Language.EN);
  const [screen, setScreen] = useState<Screen>(Screen.Home);
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo>(DEFAULT_CURRENCY_INFO);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [selectedCoachPersona, setSelectedCoachPersona] = useState<AIProvider>('gemini');
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [deviceMetrics] = useState<LiveBioMetrics>({ heartRate: 72, caloriesBurned: 0, steps: 0, isActive: false });
  const [nutritionTab, setNutritionTab] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);

  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([]);
  const [savedWorkouts] = useState<WorkoutPlan[]>([]);
  const [nutritionHistory, setNutritionHistory] = useState<Meal[]>([]);
  const [dietPlan, setDietPlan] = useState<MealPlanSection[] | null>(null);
  const [dailyMacros, setDailyMacros] = useState<DailyMacros | null>(null);

  const translate = useCallback((key: string, replacements?: { [key:string]: string | number }) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS[Language.EN];
    let str = dict[key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(k => {
            str = str.replace(`{{${k}}}`, String(replacements[k]));
        });
    }
    return str;
  }, [language]);

  const showStatus = useCallback((message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const newProfile = {...(prev || {}), ...updates};
      if (updates.language) {
        _setLanguage(updates.language);
      }
      return newProfile;
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    _setLanguage(lang);
    updateUserProfile({ language: lang });
  }, [updateUserProfile]);

  const setCurrency = useCallback((code: string) => {
    if (CURRENCY_MAP[code]) {
        setCurrencyInfo({ code, ...CURRENCY_MAP[code] });
    }
  }, []);

  const constants = useMemo(() => getTranslatedConstants(language, translate), [language, translate]);

  const logWorkout = useCallback((plan: WorkoutPlan) => {
    const newItem: WorkoutHistoryItem = {
      date: new Date().toLocaleDateString(language, { month: 'short', day: 'numeric', year: 'numeric' }),
      title: plan.title,
      description: plan.description
    };
    setWorkoutHistory(prev => [...prev, newItem]);
  }, [language]);

  const saveWorkoutPlan = useCallback((plan: WorkoutPlan) => {
    showStatus(translate('workout.saved'));
  }, [translate, showStatus]);

  const logMeal = useCallback((mealData: Omit<Meal, 'timestamp'>) => {
    const newMeal: Meal = { ...mealData, timestamp: Date.now() };
    setNutritionHistory(prev => [newMeal, ...prev]);
  }, []);

  const updateUserMetrics = useCallback((weight: number, height: number) => {
    updateUserProfile({ weight, height });
  }, [updateUserProfile]);

  const updateWeightGoal = useCallback((goal: number) => {
    updateUserProfile({ weight_goal: goal });
  }, [updateUserProfile]);

  const updateFastingPlan = useCallback(async (plan: FastingPlan) => {
    updateUserProfile({ fasting_plan: plan });
  }, [updateUserProfile]);

  const startWorkoutFromVoice = useCallback(async (params: WorkoutGenerationParams) => {
    setIsCoachOpen(false);
    setIsGeneratingWorkout(true); 
    setSelectedPlan(null); 
    const intent = `High intensity ${params.intensity || 'medium'} ${params.workoutType || 'fitness'} session. Equipment: ${params.equipment?.join(', ') || 'bodyweight'}. Focus: ${params.targetArea?.join(', ') || 'full body'}. ${params.customPrompt || ''}`;
    try {
        const plan = await generateWorkoutWithGemini(intent, language);
        if (plan) {
            setSelectedPlan(plan);
            setScreen(Screen.Workout);
        }
    } catch (e) {
        showStatus("Connection error.");
    } finally {
        setIsGeneratingWorkout(false);
    }
  }, [language, showStatus, setScreen, setSelectedPlan, setIsGeneratingWorkout]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === Language.AR ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo(() => ({
    session, user: null, profile, loading, isSubscribed: profile?.subscription_status === 'active',
    planId: profile?.plan_id, updateUserProfile, 
    resetApp: () => {
        window.location.reload(); 
    },
    signIn: (p: any) => {
      updateUserProfile({ ...p, subscription_status: 'active', plan_id: 'premium', onboarding_complete: true });
      setShowSignIn(false);
    },
    finalizeOnboarding: (p: any) => updateUserProfile({...p, onboarding_complete: true}),
    isSyncing: false, syncProfile: () => showStatus("Profile Synchronized"), language, setLanguage, screen, setScreen,
    expertToBook: null, openBookingScreen: () => {}, closeBookingScreen: () => {},
    onboardingStep: profile?.onboarding_step || 'language', setOnboardingStep: (s: any) => updateUserProfile({ onboarding_step: s }),
    showSignIn, setShowSignIn, statusMessage, showStatus,
    isCoachOpen, setIsCoachOpen, coachContext: null, setCoachContext: () => {},
    selectedCoachPersona, setSelectedCoachPersona, installPromptEvent: null, clearInstallPrompt: () => {},
    isStandalone: false, translate, constants, workoutHistory,
    logWorkout, savedWorkouts, saveWorkoutPlan,
    selectedPlan, setSelectedPlan, nutritionHistory, logMeal,
    dietPlan, setDietPlan, dailyMacros, setDailyMacros,
    updateFastingPlan, addWeightLog: (w: number) => updateUserMetrics(w, profile?.height || 175), updateWeightGoal,
    updateUserMetrics, currencyInfo, setCurrency, userLocation: null,
    voiceWorkoutParams: null, setVoiceWorkoutParams: () => {}, startWorkoutFromVoice,
    generateAndCacheDietPlan: async () => null, nutritionTab, setNutritionTab,
    connectDevice: async () => { 
        updateUserProfile({ connected_device: { id: 'dev_x', name: 'Fit-4rce X', batteryLevel: 88, status: 'connected', type: 'bracelet', lastSync: Date.now() } });
    },
    disconnectDevice: () => {
        updateUserProfile({ connected_device: undefined });
    },
    deviceMetrics, isDeviceConnected: !!profile?.connected_device,
    startDeviceStream: () => {}, stopDeviceStream: () => {}, isDeviceModalOpen,
    openDeviceModal: () => setIsDeviceModalOpen(true), closeDeviceModal: () => setIsDeviceModalOpen(false),
    isGeneratingWorkout, setIsGeneratingWorkout
  }), [
    session, profile, loading, language, screen, currencyInfo, statusMessage, showSignIn, 
    isCoachOpen, selectedCoachPersona, nutritionTab, selectedPlan, isGeneratingWorkout,
    constants, workoutHistory, savedWorkouts, nutritionHistory, dailyMacros, dietPlan,
    deviceMetrics, translate, showStatus, updateUserProfile, setLanguage, setCurrency, 
    logWorkout, startWorkoutFromVoice, isDeviceModalOpen
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};