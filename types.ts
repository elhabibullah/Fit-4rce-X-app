export enum Language {
  EN = 'en',
  FR = 'fr',
  AR = 'ar',
  ES = 'es',
  JA = 'ja',
  PT = 'pt',
  ZH = 'zh',
  RU = 'ru',
}

export enum Screen {
    Home = 'home',
    Workout = 'workout',
    Nutrition = 'nutrition',
    Profile = 'profile',
    Trainers = 'trainers',
    SelfDefense = 'self-defense',
    Language = 'language',
    WorkoutHistory = 'workout-history',
    SavedWorkouts = 'saved-workouts',
    SubscriptionManagement = 'subscription-management',
    Spinning = 'spinning',
    Running = 'running',
}

export type OnboardingStep = 'language' | 'intro' | 'subscription' | 'profileSetup';

export interface SubscriptionPlan {
    id: 'silver' | 'premium';
    name: string;
    monthlyPrice: number;
    features: string[];
    specialHighlight?: string;
}

export interface DurationOption {
    months: number;
    discount: number;
    gift?: string;
}

export interface TrainerProfile {
    name: string;
    photoUrl: string;
    titles: string[];
    languages: string[];
    bio: string;
    specializations: string[];
    rating: number;
    reviews: number;
    sessionFeeEUR: number;
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'perplexity';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type WorkoutGoal = 'lose_weight' | 'build_muscle' | 'improve_endurance' | 'learn_self_defense';
export type Gender = 'male' | 'female';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface Exercise {
    name: string;
    description: string;
    muscleGroups: string[];
    modelUrl: string;
    videoUrl?: string; // Support for high-quality Veo loops
    difficulty: Difficulty;
}

export interface WorkoutPlan {
    title: string;
    description: string;
    exercises: Exercise[];
    warmup?: Exercise[];
    drills?: Exercise[];
    mainSets?: Exercise[];
    cooldown?: Exercise[];
    rest_duration_seconds?: number;
}

// FIXED: Added customPrompt to support AI-generated custom protocols via voice or text input
export interface WorkoutGenerationParams {
  workoutType?: string;
  equipment?: string[];
  targetArea?: string[];
  intensity?: string;
  customPrompt?: string;
}

export interface WorkoutHistoryItem {
  date: string;
  title: string;
  description: string;
}

export interface WeightHistoryItem {
    date: string;
    weight: number;
}

export interface LiveBioMetrics {
    heartRate: number;
    caloriesBurned: number;
    steps: number;
    isActive: boolean;
}

export interface ConnectedDevice {
    id: string;
    name: string;
    type: string;
    batteryLevel: number;
    status: string;
    lastSync: number;
}

export interface FastingPlan {
    type: '16:8' | '18:6' | '20:4';
    eatingWindowHours: number;
    fastingWindowHours: number;
}

export interface UserProfile {
  id?: string;
  full_name?: string;
  avatar_url?: string;
  age?: number;
  gender?: Gender;
  fitness_level?: Difficulty;
  goal?: WorkoutGoal[];
  workout_history?: WorkoutHistoryItem[];
  saved_workouts?: WorkoutPlan[];
  height?: number;
  weight?: number;
  weight_goal?: number;
  weight_history?: WeightHistoryItem[];
  onboarding_complete?: boolean;
  onboarding_step?: OnboardingStep;
  language?: Language;
  plan_id?: 'silver' | 'premium';
  subscription_status?: 'active' | 'inactive';
  connected_device?: ConnectedDevice;
  fasting_plan?: FastingPlan;
  coach_notes?: { date: string; trainerName: string; content: string }[];
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number;
}

export interface DailyMacros {
    calories: { goal: number; current: number };
    protein: { goal: number; current: number };
    fat: { goal: number; current: number };
    carbs: { goal: number; current: number };
}

export interface Meal {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    timestamp: number;
    /* Fixed: mealType should use the MealType type defined on line 61 */
    mealType: MealType;
}

export interface MealPlanSection {
    mealType: string;
    title: string;
    calories: number;
    description: string;
    recipe: string;
    benefits: string;
}

export interface AnyTechnique {
    id: string;
    name: string;
    description: string;
    application: string;
    modelUrl: string;
    name_ja_kanji?: string;
    name_romaji?: string;
    difficulty?: number;
    drills?: string[];
    bunkai_examples?: string[];
}

export interface KungFuProgram {
    program_name: string;
    description: string;
    levels: {
        level_name: string;
        description: string;
        sections: {
            section_name: string;
            movements: AnyTechnique[]
        }[]
    }[]
}

export interface NeoTaiChiProgram {
    program_name: string;
    description: string;
    levels: {
        level: string;
        title: string;
        objective: string;
        duration: string;
        techniques: AnyTechnique[]
    }[]
}

export interface TranslatedConstants {
    SUBSCRIPTION_PLANS: SubscriptionPlan[];
    TRAINER_PROFILES: TrainerProfile[];
    KUNG_FU_PROGRAM: KungFuProgram;
    NEO_TAI_CHI_PROGRAM: NeoTaiChiProgram;
    LANGUAGES: { code: Language; flag: string; name: string }[];
}

export interface F4XProduct {
    id: string;
    name: string;
    tagline: string;
    price: number;
    image_url: string;
    category: string;
    description: string;
    benefits: string[];
    nutrition_facts: { label: string; value: string }[];
}