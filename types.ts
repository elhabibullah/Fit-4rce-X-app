
import { ThreeElements } from '@react-three/fiber';

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
    specialHighlight?: string; // New field for gold text
}

export interface DurationOption {
    months: number;
    discount: number;
    gift?: string; // New field for the free bracelet
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
export type TechniqueCategory = 'kung_fu' | 'jujutsu' | 'karate' | 'tai_chi';

export interface Exercise {
    name: string;
    description: string;
    muscleGroups: string[];
    modelUrl: string;
    difficulty: Difficulty;
}

export interface WorkoutPlan {
    title: string;
    description: string;
    warmup?: Exercise[];
    exercises: Exercise[];
    cooldown?: Exercise[];
    rest_duration_seconds?: number;
}

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

// --- MARTIAL ARTS TYPES UPDATED FOR RICH DATA ---

export interface KungFuMovement {
  id: string;
  name: string;
  description: string;
  application: string;
  modelUrl: string;
  // New Fields
  common_mistakes?: string[];
  corrections?: string[];
  drills?: string[];
  training_speeds?: string;
}

export interface KungFuSection {
  section_name: string;
  movements: KungFuMovement[];
}

export interface KungFuLevel {
  level_name: string;
  description?: string;
  sections: KungFuSection[];
}

export interface KungFuProgram {
  program_name: string;
  description?: string; // Added for Style Introduction
  levels: KungFuLevel[];
}

export interface JujutsuTechnique {
  id: string; 
  name_ja_kanji: string;
  name_romaji: string;
  name: string; 
  description: string;
  application: string;
  modelUrl: string;
  difficulty: number; 
  common_mistakes?: string[];
  corrections?: string[];
  drills?: string[];
}

export interface JujutsuModule {
  module_name: string;
  module_label: string;
  techniques: JujutsuTechnique[];
}

export interface JujutsuProgram {
  program_name: string;
  description?: string; // Added for Style Introduction
  modules: JujutsuModule[];
}

export interface TaiChiTechnique {
  id: string;
  name: string;
  description: string;
  application: string;
  modelUrl: string;
  common_mistakes?: string[];
  corrections?: string[];
}

export interface TaiChiLevel {
  level: string;
  title: string;
  objective: string;
  duration?: string; // New field
  level_applications?: string[]; // New field
  techniques: TaiChiTechnique[];
}

export interface NeoTaiChiProgram {
  program_name: string;
  description?: string; // New field
  levels: TaiChiLevel[];
}

export interface KarateLesson {
  id: string;
  name: string; 
  description: string;
  application: string;
  drills: string[];
  bunkai_examples: string[];
  modelUrl: string;
  common_mistakes?: string[];
  corrections?: string[];
}

export interface KarateModule {
  module_name: string;
  lessons: KarateLesson[];
}

export interface KarateLevel {
  level_name: string;
  description: string;
  modules: KarateModule[];
}

export interface KarateProgram {
  program_name: string;
  description?: string; // Added description field
  levels: KarateLevel[];
}

export interface WrestlingMovement {
  id: string;
  name: string;
  description: string;
  application: string;
  modelUrl: string;
  common_mistakes?: string[];
  corrections?: string[];
  drills?: string[];
  training_speeds?: string;
}

export interface WrestlingLevel {
  level_name: string;
  description: string;
  movements: WrestlingMovement[];
}

export interface WrestlingProgram {
  program_name: string;
  description?: string; // Added description field
  levels: WrestlingLevel[];
}

export type AnyTechnique = KungFuMovement | JujutsuTechnique | TaiChiTechnique | KarateLesson | WrestlingMovement;

export interface TranslatedConstants {
  SUBSCRIPTION_PLANS: SubscriptionPlan[];
  TRAINER_PROFILES: TrainerProfile[];
  KUNG_FU_PROGRAM: KungFuProgram;
  IMPERIAL_JUJUTSU_PROGRAM: JujutsuProgram;
  NEO_TAI_CHI_PROGRAM: NeoTaiChiProgram;
  KARATE_PROGRAM: KarateProgram;
  WRESTLING_PROGRAM: WrestlingProgram;
  LANGUAGES: { code: Language; name: string, flag: string }[];
}


export interface Meal {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    timestamp: number;
    mealType: MealType;
}

export interface MealPlanSection {
    mealType: MealType;
    title: string;
    calories: number;
    description: string;
    recipe: string;
    benefits: string;
    // New property for tracking if the meal was "detected" by the bracelet/app logic
    consumed?: boolean;
}

export interface DailyMacros {
    calories: { goal: number, current: number };
    protein: { goal: number, current: number };
    fat: { goal: number, current: number };
    carbs: { goal: number, current: number };
}

export interface WeightHistoryItem {
  date: string; // ISO string
  weight: number; // kg
}

export interface FastingPlan {
  type: '16:8' | '18:6' | '20:4' | 'custom';
  eatingWindowHours: number;
  fastingWindowHours: number;
}

// Device / Bracelet Types
export interface ConnectedDevice {
    id: string;
    name: string;
    type: 'bracelet' | 'watch' | 'tracker';
    batteryLevel: number;
    status: 'connected' | 'disconnected' | 'scanning';
    lastSync: number;
}

export interface LiveBioMetrics {
    heartRate: number;
    caloriesBurned: number;
    steps: number;
    isActive: boolean;
}

export interface CoachNote {
    date: string;
    trainerName: string;
    content: string;
}

// --- F4X NUTRITION STORE TYPES ---
export interface F4XProduct {
    id: string;
    name: string;
    tagline: string;
    price: number;
    image_url: string; // Placeholder for now
    category: 'protein' | 'energy' | 'recovery' | 'wellness';
    description: string;
    benefits: string[];
    nutrition_facts: { label: string; value: string }[];
}

// Aligned with the database schema and app needs.
// Fields are optional to handle new users who haven't completed the profile setup yet.
export interface UserProfile {
  id?: string;
  updated_at?: string;
  subscription_status?: 'inactive' | 'active';
  plan_id?: 'silver' | 'premium';
  full_name?: string;
  avatar_url?: string;
  age?: number;
  gender?: Gender;
  fitness_level?: Difficulty;
  goal?: WorkoutGoal[];
  workout_history?: WorkoutHistoryItem[];
  saved_workouts?: WorkoutPlan[];
  height?: number; // cm
  weight?: number; // kg
  weight_history?: WeightHistoryItem[];
  fasting_plan?: FastingPlan;
  weight_goal?: number; // kg
  onboarding_complete?: boolean;
  onboarding_step?: OnboardingStep;
  language?: Language;
  
  connected_device?: ConnectedDevice;
  coach_notes?: CoachNote[];
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number;
}
