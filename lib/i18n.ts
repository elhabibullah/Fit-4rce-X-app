
import { TranslatedConstants, Language, KungFuProgram, JujutsuProgram, NeoTaiChiProgram, KarateProgram, WrestlingProgram } from '../types.ts';
import { 
    TRAINER_STRUCTURE, 
    LANGUAGE_STRUCTURE, 
    TECHNIQUE_MODEL_URL 
} from '../constants.ts';

// --- TRANSLATION GENERATOR ---

export const getTranslatedConstants = (lang: Language, t: (key: string) => string): TranslatedConstants => {
  
  const KUNG_FU_DATA: KungFuProgram = {
    program_name: "Iron Buffalo Kung Fu", 
    description: t('discipline.kung_fu.intro'),
    levels: [
        {
            level_name: `Level 1: ${t('level.beginner')}`,
            description: t('selfDefense.description'),
            sections: [
                { 
                    section_name: "Stance & Rooting", 
                    movements: [
                        { id: "ib-l1-s1-m1", name: "Horse Stance (Ma Bu)", description: "The mother of all stances.", application: "Stability.", modelUrl: TECHNIQUE_MODEL_URL },
                    ] 
                }
            ]
        },
        {
            level_name: `Level 2: ${t('level.intermediate')}`,
            description: t('selfDefense.trainMode'),
            sections: [
                {
                    section_name: "Tiger Form",
                    movements: [
                        { id: "ib-l2-s1-m1", name: "Tiger Claw", description: "Finger conditioning.", application: "Gripping.", modelUrl: TECHNIQUE_MODEL_URL }
                    ]
                }
            ]
        },
        {
            level_name: `Level 3: ${t('level.advanced')}`,
            description: t('selfDefense.applicationNotes'),
            sections: [
                {
                    section_name: "Iron Shirt",
                    movements: [
                        { id: "ib-l3-s1-m1", name: "Dynamic Tension", description: "Isometrics.", application: "Protection.", modelUrl: TECHNIQUE_MODEL_URL }
                    ]
                }
            ]
        }
    ]
  };

  const NEO_TAI_CHI_DATA: NeoTaiChiProgram = {
    program_name: "Neo Tai Chi",
    description: t('discipline.tai_chi.intro'),
    levels: [
        {
            level: "Level 1",
            title: "Structure & Rooting",
            objective: "Learn to stand before you learn to move.",
            duration: "4 Weeks",
            techniques: [
                { id: "ntc-l1-t1", name: "Wuji Stance", description: "The void stance.", application: "Baseline.", modelUrl: TECHNIQUE_MODEL_URL }
            ]
        }
    ]
  };

  const KARATE_DATA: KarateProgram = {
    program_name: "Shotokan Karate",
    description: t('discipline.karate.intro'),
    levels: [
        {
            level_name: "White Belt",
            description: "Introduction to basic stances.",
            modules: [
                {
                    module_name: "Kihon (Basics)",
                    lessons: [
                        { id: "kar-l1-m1-l1", name: "Choku Zuki", description: "Straight Punch", application: "Solar plexus.", drills: [], bunkai_examples: [], modelUrl: TECHNIQUE_MODEL_URL }
                    ]
                }
            ]
        }
    ]
  };

  const JUJUTSU_DATA: JujutsuProgram = {
    program_name: "Imperial Jujutsu",
    description: t('discipline.jujutsu.intro'),
    modules: [
        {
            module_name: "Level 1",
            module_label: "The Foundation",
            techniques: [
                { id: "imp-m1-t1", name_ja_kanji: "受身", name_romaji: "Ukemi", name: "Breakfalls", description: "The art of falling safely.", application: "Preventing injury.", difficulty: 1, modelUrl: TECHNIQUE_MODEL_URL }
            ]
        }
    ]
  };

  const WRESTLING_DATA: WrestlingProgram = {
    program_name: "Combat Wrestling",
    description: t('discipline.wrestling.intro'),
    levels: [
        {
            level_name: "Level 1",
            description: "Stance & Motion",
            movements: [
                { id: "cw-l1-m1", name: "Stance", description: "Lead leg protection.", application: "Base.", modelUrl: TECHNIQUE_MODEL_URL }
            ]
        }
    ]
  };

  return {
    SUBSCRIPTION_PLANS: [
      {
        id: 'silver',
        name: t('sub.plan.silver.name'),
        monthlyPrice: 19.00,
        specialHighlight: t('sub.special.trainers'),
        features: [
          t('sub.feat.aiWorkout'),
          t('sub.feat.3dModels'),
          t('sub.feat.store')
        ]
      },
      {
        id: 'premium',
        name: t('sub.plan.gold.name'),
        monthlyPrice: 25.00,
        specialHighlight: t('sub.special.trainers'),
        features: [
          t('sub.feat.allSilver'),
          t('sub.feat.nutriAI'),
          t('sub.feat.holoCardio'),
          t('sub.feat.defense')
        ]
      }
    ],
    TRAINER_PROFILES: TRAINER_STRUCTURE.map(tData => ({
        ...tData,
        name: tData.id.charAt(0).toUpperCase() + tData.id.slice(1), 
        titles: ['Elite Personal Trainer'],
        languages: ['English', 'French'],
        bio: 'Dedicated to helping you reach your peak performance through personalized coaching and motivation.',
        specializations: ['Functional Training', 'Strength']
    })),
    KUNG_FU_PROGRAM: KUNG_FU_DATA,
    IMPERIAL_JUJUTSU_PROGRAM: JUJUTSU_DATA,
    NEO_TAI_CHI_PROGRAM: NEO_TAI_CHI_DATA,
    KARATE_PROGRAM: KARATE_DATA,
    WRESTLING_PROGRAM: WRESTLING_DATA,
    LANGUAGES: LANGUAGE_STRUCTURE.map(l => ({ ...l, name: t(`language.name.${l.code}`) }))
  };
};
