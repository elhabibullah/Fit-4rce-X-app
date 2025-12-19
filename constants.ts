
import { DurationOption, Language } from './types.ts';

// AWS S3 Link - High Performance 3D Streaming
export const COACH_MODEL_URL = "https://fit-4rce-x.s3.eu-north-1.amazonaws.com/Android_coach.glb";
export const SPINNING_COACH_MODEL_URL = "https://raw.githubusercontent.com/elhabibullah/3D-model-1/main/Spinning_coach_compressed.glb?v=12350"; 
export const TECHNIQUE_MODEL_URL = "https://fit-4rce-x.s3.eu-north-1.amazonaws.com/Android_coach.glb";

/**
 * EXERCISE MODEL LIBRARY
 * When you upload your DeepMotion animated files to S3, 
 * put the new URLs here. The app will automatically 
 * cache them for OFFLINE use.
 */
export const MODEL_LIBRARY: Record<string, string> = {
    'default': COACH_MODEL_URL,
    'pushups': 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/pushups.glb', // Placeholder: Update when ready
    'squats': 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/squats.glb',   // Placeholder: Update when ready
    'spinning': SPINNING_COACH_MODEL_URL,
};

export const DURATION_OPTIONS: DurationOption[] = [
  { months: 1, discount: 0 },
  { months: 3, discount: 5 },
  { months: 6, discount: 10, gift: 'free_bracelet' },
  { months: 12, discount: 15, gift: 'free_bracelet' },
];

export const TRAINER_STRUCTURE = [
  {
    id: 'abdel',
    photoUrl: 'https://ai-webbuilder-prod.s3.us-east-1.amazonaws.com/public/images/b41ca67767304c519a58cec7ad351092/788ced7328b0464cb7a81e01e3e45f68.Screenshot_20250429-140125_Samsung%20Notes.jpg',
    rating: 4.9,
    reviews: 182,
    sessionFeeEUR: 120,
  },
  {
    id: 'jasmine',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&h=256&fit=crop',
    rating: 4.8,
    reviews: 251,
    sessionFeeEUR: 50,
  },
  {
    id: 'kenji',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&fit=crop',
    rating: 5.0,
    reviews: 139,
    sessionFeeEUR: 50,
  },
];

export const LANGUAGE_STRUCTURE: { code: Language; flag: string }[] = [
    { code: Language.EN, flag: '🇬🇧' },
    { code: Language.FR, flag: '🇫🇷' },
    { code: Language.AR, flag: '🇸🇦' },
    { code: Language.ES, flag: '🇪🇸' },
    { code: Language.JA, flag: '🇯🇵' },
    { code: Language.PT, flag: '🇵🇹' },
    { code: Language.ZH, flag: '🇨🇳' },
    { code: Language.RU, flag: '🇷🇺' },
];
