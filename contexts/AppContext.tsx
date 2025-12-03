
import React, { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { DailyMacros, FastingPlan, Language, Meal, MealPlanSection, Screen, TrainerProfile, TranslatedConstants, UserProfile, WeightHistoryItem, WorkoutPlan, WorkoutHistoryItem, OnboardingStep, CurrencyInfo, AIProvider, WorkoutGenerationParams, ConnectedDevice, LiveBioMetrics } from '../types.ts';
import { getTranslatedConstants } from '../lib/i18n.ts';
import { TRANSLATIONS as translations } from '../lib/translations.ts';
import { generateDietPlan } from '../services/aiService.ts';
import { getUserLocationInfo } from '../services/locationService.ts';
import { CURRENCY_MAP, DEFAULT_CURRENCY_INFO } from '../lib/currency.ts';

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
  logMeal: (meal: Omit<Meal, 'timestamp' | 'mealType'>) => void;
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
  
  // Navigation Deep Links
  nutritionTab: string | null;
  setNutritionTab: (tab: string | null) => void;

  // Device Stuff
  connectDevice: () => Promise<void>;
  disconnectDevice: () => void;
  deviceMetrics: LiveBioMetrics;
  isDeviceConnected: boolean;
  startDeviceStream: () => void;
  stopDeviceStream: () => void;
  isDeviceModalOpen: boolean;
  openDeviceModal: () => void;
  closeDeviceModal: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const [language, _setLanguage] = useState<Language>(Language.EN);
  const [screen, setScreen] = useState<Screen>(Screen.Home);
  const [showSignIn, setShowSignIn] = useState(false);
  const [expertToBook, setExpertToBook] = useState<TrainerProfile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [nutritionHistory, setNutritionHistory] = useState<Meal[]>([]);
  const [dietPlan, setDietPlan] = useState<MealPlanSection[] | null>(null);
  const [dailyMacros, setDailyMacros] = useState<DailyMacros | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<any | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [coachContext, setCoachContext] = useState<string | null>(null);
  const [selectedCoachPersona, setSelectedCoachPersona] = useState<AIProvider>('gemini');
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo>(DEFAULT_CURRENCY_INFO);
  const [userLocation, setUserLocation] = useState<{ currency: string; countryCode: string } | null>(null);
  const [voiceWorkoutParams, setVoiceWorkoutParams] = useState<WorkoutGenerationParams | null>(null);
  const [nutritionTab, setNutritionTab] = useState<string | null>(null);

  // Device State
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [deviceMetrics, setDeviceMetrics] = useState<LiveBioMetrics>({ heartRate: 0, caloriesBurned: 0, steps: 0, isActive: false });
  const metricsInterval = useRef<number | null>(null);
  
  // Helper to update profile
  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    let finalizedProfileForEffect: UserProfile | null = null;
    setProfile(prev => {
      const newProfile: UserProfile = {...(prev || {}), ...updates};
      if (updates.weight || updates.height) {
        const weight = updates.weight || newProfile.weight;
        if (weight) {
          const newLog: WeightHistoryItem = { date: new Date().toISOString(), weight };
          const newHistory = [...(newProfile.weight_history || []).slice(-29), newLog];
          newProfile.weight_history = newHistory;
        }
      }
      if (updates.language) {
        _setLanguage(currentLang => {
          if (currentLang !== newProfile.language) return newProfile.language!;
          return currentLang;
        });
      }
      finalizedProfileForEffect = newProfile;
      return newProfile;
    });

    if (updates.onboarding_complete && !session) {
        setTimeout(() => {
          if (finalizedProfileForEffect) {
              finalizeOnboarding(finalizedProfileForEffect);
          }
        }, 0);
    }
  }, [session]);

  // Helper function to show status toast
  const showStatus = useCallback((message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  const connectDevice = useCallback(async () => {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      const newDevice: ConnectedDevice = {
          id: 'device_001',
          name: 'Fit-4rce Bracelet X',
          type: 'bracelet',
          batteryLevel: 88,
          status: 'connected',
          lastSync: Date.now()
      };
      updateUserProfile({ connected_device: newDevice });
      showStatus('Device Paired Successfully');
  }, [updateUserProfile, showStatus]);

  const disconnectDevice = useCallback(() => {
      if (profile?.connected_device) {
          updateUserProfile({ connected_device: undefined });
          stopDeviceStream();
      }
  }, [profile, updateUserProfile]);

  const startDeviceStream = useCallback(() => {
      if (!profile?.connected_device) return;
      setDeviceMetrics(prev => ({ ...prev, isActive: true, heartRate: 75 })); // Initial resting HR
      
      if (metricsInterval.current) clearInterval(metricsInterval.current);
      
      metricsInterval.current = window.setInterval(() => {
          setDeviceMetrics(prev => {
              // Simulate realistic fluctuation
              const newHr = Math.min(185, Math.max(60, prev.heartRate + (Math.random() * 10 - 4))); 
              const burned = prev.caloriesBurned + (newHr > 100 ? 0.15 : 0.02); // Burn more if HR is high
              return {
                  ...prev,
                  heartRate: Math.floor(newHr),
                  caloriesBurned: parseFloat(burned.toFixed(2)),
                  isActive: true
              };
          });
      }, 1000);
  }, [profile]);

  const stopDeviceStream = useCallback(() => {
       if (metricsInterval.current) clearInterval(metricsInterval.current);
       setDeviceMetrics(prev => ({ ...prev, isActive: false }));
  }, []);

  const openDeviceModal = useCallback(() => setIsDeviceModalOpen(true), []);
  const closeDeviceModal = useCallback(() => setIsDeviceModalOpen(false), []);

  const onboardingStep = profile?.onboarding_step || 'language';
  const planId = profile?.plan_id;
  const isDeviceConnected = !!profile?.connected_device;

  const translate = useCallback((key: string, replacements?: { [key:string]: string | number }) => {
    let str = translations[language]?.[key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(rKey => {
            str = str.replace(new RegExp(`{{${rKey}}}`, 'g'), String(replacements[rKey]));
        });
    }
    return str;
  }, [language]);
  
  const createMockSession = (profileForSession: UserProfile) => {
    const mockUser: User = {
        id: profileForSession.id!,
        email: 'user@example.com',
        app_metadata: {}, user_metadata: { full_name: profileForSession.full_name! },
        aud: 'authenticated', created_at: new Date().toISOString(),
    };
    const mockSession: Session = {
        access_token: 'mock-token', token_type: 'bearer', user: mockUser,
        expires_in: 3600 * 24 * 365, expires_at: Date.now() + 3600 * 1000 * 24 * 365,
        refresh_token: 'mock-refresh-token',
    };
    setSession(mockSession);
    setUser(mockUser);
    setProfile(profileForSession);
    _setLanguage(profileForSession.language!);
  };

  const signIn = useCallback((profileToSignIn: Partial<UserProfile & { email?: string }>) => {
      const defaultUser: Partial<UserProfile> = {
        id: 'mock-user-' + Date.now(),
        full_name: 'Valued Member',
        age: 30, gender: 'male', fitness_level: 'intermediate',
        goal: ['build_muscle'], height: 175, weight: 75,
        workout_history: [], saved_workouts: [], weight_history: [],
      };
      
      const isOwner = profileToSignIn.email === 'elhabibullah@gmail.com';

      const finalProfile: UserProfile = { 
          ...defaultUser, 
          ...profileToSignIn,
          subscription_status: 'active',
          plan_id: isOwner ? 'premium' : (profileToSignIn.plan_id || 'silver'),
          onboarding_complete: true,
      };

      if (isOwner) {
        finalProfile.full_name = 'El Habibullah';
        finalProfile.avatar_url = 'https://ai-webbuilder-prod.s3.us-east-1.amazonaws.com/public/images/ad85aead516242b9b73a5140f6db62a1/cc8f37e7e15f4533853e60c5f1ec1a24.Generated%20Image%20October%2018%2C%202025%20-%201_09PM%20%281%29.png';
      }

      if (!finalProfile.language) finalProfile.language = Language.EN;

      createMockSession(finalProfile);
  }, []);
  
  const finalizeOnboarding = useCallback((finalizedProfile: UserProfile) => {
    createMockSession(finalizedProfile);
  }, []);

  const generateAndCacheDietPlan = useCallback(async () => {
    if (!profile || !language || planId !== 'premium') return null;
    try {
        const plan = await generateDietPlan(profile, language);
        if (plan) {
            const planWithCurrent = {
                macros: {
                    calories: { ...plan.macros.calories, current: 0 },
                    protein: { ...plan.macros.protein, current: 0 },
                    fat: { ...plan.macros.fat, current: 0 },
                    carbs: { ...plan.macros.carbs, current: 0 },
                },
                meals: plan.meals,
            };
            setDietPlan(planWithCurrent.meals);
            setDailyMacros(planWithCurrent.macros);
            localStorage.setItem('fit4rce-diet-plan', JSON.stringify({ plan: planWithCurrent, timestamp: Date.now() }));
            return planWithCurrent;
        }
    } catch (e) { console.error("Failed to generate and cache diet plan:", e); }
    return null;
  }, [profile, language, planId]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => { e.preventDefault(); setInstallPromptEvent(e); };
    if (window.matchMedia('(display-mode: standalone)').matches) setIsStandalone(true);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const fetchCurrency = async () => {
        const savedCurrency = localStorage.getItem('fit4rce-currency');
        if (savedCurrency && CURRENCY_MAP[savedCurrency]) {
            setCurrencyInfo({ code: savedCurrency, ...CURRENCY_MAP[savedCurrency] });
            setUserLocation({ currency: savedCurrency, countryCode: '--' });
        } else {
            const locationInfo = await getUserLocationInfo();
            setUserLocation(locationInfo);
            if (locationInfo.currency && CURRENCY_MAP[locationInfo.currency]) {
                const code = locationInfo.currency;
                setCurrencyInfo({ code, ...CURRENCY_MAP[code] });
                localStorage.setItem('fit4rce-currency', code);
            }
        }
    };
    
    const loadCachedDietPlan = () => {
        const cached = localStorage.getItem('fit4rce-diet-plan');
        if (cached) {
            try {
                const { plan, timestamp } = JSON.parse(cached);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (timestamp >= today.getTime()) {
                    setDietPlan(plan.meals);
                    setDailyMacros(plan.macros);
                }
            } catch (e) {
                console.error("Failed to parse cached diet plan:", e);
                localStorage.removeItem('fit4rce-diet-plan');
            }
        }
    };

    fetchCurrency();
    loadCachedDietPlan();
    setLoading(false);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        if(metricsInterval.current) clearInterval(metricsInterval.current);
    }
  }, []);
  
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === Language.AR ? 'rtl' : 'ltr';
  }, [language]);

  const setOnboardingStep = useCallback((step: OnboardingStep) => {
    updateUserProfile({ onboarding_step: step });
  }, [updateUserProfile]);

  const resetApp = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setScreen(Screen.Home);
    setDeviceMetrics({ heartRate: 0, caloriesBurned: 0, steps: 0, isActive: false });
    if (metricsInterval.current) clearInterval(metricsInterval.current);
    localStorage.removeItem('fit4rce-diet-plan');
    localStorage.removeItem('fit4rce-currency');
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    updateUserProfile({ language: lang });
  }, [updateUserProfile]);

  const openBookingScreen = (trainer: TrainerProfile) => setExpertToBook(trainer);
  const closeBookingScreen = () => setExpertToBook(null);
  
  const clearInstallPrompt = () => setInstallPromptEvent(null);

  const logWorkout = (plan: WorkoutPlan) => {
    const newHistoryItem: WorkoutHistoryItem = {
        date: new Date().toLocaleDateString(language),
        title: plan.title,
        description: plan.description,
    };
    updateUserProfile({ workout_history: [...(profile?.workout_history || []), newHistoryItem] });
    showStatus('Workout logged!');
  };
  
  const saveWorkoutPlan = (plan: WorkoutPlan) => {
    if (profile?.saved_workouts?.some(p => p.title === plan.title)) {
        showStatus('This workout plan is already saved.');
        return;
    }
    updateUserProfile({ saved_workouts: [...(profile?.saved_workouts || []), plan] });
    showStatus('Workout plan saved successfully!');
  };

  const logMeal = (meal: Omit<Meal, 'timestamp'>) => {
    const mealWithTimestamp: Meal = { ...meal, timestamp: Date.now(), mealType: 'snacks' };
    setNutritionHistory(prev => [...prev, mealWithTimestamp]);
    setDailyMacros(prev => {
        if (!prev) return null;
        return {
            calories: { ...prev.calories, current: prev.calories.current + meal.calories },
            protein: { ...prev.protein, current: prev.protein.current + meal.protein },
            carbs: { ...prev.carbs, current: prev.carbs.current + meal.carbs },
            fat: { ...prev.fat, current: prev.fat.current + meal.fat },
        };
    });
  };

  const addWeightLog = (weight: number) => {
    updateUserProfile({ weight });
  };
  const updateUserMetrics = (weight: number, height: number) => {
    updateUserProfile({ weight, height });
  };
  const updateWeightGoal = (goal: number) => {
    updateUserProfile({ weight_goal: goal });
  };
  const updateFastingPlan = async (plan: FastingPlan) => {
    updateUserProfile({ fasting_plan: plan });
  };
  const syncProfile = () => {
    setIsSyncing(true);
    setTimeout(() => {
        setIsSyncing(false);
        showStatus('Profile synced!');
    }, 1500);
  };
  
  const setCurrency = (code: string) => {
    if (CURRENCY_MAP[code]) {
        setCurrencyInfo({ code, ...CURRENCY_MAP[code] });
        localStorage.setItem('fit4rce-currency', code);
    }
  };
  
  const startWorkoutFromVoice = useCallback((params: WorkoutGenerationParams) => {
    setTimeout(() => {
        setVoiceWorkoutParams(params);
        setScreen(Screen.Workout);
    }, 0);
  }, []);

  const constants = useMemo(() => {
    const stableLanguage = profile?.language || language;
    const stableTranslate = (key: string, replacements?: { [key: string]: string | number }) => {
        let str = translations[stableLanguage]?.[key] || key;
        if (replacements) {
            Object.keys(replacements).forEach(rKey => {
                str = str.replace(new RegExp(`{{${rKey}}}`, 'g'), String(replacements[rKey]));
            });
        }
        return str;
    };
    return getTranslatedConstants(stableLanguage, stableTranslate);
  }, [profile?.language, language]);

  const workoutHistory = profile?.workout_history || [];
  const savedWorkouts = profile?.saved_workouts || [];

  const isSubscribed = profile?.subscription_status === 'active';

  const value = {
    session, user, profile, loading, isSubscribed, planId, updateUserProfile, resetApp, signIn,
    finalizeOnboarding, isSyncing, syncProfile, language, setLanguage, screen, setScreen,
    expertToBook, openBookingScreen, closeBookingScreen, onboardingStep, setOnboardingStep,
    showSignIn, setShowSignIn, statusMessage, showStatus, isCoachOpen, setIsCoachOpen, coachContext,
    setCoachContext, selectedCoachPersona, setSelectedCoachPersona, installPromptEvent,
    clearInstallPrompt, isStandalone, translate, constants, workoutHistory, logWorkout,
    savedWorkouts, saveWorkoutPlan, selectedPlan, setSelectedPlan, nutritionHistory,
    logMeal, dietPlan, setDietPlan, dailyMacros, setDailyMacros, updateFastingPlan,
    addWeightLog, updateWeightGoal, updateUserMetrics, currencyInfo, setCurrency, userLocation,
    voiceWorkoutParams, setVoiceWorkoutParams, startWorkoutFromVoice, generateAndCacheDietPlan,
    nutritionTab, setNutritionTab,
    // Device
    connectDevice, disconnectDevice, deviceMetrics, isDeviceConnected, startDeviceStream, stopDeviceStream,
    isDeviceModalOpen, openDeviceModal, closeDeviceModal
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
