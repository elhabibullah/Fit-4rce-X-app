import { DurationOption, Language } from '../types.ts';

export const COACH_MODEL_URL = "/models/Magneta_Cyborg_F4X_rigged.glb";
export const SPINNING_COACH_MODEL_URL = "https://raw.githubusercontent.com/elhabibullah/3D-model-1/main/Spinning_coach_compressed.glb?v=12350"; 
export const TECHNIQUE_MODEL_URL = "/models/Magneta_Cyborg_F4X_rigged.glb";

export const MODEL_LIBRARY: Record<string, string> = {
    'default': COACH_MODEL_URL,
    'bodyweight': COACH_MODEL_URL,
    'spinning': SPINNING_COACH_MODEL_URL,
};

export const VIDEO_LIBRARY: Record<string, string> = {
    'squat': 'https://videos.pexels.com/video-files/4365116/4365116-hd_1080_1920_25fps.mp4',
    'deadlift': 'https://videos.pexels.com/video-files/4754025/4754025-hd_1080_1920_25fps.mp4',
    'bench press': 'https://videos.pexels.com/video-files/4753989/4753989-hd_1080_1920_25fps.mp4',
    'push up': 'https://videos.pexels.com/video-files/4365137/4365137-hd_1080_1920_25fps.mp4',
    'pull up': 'https://videos.pexels.com/video-files/4753930/4753930-hd_1080_1920_25fps.mp4',
    'lunge': 'https://videos.pexels.com/video-files/4365022/4365022-hd_1080_1920_25fps.mp4',
    'plank': 'https://videos.pexels.com/video-files/4365123/4365123-hd_1080_1920_25fps.mp4'
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
    photoUrl: 'https://ai-webbuilder-prod.s3.us-east-1.amazonaws.com/public/images/b41ca67767304c519a58cec7ad351092/788ced7328b0464cb7a81e01e3e45f68.Screenshot_20251114-091219_Chrome.jpg',
    rating: 4.9,
    reviews: 182,
    sessionFeeEUR: 120,
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