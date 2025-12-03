
import { DurationOption, Language } from './types.ts';

// This file now primarily contains non-translatable data structures.
// The translatable content (plans, trainers, etc.) is now generated in `lib/i18n.ts`.

// AWS S3 Link - High Performance 3D Streaming
// CLEAN URL - No query parameters
export const COACH_MODEL_URL = "https://raw.githubusercontent.com/elhabibullah/3D-model-1/main/Android%20model%20coach%20ft4x_compressed.glb";
export const SPINNING_COACH_MODEL_URL = "https://raw.githubusercontent.com/elhabibullah/3D-model-1/main/Spinning_coach_compressed.glb"; 
export const TECHNIQUE_MODEL_URL = "https://raw.githubusercontent.com/elhabibullah/3D-model-1/main/Android%20model%20coach%20ft4x_compressed.glb";

export const DURATION_OPTIONS: DurationOption[] = [
  { months: 1, discount: 0 },
  { months: 3, discount: 5 },
  { months: 6, discount: 10, gift: 'free_bracelet' },
  { months: 12, discount: 15, gift: 'free_bracelet' },
];

// Base structure for trainers with high-quality, non-placeholder images.
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

// Base structure for languages, name will be translated
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
