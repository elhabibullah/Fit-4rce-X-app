/**
 * ExerciseDefinition: Unified Biomechanical Specification Layer
 * Independent from the rendering engine, this layer defines the physical
 * characteristics, starting postures, ground contact constraints, and motion
 * profiles for every exercise in the application.
 */

export type ExerciseCategory =
  | 'squat'
  | 'lunge'
  | 'pushup'
  | 'inverted_row'
  | 'plank'
  | 'jack'
  | 'boxing'
  | 'walk'
  | 'run'
  | 'martial_mabu'
  | 'martial_punch'
  | 'martial_palm'
  | 'martial_kick'
  | 'martial_taichi'
  | 'idle';

export type StartingPosture =
  | 'standing'
  | 'prone'        // Horizontal face-down (Push-up, Plank)
  | 'supine'       // Horizontal face-up / 45-deg back (Inverted Row, Glute Bridge)
  | 'crouch'       // Deep squat ready
  | 'horse_stance';// Wide grounded martial stance (Ma Bu)

export interface ContactConstraints {
  leftFootGround: boolean;
  rightFootGround: boolean;
  leftHandGround: boolean;
  rightHandGround: boolean;
  feetSpacing: number;     // lateral distance between feet in meters (e.g. 0.28m normal, 0.70m Ma Bu)
  handOrientation: 'free' | 'flat_floor' | 'fist_chin' | 'fist_ribs' | 'open_palm';
  preventFloorPenetration: boolean;
  minKneeFloorClearance: number; // minimum distance between knee and floor (e.g. 0.06m in lunges)
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: ExerciseCategory;
  clipId: string;
  startingPosture: StartingPosture;
  cycleDuration: number; // in seconds
  contacts: ContactConstraints;
  keywords: string[];
}

export const EXERCISE_DEFINITIONS: Record<string, ExerciseDefinition> = {
  // 1. SQUAT (Fitness, CrossFit, Strength, HIIT, Bodybuilding)
  squat: {
    id: 'squat',
    name: 'Squat',
    category: 'squat',
    clipId: 'squat',
    startingPosture: 'standing',
    cycleDuration: 2.8,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.32,
      handOrientation: 'free',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.25,
    },
    keywords: [
      'squat', 'squats', 'air squat', 'goblet squat', 'back squat', 'front squat',
      'flexion', 'cuisse', 'fessier', 'quad', 'glute', 'leg day', 'jump squat',
      'приседания', 'присед'
    ],
  },

  // 2. LUNGE (Fentes - Vraies fentes avec déplacement contrôlé et alternance)
  lunge: {
    id: 'lunge',
    name: 'Fentes (Lunges)',
    category: 'lunge',
    clipId: 'lunge',
    startingPosture: 'standing',
    cycleDuration: 3.6,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.24,
      handOrientation: 'free',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.06, // Rear knee hovers safely above floor
    },
    keywords: [
      'lunge', 'lunges', 'fente', 'fentes', 'split squat', 'walking lunge',
      'fente avant', 'fente arriere', 'zancada', 'afundo', 'выпады'
    ],
  },

  // 3. PUSH-UP (Pompes au sol complètes avec posture allongée ventrale)
  pushup: {
    id: 'pushup',
    name: 'Pompes (Push-ups)',
    category: 'pushup',
    clipId: 'pushup',
    startingPosture: 'prone',
    cycleDuration: 2.4,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: true,
      rightHandGround: true,
      feetSpacing: 0.24,
      handOrientation: 'flat_floor',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.08,
    },
    keywords: [
      'pushup', 'pushups', 'push-up', 'push-ups', 'pompe', 'pompes',
      'press-up', 'press up', 'appui tendu', 'développé couché', 'bench press',
      'chest press', 'pectoral', 'pectoraux', 'dips', 'отжимания'
    ],
  },

  // 4. INVERTED ROW / HORIZONTAL PULL (Tirage horizontal)
  inverted_row: {
    id: 'inverted_row',
    name: 'Tirage Horizontal (Inverted Row)',
    category: 'inverted_row',
    clipId: 'inverted_row',
    startingPosture: 'standing',
    cycleDuration: 2.8,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.26,
      handOrientation: 'free',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.20,
    },
    keywords: [
      'inverted row', 'inverted_row', 'australian pull up', 'australian pullup',
      'horizontal pull', 'rowing', 'row', 'tirage horizontal', 'tirage',
      'traction australienne', 'dos', 'dorsaux', 'traction', 'lat', 'тяга'
    ],
  },

  // 5. PLANK (Gainage isométrique ventral au sol)
  plank: {
    id: 'plank',
    name: 'Gainage (Plank)',
    category: 'plank',
    clipId: 'plank',
    startingPosture: 'prone',
    cycleDuration: 3.0,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: true,
      rightHandGround: true,
      feetSpacing: 0.24,
      handOrientation: 'flat_floor',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.08,
    },
    keywords: [
      'plank', 'gainage', 'planche', 'core', 'abdos', 'abdo', 'isométrie',
      'gainage ventral', 'planche ventrale', 'hollow body', 'планка'
    ],
  },

  // 6. JUMPING JACKS / CARDIO / CORDE
  jack: {
    id: 'jack',
    name: 'Jumping Jacks',
    category: 'jack',
    clipId: 'jump',
    startingPosture: 'standing',
    cycleDuration: 1.1,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.28,
      handOrientation: 'free',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.20,
    },
    keywords: [
      'jack', 'jacks', 'jumping jack', 'jumping jacks', 'saut', 'jump',
      'skipping', 'rope', 'corde', 'burpee', 'burpees', 'hiit', 'hop',
      'прыжки'
    ],
  },

  // 7. BOXING / SHADOW COMBAT
  boxing: {
    id: 'boxing',
    name: 'Shadow Boxing',
    category: 'boxing',
    clipId: 'box',
    startingPosture: 'standing',
    cycleDuration: 1.4,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.35,
      handOrientation: 'fist_chin',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.20,
    },
    keywords: [
      'boxing', 'boxe', 'shadow', 'jab', 'cross', 'crochet', 'uppercut',
      'frappe', 'direct', 'punching', 'combat', 'бокс'
    ],
  },

  // 8. WALK (Marche active)
  walk: {
    id: 'walk',
    name: 'Marche Active',
    category: 'walk',
    clipId: 'walk',
    startingPosture: 'standing',
    cycleDuration: 1.1,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.24,
      handOrientation: 'free',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.20,
    },
    keywords: [
      'walk', 'walking', 'marche', 'marcher', 'pas', 'deplacement', 'ходьба'
    ],
  },

  // 9. RUN (Course dynamique / Sprint)
  run: {
    id: 'run',
    name: 'Course Dynamique',
    category: 'run',
    clipId: 'run',
    startingPosture: 'standing',
    cycleDuration: 0.72,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.22,
      handOrientation: 'free',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.20,
    },
    keywords: [
      'run', 'running', 'course', 'courir', 'sprint', 'jog', 'jogging',
      'foulée', 'бег'
    ],
  },

  // 10. MARTIAL MA BU (Posture du Cavalier - Kung Fu / Sifu)
  martial_mabu: {
    id: 'martial_mabu',
    name: 'Posture du Cavalier (Ma Bu)',
    category: 'martial_mabu',
    clipId: 'martial_mabu',
    startingPosture: 'horse_stance',
    cycleDuration: 3.2,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.70, // Wide grounded base
      handOrientation: 'fist_ribs',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.35,
    },
    keywords: [
      'mabu', 'ma bu', 'cavalier', 'position du cheval', 'cheval',
      'horse stance', 'horse', 'enracinement', 'ancrage', 'stance',
      'wuji', 'posture originelle', 'стойка всадника'
    ],
  },

  // 11. MARTIAL PUNCH (Frappe de poing avant - Buffle de Fer)
  martial_punch: {
    id: 'martial_punch',
    name: 'Frappe de Poing (Kung Fu)',
    category: 'martial_punch',
    clipId: 'martial_punch',
    startingPosture: 'standing',
    cycleDuration: 1.4,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.38,
      handOrientation: 'fist_ribs',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.20,
    },
    keywords: [
      'frappe de poing', 'coup de poing', 'poing avant', 'poing explosif',
      'poings en chaîne', 'buffle de fer', 'fist', 'punch', 'strike',
      'tsuki', 'kung fu punch', 'удар кулаком'
    ],
  },

  // 12. MARTIAL PALM / DEFLECTION (Blocage / Redirection de paume)
  martial_palm: {
    id: 'martial_palm',
    name: 'Paumes Ondulatoires / Redirection',
    category: 'martial_palm',
    clipId: 'martial_palm',
    startingPosture: 'standing',
    cycleDuration: 2.2,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.34,
      handOrientation: 'open_palm',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.20,
    },
    keywords: [
      'paume', 'blocage de paume', 'redirection de paume', 'paume spiralée',
      'brosser le genou', 'mains nuages', 'yun shou', 'palm', 'deflect',
      'redirect', 'блок ладонью'
    ],
  },

  // 13. MARTIAL KICK (Coups de pied martiaux - Avant / Latéral)
  martial_kick: {
    id: 'martial_kick',
    name: 'Coups de Pied Martiaux',
    category: 'martial_kick',
    clipId: 'martial_kick',
    startingPosture: 'standing',
    cycleDuration: 2.2,
    contacts: {
      leftFootGround: true, // One foot stays rooted
      rightFootGround: false,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.30,
      handOrientation: 'fist_chin',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.20,
    },
    keywords: [
      'coup de pied', 'coups de pied', 'lateral', 'chasse', 'fouetté',
      'balayage', 'kick', 'kicks', 'advkicks', 'leg strike', 'удар ногой'
    ],
  },

  // 14. MARTIAL TAI CHI / FLOW (Neo Tai Chi)
  martial_taichi: {
    id: 'martial_taichi',
    name: 'Harmonie & Flux (Neo Tai Chi)',
    category: 'martial_taichi',
    clipId: 'martial_taichi',
    startingPosture: 'standing',
    cycleDuration: 4.5,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.36,
      handOrientation: 'open_palm',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.20,
    },
    keywords: [
      'tai chi', 'taichi', 'tai-chi', 'qi gong', 'qigong', 'flux',
      'qi shi', 'mouvement d’ouverture', 'saisir la queue', 'harmonie',
      'forme des cinq elements', 'wuji', 'flow', 'тай-чи'
    ],
  },

  // 15. IDLE / RECOVERY (Posture neutre stable)
  idle: {
    id: 'idle',
    name: 'Posture de Récupération (Repos)',
    category: 'idle',
    clipId: 'idle',
    startingPosture: 'standing',
    cycleDuration: 3.2,
    contacts: {
      leftFootGround: true,
      rightFootGround: true,
      leftHandGround: false,
      rightHandGround: false,
      feetSpacing: 0.26,
      handOrientation: 'free',
      preventFloorPenetration: true,
      minKneeFloorClearance: 0.30,
    },
    keywords: [
      'idle', 'repos', 'pause', 'recup', 'recuperation', 'stand', 'ready',
      'attente', 'покой'
    ],
  },
};

/**
 * Universal Exercise Resolver: Translates ANY multilingual user prompt,
 * exercise name, or technique identifier into its unified ExerciseDefinition.
 */
export function resolveExerciseDefinition(query?: string | null): ExerciseDefinition {
  if (!query || typeof query !== 'string') {
    return EXERCISE_DEFINITIONS.idle;
  }

  const clean = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Direct ID match
  if (EXERCISE_DEFINITIONS[clean]) {
    return EXERCISE_DEFINITIONS[clean];
  }

  // 2. High priority keyword scan
  for (const def of Object.values(EXERCISE_DEFINITIONS)) {
    if (def.id === 'idle') continue;
    for (const kw of def.keywords) {
      const cleanKw = kw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (clean.includes(cleanKw)) {
        return def;
      }
    }
  }

  return EXERCISE_DEFINITIONS.idle;
}
