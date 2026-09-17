import * as THREE from 'three';
import { HumanoidMotionClip, MotionKeyframe } from './humanoidMotionClip.ts';
import { HumanoidBoneName } from './humanoidBones.ts';
import { LOCAL_RAW_EXERCISES } from './localExercisesData.ts';

export interface RawJsonExercise {
  id: string;
  name: string;
  equipment?: string;
  difficulty?: string;
  prop?: any;
  primary?: string[];
  secondary?: string[];
  steps?: string[];
  fps?: number;
  duration?: number;
  keyframes?: Array<{
    t: number;
    bones: Record<string, {
      rot?: [number, number, number];
      loc?: [number, number, number];
      aim_world?: [number, number, number];
    }>;
  }>;
  mocap?: string;
  camera?: string;
  status?: string;
}

const EXERCICES_JSON_URL = 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/exercices-json';

// In-memory cache for parsed clips and exercise items initialized with local data
let cachedRawExercises: RawJsonExercise[] = LOCAL_RAW_EXERCISES;
const cachedJsonClips: Map<string, HumanoidMotionClip> = new Map();
let fetchPromise: Promise<RawJsonExercise[]> | null = null;

/**
 * Degrees to radians helper
 */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Converts a directional vector (aim_world) in character coordinates to anatomical pitch/yaw/roll.
 *
 * Coordinate system convention of aim_world in character space:
 * - aim[0] = lateral X (positive is left, negative is right)
 * - aim[1] = sagittal Y: in Blender character space, -Y is forward flexion, +Y is extension
 * - aim[2] = vertical Z: -1 is straight down, 0 is horizontal, +1 is straight up
 *
 * For character anatomical pitch/yaw/roll:
 * - pitch: forward flexion angle (positive)
 * - roll: abduction angle laterally away from midline (positive)
 */
function solveAimWorldToPitchYawRoll(
  aim: [number, number, number],
  isRightSide: boolean
): { pitch: number; yaw: number; roll: number } {
  const ax = aim[0] || 0;
  const ay = aim[1] || 0;
  const az = aim[2] || 0;

  // Forward flexion in sagittal plane relative to hanging arm (-Z):
  // When arm reaches forward (ay < 0), forwardFlex is positive
  const forwardFlex = -ay;
  const downward = -az;
  const pitch = Math.atan2(forwardFlex, Math.max(-0.99, downward));

  // Roll: lateral abduction away from body
  const lateral = isRightSide ? -ax : ax;
  const roll = Math.atan2(lateral, Math.max(0.01, Math.sqrt(forwardFlex * forwardFlex + downward * downward)));

  return {
    pitch: THREE.MathUtils.clamp(pitch, -degToRad(30), degToRad(175)),
    yaw: 0,
    roll: THREE.MathUtils.clamp(roll, -degToRad(20), degToRad(120)),
  };
}

/**
 * Map bone keys from Blender JSON export to HumanoidStandard names and anatomical angles.
 */
function convertBlenderKeyframesToMotion(raw: RawJsonExercise): HumanoidMotionClip | null {
  if (!raw.keyframes || raw.keyframes.length === 0) {
    return null;
  }

  const duration = raw.duration && raw.duration > 0 ? raw.duration : 2.5;

  const motionKeyframes: MotionKeyframe[] = raw.keyframes.map((kf) => {
    const bonesRot: Partial<Record<HumanoidBoneName, { pitch: number; yaw: number; roll: number }>> = {};

    let hipsOffsetX = 0;
    let hipsOffsetY = 0;
    let hipsOffsetZ = 0;
    let proneAngle = 0;

    const b = kf.bones || {};

    // 1. Pelvis / Hips
    if (b.pelvis) {
      if (b.pelvis.loc && Array.isArray(b.pelvis.loc)) {
        hipsOffsetX = (b.pelvis.loc[0] || 0) * 0.7;
        hipsOffsetY = (b.pelvis.loc[2] || 0) * 0.7;
        hipsOffsetZ = (b.pelvis.loc[1] || 0) * 0.7;
      }
      if (b.pelvis.rot && Array.isArray(b.pelvis.rot)) {
        const pitchDeg = b.pelvis.rot[0] || 0;
        if (pitchDeg > 45) {
          // Prone floor exercise (e.g. push_up, plank, superman)
          proneAngle = degToRad(pitchDeg);
        } else if (pitchDeg < -45) {
          // Supine floor exercise (e.g. glute_bridge, crunch)
          proneAngle = degToRad(pitchDeg);
        } else {
          bonesRot.Hips = {
            pitch: degToRad(b.pelvis.rot[0] || 0),
            yaw: degToRad(b.pelvis.rot[1] || 0),
            roll: degToRad(b.pelvis.rot[2] || 0),
          };
        }
      }
    }

    // 2. Spine & Chest (Torso forward flexion)
    if (b.spine && b.spine.rot) {
      bonesRot.Spine = {
        pitch: degToRad(b.spine.rot[0] || 0),
        yaw: degToRad(b.spine.rot[1] || 0),
        roll: degToRad(b.spine.rot[2] || 0),
      };
    }
    if (b.chest && b.chest.rot) {
      bonesRot.Spine1 = {
        pitch: degToRad(b.chest.rot[0] || 0),
        yaw: degToRad(b.chest.rot[1] || 0),
        roll: degToRad(b.chest.rot[2] || 0),
      };
    }

    // 3. Head & Neck
    if (b.head && b.head.rot) {
      bonesRot.Head = {
        pitch: degToRad(b.head.rot[0] || 0),
        yaw: degToRad(b.head.rot[1] || 0),
        roll: degToRad(b.head.rot[2] || 0),
      };
    }

    // 4. Thigh / Femur (Hip flexion forward)
    // In Blender: forward hip flexion is negative rot[0] (e.g. -72 deg).
    // In humanoid anatomical retargeter: forward hip flexion is positive pitch (+72 deg).
    const thighWildcard = b['thigh.*']?.rot;
    const thighL = b['thigh.L']?.rot || thighWildcard;
    const thighR = b['thigh.R']?.rot || thighWildcard;

    if (thighL) {
      bonesRot.LeftUpLeg = {
        pitch: degToRad(-thighL[0]),
        yaw: degToRad(thighL[1] || 0),
        roll: degToRad(Math.abs(thighL[2] || 0)),
      };
    }
    if (thighR) {
      bonesRot.RightUpLeg = {
        pitch: degToRad(-thighR[0]),
        yaw: degToRad(thighR[1] || 0),
        roll: degToRad(Math.abs(thighR[2] || 0)),
      };
    }

    // 5. Shin / Tibia (Knee flexion backward)
    // In Blender: knee flexion is positive rot[0] (e.g. +118 deg).
    // In humanoid anatomical retargeter: knee flexion is positive pitch (+118 deg).
    const shinWildcard = b['shin.*']?.rot;
    const shinL = b['shin.L']?.rot || shinWildcard;
    const shinR = b['shin.R']?.rot || shinWildcard;

    if (shinL) {
      bonesRot.LeftLeg = {
        pitch: degToRad(Math.max(0, shinL[0] || 0)),
        yaw: degToRad(shinL[1] || 0),
        roll: degToRad(shinL[2] || 0),
      };
    }
    if (shinR) {
      bonesRot.RightLeg = {
        pitch: degToRad(Math.max(0, shinR[0] || 0)),
        yaw: degToRad(shinR[1] || 0),
        roll: degToRad(shinR[2] || 0),
      };
    }

    // 6. Foot / Ankle (Dorsiflexion flat)
    // In Blender: ankle dorsiflexion is negative rot[0] (e.g. -35 deg).
    // In humanoid anatomical retargeter: ankle dorsiflexion is positive pitch (+35 deg).
    const footWildcard = b['foot.*']?.rot;
    const footL = b['foot.L']?.rot || footWildcard;
    const footR = b['foot.R']?.rot || footWildcard;

    if (footL) {
      bonesRot.LeftFoot = {
        pitch: degToRad(-(footL[0] || 0)),
        yaw: degToRad(footL[1] || 0),
        roll: degToRad(footL[2] || 0),
      };
    }
    if (footR) {
      bonesRot.RightFoot = {
        pitch: degToRad(-(footR[0] || 0)),
        yaw: degToRad(footR[1] || 0),
        roll: degToRad(footR[2] || 0),
      };
    }

    // 7. Upper Arm (Shoulder / Humerus)
    const uarmData = b['upper_arm.*'] || b['upper_arm.L'] || b['upper_arm.R'];
    if (uarmData) {
      if (uarmData.aim_world) {
        const leftArmPose = solveAimWorldToPitchYawRoll(uarmData.aim_world, false);
        const rightArmPose = solveAimWorldToPitchYawRoll(uarmData.aim_world, true);
        bonesRot.LeftArm = leftArmPose;
        bonesRot.RightArm = rightArmPose;
      } else if (uarmData.rot) {
        const rawPitch = uarmData.rot[0] || 0;
        const rawRoll = uarmData.rot[2] || 0;

        // In Blender T-pose exports:
        // - Arms hanging at sides: rot[0] is -75 to -80 deg
        // - Lateral raise / jumping jack: elevation extends upward
        // - Push up / plank: rot is [0, 0, -85]
        let armPitch = 0;
        let armRoll = 0;

        if (raw.id === 'push_up' || raw.id === 'plank') {
          armPitch = degToRad(75);
          armRoll = degToRad(35);
        } else if (raw.id.includes('lateral') || raw.id.includes('jack')) {
          const elevationDeg = Math.max(0, rawPitch + 75);
          armRoll = degToRad(elevationDeg);
        } else if (raw.id.includes('overhead') || raw.id.includes('press')) {
          armPitch = degToRad(Math.max(0, rawPitch + 55));
          armRoll = degToRad(Math.abs(rawRoll));
        } else {
          const elevationDeg = Math.max(0, rawPitch + 75);
          armPitch = degToRad(elevationDeg);
          armRoll = degToRad(Math.abs(rawRoll));
        }

        bonesRot.LeftArm = { pitch: armPitch, yaw: 0, roll: armRoll };
        bonesRot.RightArm = { pitch: armPitch, yaw: 0, roll: armRoll };
      }
    }

    // 8. Forearm (Elbow Flexion)
    const farmData = b['forearm.*'] || b['forearm.L'] || b['forearm.R'];
    if (farmData) {
      if (farmData.aim_world) {
        bonesRot.LeftForeArm = { pitch: degToRad(15), yaw: 0, roll: 0 };
        bonesRot.RightForeArm = { pitch: degToRad(15), yaw: 0, roll: 0 };
      } else if (farmData.rot) {
        // In Blender exports, elbow flexion is stored as negative roll or pitch
        const angleDeg = Math.max(
          0,
          Math.max(Math.abs(farmData.rot[0] || 0), Math.abs(farmData.rot[2] || 0)) - 5
        );
        const elbowPitch = degToRad(angleDeg);

        bonesRot.LeftForeArm = { pitch: elbowPitch, yaw: 0, roll: 0 };
        bonesRot.RightForeArm = { pitch: elbowPitch, yaw: 0, roll: 0 };
      }
    }

    // 9. Hand / Wrist
    const handData = b['hand.*'] || b['hand.L'] || b['hand.R'];
    if (handData && handData.rot) {
      bonesRot.LeftHand = {
        pitch: degToRad(handData.rot[0] || 0),
        yaw: degToRad(handData.rot[1] || 0),
        roll: degToRad(handData.rot[2] || 0),
      };
      bonesRot.RightHand = {
        pitch: degToRad(handData.rot[0] || 0),
        yaw: degToRad(handData.rot[1] || 0),
        roll: degToRad(handData.rot[2] || 0),
      };
    }

    return {
      time: Math.max(0, Math.min(1, kf.t)),
      hipsOffset: [hipsOffsetX, hipsOffsetY, hipsOffsetZ],
      proneAngle: Math.abs(proneAngle) > 0.05 ? proneAngle : undefined,
      bones: bonesRot,
    };
  });

  return new HumanoidMotionClip(
    raw.id,
    raw.name || raw.id,
    duration,
    motionKeyframes
  );
}

/**
 * Initialize all local clips into memory immediately
 */
function initLocalClips(): void {
  for (const ex of LOCAL_RAW_EXERCISES) {
    if (ex.keyframes && ex.keyframes.length > 0) {
      const clip = convertBlenderKeyframesToMotion(ex);
      if (clip) {
        cachedJsonClips.set(ex.id.toLowerCase(), clip);
      }
    }
  }
}

// Run synchronous initialization immediately
initLocalClips();

/**
 * Fetch and refresh the raw JSON from GitHub if online
 */
export async function loadGithubExercisesJson(): Promise<RawJsonExercise[]> {
  if (cachedRawExercises && cachedJsonClips.size > 0) {
    return cachedRawExercises;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const res = await fetch(EXERCICES_JSON_URL);
      if (!res.ok) {
        return cachedRawExercises;
      }
      const rawText = await res.text();

      const items: RawJsonExercise[] = [];
      let depth = 0;
      let inString = false;
      let escape = false;
      let startIdx = -1;

      for (let i = 0; i < rawText.length; i++) {
        const char = rawText[i];
        if (escape) { escape = false; continue; }
        if (char === '\\') { escape = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        if (!inString) {
          if (char === '{') {
            if (depth === 0) startIdx = i;
            depth++;
          } else if (char === '}') {
            depth--;
            if (depth === 0 && startIdx !== -1) {
              const chunk = rawText.slice(startIdx, i + 1).trim();
              try {
                const parsed = JSON.parse(chunk);
                if (parsed && parsed.id) items.push(parsed);
              } catch (err) {
                // Ignore parse errors on trailing commas
              }
              startIdx = -1;
            }
          }
        }
      }

      if (items.length > 0) {
        cachedRawExercises = items;
        for (const ex of items) {
          if (ex.keyframes && ex.keyframes.length > 0) {
            const clip = convertBlenderKeyframesToMotion(ex);
            if (clip) cachedJsonClips.set(ex.id.toLowerCase(), clip);
          }
        }
      }

      return cachedRawExercises;
    } catch (error) {
      return cachedRawExercises;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Exercise alias dictionary to map any query / French / English label
 * to the corresponding exercise in the clip cache.
 */
const EXERCISE_ALIASES: Record<string, string> = {
  // Squat family
  squat: 'squat',
  squats: 'squat',
  bodyweight_squat: 'squat',
  squats_dynamiques: 'squat',
  dynamic_squat: 'squat',
  sumo_squat: 'sumo_squat',
  back_squat: 'squat',
  overhead_squat: 'squat',
  goblet_squat: 'squat',
  pistol_squat: 'squat',
  air_squat: 'squat',

  // Pushup family
  push_up: 'push_up',
  push_ups: 'push_up',
  pushup: 'push_up',
  pushups: 'push_up',
  pompes: 'push_up',
  pompes_pectoraux: 'push_up',
  pompe: 'push_up',
  diamond_push_up: 'push_up',
  jump_push_up: 'push_up',

  // Plank family
  plank: 'plank',
  gainage: 'plank',
  planche: 'plank',
  gainage_planche_active: 'plank',
  active_plank: 'plank',
  side_plank: 'plank',

  // Lunge family
  lunge: 'lunge',
  lunges: 'lunge',
  forward_lunge: 'lunge',
  fente: 'lunge',
  fentes: 'lunge',
  fentes_alternees: 'lunge',
  fentes_dynamiques: 'lunge',
  reverse_lunge: 'reverse_lunge',
  fentes_arrieres: 'reverse_lunge',

  // Arm / Curl / Press
  bicep_curl: 'bicep_curl',
  curl_biceps: 'bicep_curl',
  curl: 'bicep_curl',
  hammer_curl: 'hammer_curl',
  curl_marteau: 'hammer_curl',
  lateral_raise: 'lateral_raise',
  elevations_laterales: 'lateral_raise',
  front_raise: 'front_raise',
  elevations_frontales: 'front_raise',
  overhead_press: 'overhead_press',
  developpe_militaire: 'overhead_press',
  shoulder_press: 'dumbbell_shoulder_press',
  overhead_tricep_extension: 'overhead_tricep_extension',
  extension_triceps: 'overhead_tricep_extension',

  // Posterior / Core / Cardio
  deadlift: 'deadlift',
  souleve_de_terre: 'deadlift',
  romanian_deadlift: 'romanian_deadlift',
  bent_over_row: 'bent_over_row',
  rowing: 'bent_over_row',
  jumping_jack: 'jumping_jack',
  jumping_jacks: 'jumping_jack',
  high_knees: 'high_knees',
  montees_de_genoux: 'high_knees',
  glute_bridge: 'glute_bridge',
  pont_fessier: 'glute_bridge',
  crunch: 'crunch',
  abdominaux: 'crunch',
  superman: 'superman',
  extensions_lombaires: 'superman',
  wall_sit: 'wall_sit',
  chaise: 'wall_sit',
  calf_raise: 'calf_raise',
  mollets: 'calf_raise',
  elevations_mollets: 'calf_raise',
  good_morning: 'good_morning',
};

/**
 * Get a loaded 3D motion clip by exercise ID, alias, or query string
 */
export function getGithubJsonClip(exerciseIdOrQuery: string): HumanoidMotionClip | null {
  if (!exerciseIdOrQuery) return null;
  const clean = exerciseIdOrQuery.toLowerCase().trim().replace(/[- ]/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Direct alias resolution
  if (EXERCISE_ALIASES[clean]) {
    const targetId = EXERCISE_ALIASES[clean];
    if (cachedJsonClips.has(targetId)) {
      return cachedJsonClips.get(targetId)!;
    }
  }

  // 2. Exact cache ID match
  if (cachedJsonClips.has(clean)) {
    return cachedJsonClips.get(clean)!;
  }

  // 3. Keyword / Substring match
  for (const [alias, targetId] of Object.entries(EXERCISE_ALIASES)) {
    if (clean.includes(alias) || alias.includes(clean)) {
      if (cachedJsonClips.has(targetId)) {
        return cachedJsonClips.get(targetId)!;
      }
    }
  }

  for (const [id, clip] of cachedJsonClips.entries()) {
    if (clean.includes(id) || id.includes(clean)) {
      return clip;
    }
  }

  return null;
}

/**
 * Get all available exercises from the JSON data
 */
export function getCachedGithubExercises(): RawJsonExercise[] {
  return cachedRawExercises || [];
}
